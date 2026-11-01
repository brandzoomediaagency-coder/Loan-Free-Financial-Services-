// Browser test of the settlement calculator on its own page and on the homepage: results, sliders, validation,
// reset, keyboard submit, and privacy (no network request, URL change, storage write, console output or analytics
// parameter carries an entered value). Analytics and pixel beacons are intercepted and answered locally, so the
// test records what would be sent without sending anything to Google or Meta.
// Run with the local server on :8090:  node tools/qa/calculator-browser.mjs
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const exe = fs.readdirSync(process.env.HOME + '/.cache/puppeteer/chrome').filter((d) => d.startsWith('mac_arm-150'))[0];
const b = await puppeteer.launch({ executablePath: `${process.env.HOME}/.cache/puppeteer/chrome/${exe}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`, headless: 'new' });
const base = process.env.BASE || 'http://localhost:8090';
let pass = 0, fail = 0;
const out = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name.padEnd(64) + extra); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
// Scroll a control to mid-screen first so the fixed mobile Call/WhatsApp bar never sits on top of it.
const tap = async (p, sel) => { await p.$eval(sel, (e) => e.scrollIntoView({ block: 'center' })); await p.click(sel); };

const BEACON = /\/g\/collect|google-analytics\.com\/.*collect|facebook\.com\/tr/;
for (const [pagePath, width] of [['/settlement-calculator.html', 1440], ['/settlement-calculator.html', 390], ['/', 1440], ['/', 390]]) {
  const home = pagePath === '/';
  console.log(`-- ${pagePath} at ${width}px`);
  const p = await b.newPage();
  await p.setViewport({ width, height: 900 });
  // Accept all cookies so analytics and ad tags are live: the strictest condition for the privacy test.
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('lf_consent', 'all'); } catch (e) {} });
  const requests = [], consoleMsgs = [];
  await p.setRequestInterception(true);
  p.on('request', (r) => {
    requests.push(r.url() + ' ' + (r.postData() || ''));
    if (BEACON.test(r.url())) r.respond({ status: 204, body: '' }); else r.continue();
  });
  p.on('console', (m) => consoleMsgs.push(m.text()));
  await p.goto(base + pagePath, { waitUntil: 'networkidle2' });
  const startUrl = p.url();
  const storageBefore = await p.evaluate(() => JSON.stringify([Object.keys(localStorage), Object.keys(sessionStorage), document.cookie]));
  const loadRequests = [...requests];
  requests.length = 0;

  // Sliders
  const field = (n) => p.$eval(`[name=${n}]`, (e) => e.value);
  const range = (n) => p.$eval(`#range-${n}`, (e) => ({ value: Number(e.value), text: e.getAttribute('aria-valuetext'), disabled: e.disabled, named: e.hasAttribute('name') }));
  out('sliders are not form fields (no name attribute)', await p.$$eval('[data-lf-calc] input[type=range]', (els) => els.length === 7 && els.every((e) => !e.name)));
  out('hypothetical slider disabled until outstanding is entered', (await range('hypothetical')).disabled);
  await p.focus('#range-outstanding'); await p.keyboard.press('End'); await wait(250);
  out('keyboard End on outstanding slider fills the field', (await field('outstanding')) === '1,00,00,000', await field('outstanding'));
  out('slider announces its value (aria-valuetext)', (await range('outstanding')).text === '₹1,00,00,000', (await range('outstanding')).text);
  out('hypothetical slider enabled once outstanding is set', !(await range('hypothetical')).disabled);
  await p.focus('#range-hypothetical'); await p.keyboard.press('End'); await wait(250);
  out('hypothetical slider maximum is exactly the outstanding amount', (await field('hypothetical')) === '1,00,00,000', await field('hypothetical'));
  await p.keyboard.press('Home'); await wait(250);
  out('hypothetical slider at start clears the field (never suggests 0)', (await field('hypothetical')) === '');
  const inc = await p.$('#range-income'); await p.evaluate((e) => e.scrollIntoView({ block: 'center' }), inc);
  const box = await inc.boundingBox();
  await p.mouse.move(box.x + 12, box.y + box.height / 2); await p.mouse.down();
  await p.mouse.move(box.x + box.width * .5, box.y + box.height / 2, { steps: 6 }); await p.mouse.up(); await wait(300);
  const dragged = await field('income');
  out('mouse drag on income slider fills the field with a round figure', /^[\d,]+$/.test(dragged) && Number(dragged.replace(/,/g, '')) > 0 && Number(dragged.replace(/,/g, '')) % 100 === 0, dragged);
  await tap(p, 'button[type=reset]'); await wait(300);

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
  const rOut = await range('outstanding');
  out('typing moves the slider to match', rOut.value > 0 && rOut.value < 1000 && rOut.text === '₹7,34,219', `${rOut.value} ${rOut.text}`);

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
  await tap(p, 'button[type=reset]'); await wait(300);
  const cleared = await p.evaluate(() => [...document.querySelectorAll('[data-lf-calc] input[type=text]')].every((i) => i.value === '') && [...document.querySelectorAll('[data-lf-calc] input[type=range]')].every((i) => i.value === '0') && document.querySelector('[data-r=capacity]').textContent === '—');
  out('reset clears inputs, sliders and results', cleared);

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
  if (!home) out('Meta Pixel not loaded on calculator page (neutral-URL rule)', !requests.some((u) => u.includes('fbevents') || u.includes('facebook.com/tr')));
  else {
    // The homepage is a neutral URL where the pixel runs after consent: PageView on load, then nothing from the calculator.
    out('homepage: Meta Pixel active after consent (test is meaningful)', loadRequests.some((u) => u.includes('fbevents')));
    const events = requests.filter((u) => u.includes('facebook.com/tr')).map((u) => (u.match(/[?&]ev=([^&\s]+)/) || [])[1]);
    out('homepage: no Meta Pixel event while the calculator is used', events.length === 0, events.join(',') || '0 pixel beacons after load');
  }
  out('slider-produced amounts never sent anywhere', !requests.some((u) => /1%2C00%2C00%2C000|1,00,00,000|10000000/.test(u)));

  // Consultation CTA opens the secure dialog without carrying values
  await type('outstanding', '734219'); await p.keyboard.press('Tab');
  await tap(p, '.calc-cta [data-lf-consult]'); await wait(400);
  const dlg = await p.evaluate(() => ({ open: document.getElementById('consult').open, carried: [...document.querySelectorAll('#consult input, #consult textarea')].some((i) => i.value.includes('734')) }));
  out('consultation CTA opens dialog and carries no calculator values', dlg.open && !dlg.carried);
  const wa = await p.evaluate(() => [...document.querySelectorAll('a[href^="https://wa.me"]')].map((a) => a.href).join(' '));
  out('WhatsApp links contain no calculator values', !wa.includes('734219'));
  await p.close();
}
await b.close();
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
