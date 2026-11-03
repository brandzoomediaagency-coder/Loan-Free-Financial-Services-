// Element screenshots of the Loan Settlement & Legal Fee Calculator, for QA reports.
// The fixed header, call bar and floating WhatsApp button are hidden so nothing overlaps the element.
// Analytics and pixel requests are answered locally; consent is set to "essential".
//
//   node tools/build.mjs && node tools/serve.mjs --root dist --port 8090 &
//   node tools/qa/calculator-screenshots.mjs <outdir> <prefix> <amount or ""> <widths> [page] [selector]
//
// Example (the set in docs/calculator/screenshots/pricing-update/):
//   node tools/qa/calculator-screenshots.mjs docs/calculator/screenshots/pricing-update after-10-lakh 1000000 375,390,430,768,1024,1440
//   node tools/qa/calculator-screenshots.mjs docs/calculator/screenshots/pricing-update after-1-crore 10000000 1440 /settlement-calculator.html .calc-card-fee
// BASE (default http://localhost:8090) points at another server, e.g. a build of the previous version.
// Shots are 1× PNGs, reduced to a 256-colour palette when Python with Pillow is available.
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const { chromium } = createRequire(import.meta.url)('playwright');

const [outdir, prefix, amount, widths, pagePath = '/settlement-calculator.html', selector = '.calc'] = process.argv.slice(2);
if (!outdir || !prefix || widths == null) {
  console.error('Usage: node tools/qa/calculator-screenshots.mjs <outdir> <prefix> <amount or ""> <widths> [page] [selector]');
  process.exit(1);
}
const base = process.env.BASE || 'http://localhost:8090';
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const files = [];
for (const width of widths.split(',').map(Number)) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => { try { localStorage.setItem('lf_consent', 'essential'); } catch (e) {} });
  await ctx.route(/googletagmanager\.com|connect\.facebook\.net|google-analytics\.com|facebook\.com\/tr/, (r) => r.fulfill({ status: 204, body: '' }));
  const p = await ctx.newPage();
  await p.goto(base + pagePath, { waitUntil: 'load' });
  if (amount) { await p.fill('#calc-amount', amount); await p.locator('#calc-amount').blur(); }
  await p.addStyleTag({ content: '.site-header, .sticky-bar, .wa-float, .consent-banner { visibility: hidden !important; }' });
  await p.waitForTimeout(300);
  const file = `${outdir}/${prefix}-${width}.png`;
  await p.locator(selector).first().screenshot({ path: file });
  files.push(file);
  await ctx.close();
}
await browser.close();
const py = spawnSync('python3', ['-c', `import sys
from PIL import Image
for f in sys.argv[1:]:
    Image.open(f).convert('RGB').quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE).save(f, optimize=True)`, ...files], { encoding: 'utf8' });
console.log(`${files.length} screenshot(s) written${py.status === 0 ? ' (palette-reduced)' : ' (full colour; Pillow not available)'}: ${files.join(', ')}`);
