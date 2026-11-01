#!/usr/bin/env node
// Generates brand-template images from page front matter with headless Chrome:
//   assets/og/<slug>.jpg       1200x630 social share card for every page
//   (guide thumbnails now come from tools/guide-images.mjs; LF_TEXT_THUMBS=1 restores text cards)
// Run after changing a page title/H1:  CHROME_PATH=... node tools/media.mjs
// Requires: Chrome/Chromium (CHROME_PATH), cwebp and macOS `sips` (or edit `toJpeg`).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = process.env.CHROME_PATH;
if (!CHROME) { console.error('Set CHROME_PATH to a Chrome/Chromium binary.'); process.exit(1); }
const only = process.argv.slice(2);
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'lf-media-'));
// Fonts are inlined as data URIs: Chrome blocks file:// fonts as cross-origin.
const font = (f) => 'data:font/woff2;base64,' + fs.readFileSync(path.join(ROOT, 'assets/fonts', f)).toString('base64');
const icon = (name) => {
  const f = path.join(ROOT, 'src/icons', (name || 'scale-balanced') + '.svg');
  return fs.readFileSync(fs.existsSync(f) ? f : path.join(ROOT, 'src/icons/scale-balanced.svg'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const CATS = {
  rights: ['Borrower rights', '#0f766e'], settlement: ['Settlement', '#00875a'], credit: ['Credit report', '#7c3aed'],
  legal: ['Legal notices', '#b45309'], apps: ['Digital lending', '#0369a1'], default: ['Missed EMIs', '#be123c'],
};

function pages() {
  const dir = path.join(ROOT, 'src/pages');
  const out = [];
  (function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!p.endsWith('.html')) continue;
      const raw = fs.readFileSync(p, 'utf8');
      const fm = JSON.parse(raw.match(/^<!--page\s*([\s\S]*?)\s*-->/)[1]);
      const rel = path.relative(dir, p).split(path.sep).join('/');
      const h1 = (raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
      const slug = rel.replace(/\.html$/, '').replace(/\//g, '-').replace(/-index$/, '') || 'home';
      out.push({ ...fm, rel, slug: slug === 'index' ? 'home' : slug, h1: fm.h1 || (h1 ? h1.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : fm.title) });
    }
  })(dir);
  return out;
}

const base = (w, h, body, extraCss = '') => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:LfP;font-weight:700;font-display:block;src:url(${font('poppins-700-latin.woff2')})}
@font-face{font-family:LfP;font-weight:600;font-display:block;src:url(${font('poppins-600-latin.woff2')})}
@font-face{font-family:LfP;font-weight:700;font-display:block;src:url(${font('poppins-700-devanagari.woff2')});unicode-range:U+0900-097F}
@font-face{font-family:LfI;font-display:block;src:url(${font('inter-var-latin.woff2')})}
*{margin:0;box-sizing:border-box}html,body{width:${w}px;height:${h}px;overflow:hidden}
body{font-family:LfI,sans-serif;color:#fff;background:radial-gradient(circle at 12% 18%,rgba(0,184,107,.16) 0,transparent 42%),radial-gradient(circle at 90% 88%,rgba(199,154,58,.16) 0,transparent 40%),linear-gradient(135deg,#133150 0%,#102a43 50%,#0a1c30 100%);position:relative}
.bar{position:absolute;left:0;right:0;bottom:0;height:10px;background:linear-gradient(90deg,#00875a,#c79a3a)}
.brand{display:flex;align-items:center;gap:16px}.brand img{width:64px;height:64px;border-radius:12px;background:#fff;padding:4px}
.bn{font:700 26px/1 LfP,sans-serif;letter-spacing:.04em}.bs{font:600 13px/1.4 LfP,sans-serif;letter-spacing:.18em;color:#cbd5e1}
${extraCss}</style></head><body>${body}<div class="bar"></div></body></html>`;

const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'loan-free-logo.png')).toString('base64');

function ogHtml(p) {
  const kicker = p.lang === 'hi' ? 'हिन्दी गाइड' : ({ service: 'Service', article: 'Guide', home: 'Debt resolution consultancy', about: 'About us', contact: 'Contact', faq: 'FAQ', collection: 'Resources', legal: 'Policy' }[p.type] || 'Loan Free');
  const title = p.h1.length > 90 ? p.h1.slice(0, 87) + '…' : p.h1;
  const size = title.length > 60 ? 50 : title.length > 40 ? 58 : 66;
  return base(1200, 630, `<div style="padding:64px 72px;height:100%;display:flex;flex-direction:column">
    <div class="brand"><img src="${logo}"><div><div class="bn">LOAN FREE</div><div class="bs">FINANCIAL SERVICES</div></div></div>
    <div style="margin-top:auto;margin-bottom:auto;max-width:960px">
      <div style="display:inline-block;font:600 18px LfP,sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#f3e7c6;border:1px solid rgba(243,231,198,.4);border-radius:999px;padding:8px 18px;margin-bottom:26px">${esc(kicker)}</div>
      <div style="font:700 ${size}px/1.15 LfP,sans-serif;letter-spacing:-.01em">${esc(title)}</div>
    </div>
    <div style="display:flex;justify-content:space-between;font:500 20px LfI,sans-serif;color:#cbd5e1"><span>www.loanfree.info</span><span>Delhi office · Support across India</span></div>
  </div>
  <div style="position:absolute;right:64px;top:56px;width:120px;height:120px;fill:rgba(255,255,255,.10)">${icon(p.icon)}</div>`);
}

function thumbHtml(p) {
  const [label, color] = CATS[p.category] || ['Guide', '#00875a'];
  const title = p.h1.length > 80 ? p.h1.slice(0, 77) + '…' : p.h1;
  return base(1200, 800, `<div style="padding:72px;height:100%;display:flex;flex-direction:column">
    <div style="display:flex;align-items:center;gap:28px">
      <div style="width:150px;height:150px;border-radius:36px;background:${color};display:flex;align-items:center;justify-content:center;box-shadow:0 20px 40px rgba(0,0,0,.25)"><div style="width:80px;height:80px;fill:#fff">${icon(p.icon)}</div></div>
      <div style="font:600 30px LfP,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#f3e7c6">${esc(label)}</div>
    </div>
    <div style="margin-top:auto;font:700 ${title.length > 55 ? 66 : 76}px/1.12 LfP,sans-serif">${esc(title)}</div>
    <div style="margin-top:36px;font:600 26px LfP,sans-serif;color:#cbd5e1;letter-spacing:.06em">LOAN FREE · GUIDE</div>
  </div>`, `svg{width:100%;height:100%}`);
}

function shoot(html, w, h, out) {
  const file = path.join(TMP, 'card.html');
  fs.writeFileSync(file, html);
  const png = path.join(TMP, 'shot.png');
  execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, '--allow-file-access-from-files', '--virtual-time-budget=3000', `--screenshot=${png}`, 'file://' + file], { stdio: 'ignore' });
  return png;
}

fs.mkdirSync(path.join(ROOT, 'assets/og'), { recursive: true });
fs.mkdirSync(path.join(ROOT, 'assets/thumbs'), { recursive: true });
let n = 0;
for (const p of pages()) {
  if (only.length && !only.includes(p.slug)) continue;
  const png = shoot(ogHtml(p), 1200, 630);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', png, '--out', path.join(ROOT, 'assets/og', p.slug + '.jpg')], { stdio: 'ignore' });
  // Guide thumbnails are no longer text cards: tools/guide-images.mjs draws a
  // topic-specific illustration for each guide. Set LF_TEXT_THUMBS=1 to restore.
  if (p.type === 'article' && process.env.LF_TEXT_THUMBS === '1') {
    const t = shoot(thumbHtml(p), 1200, 800);
    const name = p.slug.replace(/^blog-/, '');
    execFileSync('cwebp', ['-quiet', '-q', '78', '-resize', '600', '400', t, '-o', path.join(ROOT, 'assets/thumbs', name + '.webp')]);
    execFileSync('cwebp', ['-quiet', '-q', '74', t, '-o', path.join(ROOT, 'assets/thumbs', name + '-1200.webp')]);
  }
  n++;
}
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`Generated media for ${n} pages`);
