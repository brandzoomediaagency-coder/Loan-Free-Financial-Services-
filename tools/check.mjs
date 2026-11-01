#!/usr/bin/env node
// Quality gate for dist/: run after `node tools/build.mjs`.
//   node tools/check.mjs          report and exit 1 on errors
//   node tools/check.mjs --json   machine-readable inventory (metadata, schema)
//
// Errors: broken internal links/images, invalid JSON-LD, missing or multiple
// H1, canonical mismatch, duplicate titles/descriptions, banned claims.
// Warnings: title/description length, heading-level skips.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const ORIGIN = 'https://www.loanfree.info';
const vercel = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
const redirectSources = new Set(vercel.redirects.filter((r) => !r.has).map((r) => r.source));

// Phrases that must not appear in published copy (unsupported claims or
// superseded law). Each entry: [regex, reason].
const BANNED = [
  [/most trusted/i, 'unsubstantiated superlative'],
  [/\b1000s\b|thousands of (peaceful|recovery|clients|borrowers we)/i, 'unverifiable number'],
  [/RBI[- ]compliant/i, 'implies RBI approval'],
  [/RBI[- ]aligned debt resolution/i, 'implies RBI approval'],
  [/credit score repair|credit repair strategy/i, 'implies guaranteed credit repair'],
  [/free legal advice/i, 'advice framing (Bar Council Rule 36 review)'],
  [/within 30 minutes|within hours/i, 'service-level promise'],
  [/protective shield|legal shield|act as a shield/i, 'implies guaranteed protection'],
  [/(?<!replaced the )(Indian Penal Code|\bIPC\b)/, 'IPC replaced by BNS from 1 July 2024'],
  [/Banking Ombudsman/i, 'use RB-IOS 2026 terminology'],
  [/Guidelines on Digital Lending \(2022\)|Digital Lending Guidelines,? 2022|issued in 2022, updated 2025/i, 'replaced by Digital Lending Directions, 2025'],
  [/7:00 AM and 7:00 PM|7 ?AM (to|and|–|-) ?7 ?PM/i, 'calling window is 08:00–19:00'],
  [/since 2020/i, 'founding year not verified'],
  [/fixed fees/i, 'no fees published'],
  [/fa-[a-z-]*dollar/, 'dollar icon'],
  [/\$\$/, 'dollar priceRange'],
];

const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p); else if (p.endsWith('.html')) files.push(p);
  }
})(DIST);

const errors = [];
const warnings = [];
const inventory = [];
const titles = new Map();
const descs = new Map();
const inbound = new Map();
const strip = (s) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

for (const file of files) {
  const rel = '/' + path.relative(DIST, file).split(path.sep).join('/');
  const urlPath = rel === '/index.html' ? '/' : rel.replace(/\/index\.html$/, '/');
  const html = fs.readFileSync(file, 'utf8');
  const noindex = /<meta name="robots" content="noindex/.test(html);
  const title = (html.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '';
  const desc = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || '';
  const canonical = (html.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
  const err = (m) => errors.push(`${urlPath}: ${m}`);
  const warn = (m) => warnings.push(`${urlPath}: ${m}`);
  const isErrorPage = urlPath === '/404.html';

  if (!isErrorPage) {
    if (canonical !== ORIGIN + urlPath) err(`canonical ${canonical} != ${ORIGIN + urlPath}`);
    const tLen = [...title.replace(/&amp;/g, '&')].length;
    const dLen = [...desc.replace(/&amp;/g, '&')].length;
    if (tLen > 62 || tLen < 30) warn(`title length ${tLen}: ${title}`);
    if (dLen > 160 || dLen < 120) warn(`description length ${dLen}`);
    if (!noindex) {
      if (titles.has(title)) err(`duplicate title with ${titles.get(title)}`); else titles.set(title, urlPath);
      if (descs.has(desc)) err(`duplicate description with ${descs.get(desc)}`); else descs.set(desc, urlPath);
    }
  }

  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const h1s = (html.match(/<h1[\s>]/g) || []).length;
  if (h1s !== 1) err(`${h1s} <h1> elements`);
  let prev = 1;
  for (const m of main.matchAll(/<h([1-6])[\s>]/g)) {
    const lvl = Number(m[1]);
    if (lvl > prev + 1) warn(`heading skip h${prev} -> h${lvl}`);
    prev = lvl;
  }

  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try { JSON.parse(m[1]); } catch (e) { err('invalid JSON-LD: ' + e.message); }
  }
  const types = [...html.matchAll(/"@type":"(\w+)"/g)].map((m) => m[1]);

  for (const m of html.matchAll(/\s(?:href|src)="(\/[^"#?]*)/g)) {
    let ref = m[1];
    if (ref.startsWith('/api/')) continue;
    if (redirectSources.has(ref)) continue;
    const target = ref.endsWith('/') ? ref + 'index.html' : ref;
    if (!fs.existsSync(path.join(DIST, decodeURIComponent(target)))) err(`broken link/asset ${ref}`);
    else if (ref.endsWith('.html') || ref.endsWith('/')) {
      const key = ref === '/index.html' ? '/' : ref;
      if (key !== urlPath) inbound.set(key, (inbound.get(key) || 0) + 1);
    }
  }
  for (const m of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const u = part.trim().split(' ')[0].split('?')[0];
      if (u.startsWith('/') && !fs.existsSync(path.join(DIST, u))) err(`missing srcset image ${u}`);
    }
  }
  for (const m of html.matchAll(/<img\b[^>]*>/g)) {
    if (!/\salt="/.test(m[0])) err('img without alt: ' + m[0].slice(0, 80));
  }

  const visible = strip(main);
  for (const [re, why] of BANNED) {
    const hit = (visible.match(re) || html.match(/fa-[a-z-]*dollar|\$\$/))?.[0];
    if (re.test(visible) || (/dollar|\\\$/.test(re.source) && re.test(html))) err(`banned phrase "${hit}" (${why})`);
  }

  inventory.push({ path: urlPath, title, titleLength: [...title.replace(/&amp;/g, '&')].length, description: desc, descriptionLength: [...desc.replace(/&amp;/g, '&')].length, canonical, robots: noindex ? 'noindex' : 'index', schema: [...new Set(types)].join(', ') });
}

// Orphans: indexable pages with no inbound links from other pages.
for (const inv of inventory) {
  if (inv.robots === 'index' && inv.path !== '/' && inv.path !== '/404.html' && !inbound.get(inv.path)) warnings.push(`${inv.path}: orphan (no internal links in)`);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ inventory, inbound: Object.fromEntries(inbound) }, null, 2));
} else {
  for (const w of warnings) console.log('WARN ', w);
  for (const e of errors) console.log('ERROR', e);
  console.log(`\n${files.length} pages checked: ${errors.length} errors, ${warnings.length} warnings`);
}
process.exit(errors.length ? 1 : 0);
