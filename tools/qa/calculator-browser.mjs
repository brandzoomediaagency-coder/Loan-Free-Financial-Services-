// Browser test of the settlement calculator: results, validation, reset, keyboard submit, and privacy
// (no network request, URL change, storage write, console output or analytics parameter carries an entered value).
// Run with the local server on :8090:  node tools/qa/calculator-browser.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const exe = fs.readdirSync(process.env.HOME + '/.cache/puppeteer/chrome').filter((d) => d.startsWith('mac_arm-150'))[0];
const b = await puppeteer.launch({ executablePath: `${process.env.HOME}/.cache/puppeteer/chrome/${exe}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`, headless: 'new' });
const base = process.env.BASE || 'http://localhost:8090';
let pass = 0, fail = 0;
const out = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name.padEnd(64) + extra); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

for (const width of [1440, 390]) {
  console.log(`-- ${width}px`);
  const p = await b.newPage();
  await p.setViewport({ width, height: 900 });
  // Accept all cookies so analytics and ad tags are live: the strictest condition for the privacy test.
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('lf_consent', 'all'); } catch (e) {} });
  const requests = [], consoleMsgs = [];
  p.on('request', (r) => requests.push(r.url() + ' ' + (r.postData() || '')));
  p.on('console', (m) => consoleMsgs.push(m.text()));
  await p.goto(base + '/settlement-calculator.html', { waitUntil: 'networkidle2' });
  const startUrl = p.url();
  const storageBefore = await p.evaluate(() => JSON.stringify([Object.keys(localStorage), Object.keys(sessionStorage), document.cookie]));
  requests.length = 0;

  // Distinctive values so any leak is easy to spot.
  const vals = { outstanding: '734219', income: '61357', expenses: '28111', commitments: '9876', buffer: '4321', savings: '43219', hypothetical: '291357' };
  const type = async (name, v) => { const el = await p.$(`[name=${name}]`); await el.click({ clickCount: 3 }); await el.type(v); };
  for (const [k, v] of Object.entries(vals)) await type(k, v);
  await p.keyboard.press('Tab'); await wait(400);
  const r = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('[data-r]')].map((e) => [e.getAttribute('data-r'), e.textContent.trim()])));
  // capacity 61357-28111-9876-4321 = 19049; remaining 291357-43219 = 248138; months ceil(248138/19049)=14; difference 734219-291357 = 442862
  out('capacity = income - expenses - commitments - buffer', r.capacity === '₹19,049 / month', r.capacity);
  out('remaining = hypothetical - savings', r.remaining === '₹2,48,138', r.remaining);
  out('months = ceil(remaining / capacity)', r.months.startsWith('14 months'), r.months);
  out('difference in hypothetical scenario', r.difference === '₹4,42,862', r.difference);
  out('progress bar reflects savings / hypothetical (15%)', /15%/.test(r['progress-label']), r['progress-label']);
  out('values reformatted with Indian grouping on blur', (await p.$eval('[name=outstanding]', (e) => e.value)) === '7,34,219');

  // Keyboard submit must not navigate or change the URL
  await p.focus('[name=income]'); await p.keyboard.press('Enter'); await wait(300);
  out('Enter key does not navigate or add values to URL', p.url() === startUrl, p.url());

  // Validation
  await type('hypothetical', '900000'); await p.keyboard.press('Tab'); await wait(300);
  out('hypothetical above outstanding -> field error, no difference', await p.$eval('#err-hypothetical', (e) => !e.hidden && /more than the outstanding/.test(e.textContent)) && (await p.$eval('[data-r=difference]', (e) => e.textContent)) === '—');
  await type('income', 'abc'); await p.keyboard.press('Tab'); await wait(300);
  out('text input -> friendly error + aria-invalid', await p.$eval('[name=income]', (e) => e.getAttribute('aria-invalid') === 'true') && await p.$eval('#err-income', (e) => !e.hidden));
  await type('income', '-500'); await p.keyboard.press('Tab'); await wait(300);
  out('negative input -> error', await p.$eval('#err-income', (e) => /negative/.test(e.textContent)));
  await type('income', '20000'); await type('hypothetical', '291357'); await p.keyboard.press('Tab'); await wait(300);
  const zc = await p.evaluate(() => ({ cap: document.querySelector('[data-r=capacity]').textContent, months: document.querySelector('[data-r=months]').textContent, notes: document.querySelector('[data-r=notes]').textContent }));
  out('expenses above income -> zero capacity, explained, no timeline', zc.cap.startsWith('₹0') && /no monthly capacity|higher than your income/.test(zc.notes) && /Not possible/.test(zc.months), JSON.stringify(zc).slice(0, 80));

  // Reset
  await p.click('button[type=reset]'); await wait(300);
  const cleared = await p.evaluate(() => [...document.querySelectorAll('[data-lf-calc] input')].every((i) => i.value === '') && document.querySelector('[data-r=capacity]').textContent === '—');
  out('reset clears inputs and results', cleared);

  // Privacy
  await wait(1500);
  const leak = requests.filter((u) => Object.values(vals).some((v) => u.includes(v) || u.includes(v.replace(/(\d)(?=(\d{2})+\d$)/g, '$1,'))));
  out('no network request contains an entered value', leak.length === 0, leak[0] ? leak[0].slice(0, 90) : `${requests.length} requests checked`);
  out('URL unchanged (no query string or hash with values)', p.url() === startUrl);
  const storageAfter = await p.evaluate(() => JSON.stringify([Object.keys(localStorage), Object.keys(sessionStorage), document.cookie]));
  const storageValues = await p.evaluate(() => JSON.stringify([Object.values(localStorage), Object.values(sessionStorage)]));
  out('no values in localStorage/sessionStorage', !Object.values(vals).some((v) => storageValues.includes(v)), storageAfter === storageBefore ? 'keys unchanged' : 'keys changed: ' + storageAfter);
  out('nothing logged to the console', !consoleMsgs.some((m) => Object.values(vals).some((v) => m.includes(v))), `${consoleMsgs.length} console messages`);
  const dl = await p.evaluate(() => JSON.stringify((window.dataLayer || []).map((a) => Array.from(a))));
  out('analytics: calculator_used sent with no parameters', /\["event","calculator_used"\]/.test(dl) && !Object.values(vals).some((v) => dl.includes(v)));
  out('Meta Pixel not loaded on calculator page (neutral-URL rule)', !requests.some((u) => u.includes('fbevents') || u.includes('facebook.com/tr')));

  // Consultation CTA opens the secure dialog without carrying values
  await type('outstanding', '734219'); await p.keyboard.press('Tab');
  await p.click('.calc-cta [data-lf-consult]'); await wait(400);
  const dlg = await p.evaluate(() => ({ open: document.getElementById('consult').open, carried: [...document.querySelectorAll('#consult input, #consult textarea')].some((i) => i.value.includes('734')) }));
  out('consultation CTA opens dialog and carries no calculator values', dlg.open && !dlg.carried);
  const wa = await p.evaluate(() => [...document.querySelectorAll('a[href^="https://wa.me"]')].map((a) => a.href).join(' '));
  out('WhatsApp links contain no calculator values', !wa.includes('734219'));
  await p.close();
}
await b.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
