#!/usr/bin/env node
// One-time migration (Phase 2, 31 Oct 2026): converts the legacy hand-copied
// HTML pages in the project root into src/pages/ sources that tools/build.mjs
// assembles. Kept in the repo as a record of how the sources were produced.
//
// For each legacy page it keeps only the page-owned content (hero, breadcrumbs
// position, main content) and seeds a JSON front-matter block from the page's
// existing <head> and JSON-LD. Shared header, footer, popup, sticky bar and
// scripts are dropped because the build now generates them.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OUT = path.join(ROOT, 'src/pages');

const legacy = [
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith('.html')),
  ...fs.readdirSync(path.join(ROOT, 'blog')).filter((f) => f.endsWith('.html')).map((f) => 'blog/' + f),
];

const decode = (s) => s.replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

// Resolve a relative href/src from a legacy file to a root-absolute path.
function absolutise(ref, file) {
  if (/^(https?:|mailto:|tel:|#|data:|\/)/.test(ref)) return ref;
  const dir = path.posix.dirname('/' + file);
  let abs = path.posix.normalize(path.posix.join(dir, ref));
  if (abs === '/index.html') abs = '/';
  return abs;
}

function jsonLd(head) {
  const nodes = [];
  for (const m of head.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const d = JSON.parse(m[1]);
      nodes.push(...(d['@graph'] || [d]));
    } catch { /* ignore malformed legacy blocks */ }
  }
  return nodes;
}

function pageType(file, nodes) {
  if (file === 'index.html') return 'home';
  if (file === '404.html') return 'error';
  if (file.startsWith('blog/')) return 'article';
  if (['privacy-policy.html', 'terms.html', 'disclaimer.html', 'editorial-policy.html'].includes(file)) return 'legal';
  if (nodes.some((n) => n['@type'] === 'Service')) return 'service';
  return 'page';
}

fs.mkdirSync(path.join(OUT, 'blog'), { recursive: true });

for (const file of legacy) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  const head = html.slice(0, html.indexOf('</head>'));
  const nodes = jsonLd(head);
  const meta = (name) => (head.match(new RegExp(`name="${name}"\\s+content="([^"]*)"`)) || [])[1];

  const article = nodes.find((n) => n['@type'] === 'Article' || n['@type'] === 'BlogPosting');
  const service = nodes.find((n) => n['@type'] === 'Service');
  const crumbs = [];
  const crumbNav = html.match(/<nav class="breadcrumbs"[^>]*>([\s\S]*?)<\/nav>/);
  if (crumbNav) {
    for (const li of crumbNav[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/g)) {
      const a = li[1].match(/<a href="([^"]+)">([\s\S]*?)<\/a>/);
      crumbs.push(a ? [decode(a[2]), absolutise(a[1], file)] : [decode(li[1].replace(/<[^>]+>/g, ''))]);
    }
  }

  const front = {
    title: decode((head.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || ''),
    description: decode(meta('description') || ''),
    type: pageType(file, nodes),
    breadcrumbs: crumbs.slice(1).map((c, i, arr) => (i === arr.length - 1 ? [c[0]] : c)),
    datePublished: article?.datePublished,
    dateModified: article?.dateModified || '2026-08-18',
    image: article?.image ? '/' + String(article.image.url || article.image).replace(/^https:\/\/www\.loanfree\.info\//, '') : undefined,
    service: service ? { name: service.name, serviceType: service.serviceType } : undefined,
    legacyTemplate: /RBI-compliant legal solutions|Credit Score Repair/.test(html) || undefined,
  };

  // Page-owned body: after the primary navbar, before the shared footer.
  const bodyStart = html.indexOf('</nav>', html.indexOf('<nav class="navbar"')) + '</nav>'.length;
  const bodyEnd = html.indexOf('<footer');
  let body = html.slice(bodyStart, bodyEnd);

  body = body
    .replace(/<\/?main[^>]*>/g, '')
    .replace(/<nav class="breadcrumbs"[\s\S]*?<\/nav>/, '<!-- lf:breadcrumbs -->')
    .replace(/<a href="#"\s+onclick="lfOpenPopup\(\);return false;"/g, '<a href="#consult" data-lf-consult')
    .replace(/\s(href|src)="([^"]+)"/g, (m, attr, ref) => ` ${attr}="${absolutise(ref, file)}"`)
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const clean = JSON.parse(JSON.stringify(front)); // drops undefined keys
  const out = `<!--page\n${JSON.stringify(clean, null, 2)}\n-->\n${body}\n`;
  fs.writeFileSync(path.join(OUT, file), out);
  console.log('migrated', file, front.type, front.legacyTemplate ? '(legacy template)' : '');
}
