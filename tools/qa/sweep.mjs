// All built pages x 6 widths: overflow, console errors, failed requests, small tap targets (<44px) in main content.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';
const DIST = process.argv[2];
const exe = fs.readdirSync(process.env.HOME + '/.cache/puppeteer/chrome').filter(d => d.startsWith('mac_arm-150'))[0];
const b = await puppeteer.launch({ executablePath: `${process.env.HOME}/.cache/puppeteer/chrome/${exe}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`, headless: 'new' });
const pages = [];
(function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory() && e.name !== 'assets') walk(p); else if (e.name.endsWith('.html')) pages.push('/' + path.relative(DIST, p).replace(/index\.html$/, '')); } })(DIST);
pages.sort();
const widths = [375, 390, 430, 768, 1024, 1440];
let problems = 0; const small = new Map();
for (const url of pages) for (const w of widths) {
  const p = await b.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('requestfailed', r => { if (!/google|facebook|gtag/.test(r.url())) errs.push('failed ' + r.url()); });
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('lf_consent', 'essential'); } catch (e) {} });
  await p.setViewport({ width: w, height: 900 });
  await p.goto('http://localhost:8090' + url, { waitUntil: 'networkidle2' });
  const r = await p.evaluate(() => {
    const ov = document.documentElement.scrollWidth - document.documentElement.clientWidth;
    const tiny = [...document.querySelectorAll('main a, main button, main input, main select, header a, header button')]
      .filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.height < 44 && !e.closest('p, li, td, .breadcrumbs, .accordion-content, .sources, .review-box, .form-privacy, .consent-check, .field-hint, .table-note, figcaption, .toc, .doc-toc, .topbar, .sub-menu, .related-grid'); })
      .map(e => (e.className || e.tagName) + ':' + Math.round(e.getBoundingClientRect().height));
    return { ov, tiny: [...new Set(tiny)].slice(0, 4) };
  });
  if (w <= 430) r.tiny.forEach(t => small.set(t, (small.get(t) || 0) + 1));
  if (r.ov > 0 || errs.length) { problems++; console.log(url, w, 'overflow', r.ov, errs.slice(0, 2)); }
  await p.close();
}
console.log(`${pages.length} pages x ${widths.length} widths = ${pages.length * widths.length} loads; ${problems} with overflow/errors`);
console.log('small tap targets (<44px) at <=430px:', JSON.stringify([...small.entries()].slice(0, 15)));
await b.close();
