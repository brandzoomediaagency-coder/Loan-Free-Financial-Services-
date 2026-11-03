// Browser test of the Loan Settlement & Legal Fee Calculator on its own page and on the homepage:
// live results and Indian formatting, fee-tier boundaries, empty/invalid input, the loan-type
// multi-select (mouse, keyboard, outside click, Escape, select/clear all, chips), responsive
// dropdown fit at 375–1440 px, the consultation/WhatsApp CTAs and the lead-form WhatsApp fallback,
// and privacy (no entered value in any request, the URL, storage, the console or analytics).
//
// Analytics and pixel beacons are always intercepted and answered locally, so nothing reaches Google or
// Meta. By default the tag scripts themselves (gtag.js, gtm.js, fbevents.js) are replaced with empty
// stubs, so the checks rely on window.dataLayer and on every request the page makes. Set LIVE_TAGS=1
// on a machine with internet access to load the real tag scripts too (beacons are still intercepted
// and inspected for entered values).
//
// Run with the local server on :8090:
//   node tools/build.mjs && node tools/serve.mjs --root dist --port 8090 &
//   node tools/qa/calculator-browser.mjs
// Needs Playwright with Chromium (npm i --no-save playwright && npx playwright install chromium),
// or set CHROMIUM_PATH to an existing Chromium/Chrome binary.
import { createRequire } from 'node:module';
// createRequire also finds a globally installed Playwright (NODE_PATH), which ESM imports do not.
const { chromium } = createRequire(import.meta.url)('playwright');

const base = process.env.BASE || 'http://localhost:8090';
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
let pass = 0, fail = 0;
const out = (name, ok, extra = '') => { ok ? pass++ : fail++; console.log((ok ? 'PASS ' : 'FAIL ') + name.padEnd(70) + extra); };
const WA_NUMBER = '917042538878'; // SITE.whatsapp in src/site.config.mjs
const BEACON = /google-analytics\.com|\/g\/collect|facebook\.com\/tr/;
const TAG_SCRIPT = /googletagmanager\.com|connect\.facebook\.net/;
const LIVE_TAGS = process.env.LIVE_TAGS === '1';

async function openPage(pagePath, width, { consent = 'all' } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: width > 800 ? 900 : 844 } });
  // "Accept all" so analytics and ad tags are live: the strictest condition for the privacy checks.
  await ctx.addInitScript((c) => { try { localStorage.setItem('lf_consent', c); } catch (e) {} }, consent);
  const requests = [], consoleMsgs = [], errors = [];
  await ctx.route(BEACON, (r) => r.fulfill({ status: 204, body: '' }));
  if (!LIVE_TAGS) await ctx.route(TAG_SCRIPT, (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  const p = await ctx.newPage();
  p.on('request', (r) => requests.push(r.url() + ' ' + (r.postData() || '')));
  p.on('console', (m) => consoleMsgs.push(m.text()));
  p.on('pageerror', (e) => errors.push(e.message));
  await p.goto(base + pagePath, { waitUntil: 'load' });
  return { ctx, p, requests, consoleMsgs, errors };
}
const text = (p, key) => p.locator(`[data-calc-results] [data-r="${key}"]`).first().innerText();
async function typeAmount(p, value) {
  await p.fill('#calc-amount', '');
  await p.locator('#calc-amount').pressSequentially(value);
}

for (const [pagePath, width] of [['/settlement-calculator.html', 1440], ['/settlement-calculator.html', 390], ['/', 1440], ['/', 390]]) {
  const home = pagePath === '/';
  console.log(`-- ${pagePath} at ${width}px`);
  const { ctx, p, requests, consoleMsgs, errors } = await openPage(pagePath, width);
  const startUrl = p.url();
  const loadRequests = [...requests];
  requests.length = 0;

  // Empty state: no misleading zero values.
  const empty = await p.evaluate(() => [...document.querySelectorAll('[data-calc-results] [data-r]')].map((e) => e.textContent).join(' | '));
  out('empty state: no ₹0 values, helpful prompt shown', !/₹0\b/.test(empty) && /Enter your total outstanding loan amount/.test(empty));
  out('empty state: fee percentage and amounts show a dash', (await text(p, 'fee')) === '—' && (await text(p, 'settlement')) === '—' && (await text(p, 'fee-percent')) === '—');

  // ₹10 lakh example from the brief, typed key by key.
  await typeAmount(p, '1000000');
  out('live Indian grouping while typing', (await p.inputValue('#calc-amount')) === '10,00,000', await p.inputValue('#calc-amount'));
  out('₹10,00,000: outstanding shown', (await text(p, 'outstanding')) === '₹10,00,000');
  out('₹10,00,000: settlement scenario ₹3,00,000 at 30%', (await text(p, 'settlement')) === '₹3,00,000' && (await p.locator('.calc-card-settle .calc-pill').innerText()) === '30%');
  out('₹10,00,000: supporting sentence', (await text(p, 'settlement-text')) === 'At a 30% illustrative scenario, the amount would be approximately ₹3,00,000.');
  out('₹10,00,000: fee 1% = ₹10,000', (await text(p, 'fee-percent')) === '1%' && (await text(p, 'fee')) === '₹10,000', await text(p, 'fee-calc'));
  out('₹10,00,000: first tier highlighted', await p.locator('[data-tier="tier-1"]').evaluate((e) => e.classList.contains('is-active') && e.getAttribute('aria-current') === 'true'));

  // Boundaries and examples through the UI.
  for (const [v, settle, pct, fee] of [['2500000', '₹7,50,000', '0.75%', '₹18,750'], ['1000001', '₹3,00,000', '0.75%', '₹7,500'], ['9999999', '₹30,00,000', '0.75%', '₹75,000'], ['10000000', '₹30,00,000', '0.50%', '₹50,000'], ['15000000', '₹45,00,000', '0.50%', '₹75,000'], ['5000000000', '₹1,50,00,00,000', '0.50%', '₹2,50,00,000']]) {
    await p.fill('#calc-amount', v);
    const got = [await text(p, 'settlement'), await text(p, 'fee-percent'), await text(p, 'fee')];
    out(`₹${v}: ${settle} / ${pct} / ${fee}`, got[0] === settle && got[1] === pct && got[2] === fee, got.join(' '));
  }

  // Caret stays beside the digit being typed when grouping changes.
  await p.fill('#calc-amount', '10,00,000');
  await p.locator('#calc-amount').evaluate((e) => { e.focus(); e.setSelectionRange(1, 1); });
  await p.keyboard.type('5');
  const caret = await p.locator('#calc-amount').evaluate((e) => [e.value, e.value.slice(0, e.selectionStart)]);
  out('typing in the middle regroups and keeps the caret after the new digit', caret[0] === '1,50,00,000' && caret[1].endsWith('5'), caret.join(' | caret after: '));

  // Invalid input.
  for (const [v, re] of [['abc', /numbers only/], ['-500', /negative/], ['0', /greater than zero/], ['99999999999', /too large/]]) {
    await p.fill('#calc-amount', v);
    const st = await p.evaluate(() => ({ err: document.querySelector('[data-calc-amount-error]'), inv: document.getElementById('calc-amount').getAttribute('aria-invalid') }));
    const msg = await p.locator('[data-calc-amount-error]').innerText().catch(() => '');
    out(`invalid "${v}": message, aria-invalid, no results`, re.test(msg) && st.inv === 'true' && (await text(p, 'fee')) === '—' && (await text(p, 'settlement')) === '—', msg);
  }
  await p.fill('#calc-amount', '');
  await p.press('#calc-amount', 'Enter');
  out('empty + Enter: required message, focus stays on the amount', /Please enter your total outstanding/.test(await p.locator('[data-calc-amount-error]').innerText()) && await p.evaluate(() => document.activeElement.id === 'calc-amount'));
  await typeAmount(p, '2500000');
  await p.press('#calc-amount', 'Enter');
  await p.waitForTimeout(400);
  out('Enter with a valid amount does not navigate or change the URL', p.url() === startUrl);

  // Multi-select: mouse.
  const toggle = p.locator('[data-ms-toggle]'), panel = p.locator('[data-ms-panel]');
  out('dropdown starts closed', (await toggle.getAttribute('aria-expanded')) === 'false' && !(await panel.isVisible()));
  await toggle.click();
  out('click opens the dropdown', (await toggle.getAttribute('aria-expanded')) === 'true' && await panel.isVisible());
  await p.locator('.calc-ms-opt', { hasText: 'Personal Loan' }).click();
  await p.locator('.calc-ms-opt', { hasText: 'Credit Card Outstanding' }).click();
  out('multiple selections: button summary', (await p.locator('[data-ms-value]').innerText()) === '2 loan types selected');
  out('selected options visibly marked', (await p.locator('.calc-ms-opt.is-checked').count()) === 2);
  out('chips list the selected types', (await p.locator('[data-r="chips"] .calc-chip').allInnerTexts()).map((s) => s.trim()).join('|') === 'Credit Card Outstanding|Personal Loan');
  out('results card lists the selected types', (await p.locator('[data-r="types"] li').allInnerTexts()).join('|') === 'Credit Card Outstanding|Personal Loan');
  out('loan types do not change the figures', (await text(p, 'fee')) === '₹18,750' && (await text(p, 'settlement')) === '₹7,50,000');
  out('secured-loan note hidden for unsecured types', !(await p.locator('[data-r="secured"]').isVisible()));
  await p.locator('.calc-ms-opt', { hasText: 'Home Loan' }).click();
  out('secured-loan note shown when Home Loan selected', await p.locator('[data-r="secured"]').isVisible());
  await p.mouse.click(5, 300);
  out('click outside closes the dropdown', (await toggle.getAttribute('aria-expanded')) === 'false' && !(await panel.isVisible()));

  // Chips: remove a selection.
  await p.locator('[data-r="chips"] button[aria-label="Remove Home Loan"]').click();
  out('removing a chip unchecks the type and hides the secured note', !(await p.locator('input[value="home"]').isChecked()) && !(await p.locator('[data-r="secured"]').isVisible()));
  out('focus moves to a remaining chip after removal', await p.evaluate(() => /^Remove /.test(document.activeElement.getAttribute('aria-label') || '')));

  // Multi-select: keyboard.
  await toggle.focus();
  await p.keyboard.press('Enter');
  out('keyboard open moves focus to the first option', await p.evaluate(() => document.activeElement.value === 'credit-card'));
  await p.keyboard.press('ArrowDown');
  out('ArrowDown moves to the next option', await p.evaluate(() => document.activeElement.value === 'personal'));
  await p.keyboard.press('ArrowDown'); await p.keyboard.press('Space');
  out('Space toggles an option', await p.locator('input[value="business"]').isChecked());
  await p.keyboard.press('Escape');
  out('Escape closes and returns focus to the button', !(await panel.isVisible()) && await p.evaluate(() => document.activeElement.hasAttribute('data-ms-toggle')));
  await toggle.click();
  await p.locator('[data-ms-all]').click();
  out('Select all checks every type', (await p.locator('input[data-loan-type]:checked').count()) === 11 && (await p.locator('[data-ms-value]').innerText()) === 'All loan types selected');
  await p.locator('[data-ms-clear]').click();
  out('Clear all unchecks every type', (await p.locator('input[data-loan-type]:checked').count()) === 0 && (await p.locator('[data-ms-value]').innerText()) === 'Select loan types' && await p.locator('[data-r="types-none"]').isVisible());
  await p.locator('[data-ms-done]').click();
  out('Done closes the dropdown', !(await panel.isVisible()));
  await toggle.click();
  await p.locator('.calc-ms-opt', { hasText: 'Consumer Durable Loan' }).click();
  await p.locator('[data-ms-done]').click();

  // Privacy: a distinctive amount, then look everywhere it could leak.
  await p.fill('#calc-amount', '');
  await typeAmount(p, '7342191');
  await p.locator('#calc-amount').blur();
  await p.waitForTimeout(1500);
  const needles = ['7342191', '73,42,191', '73%2C42%2C191', '2202657', '22,02,657', '55066', '55,066', 'consumer-durable', 'Consumer Durable', 'Consumer%20Durable'];
  const leak = requests.filter((u) => needles.some((n) => u.includes(n)));
  out('no network request contains an amount, result or loan type', leak.length === 0, leak[0] ? leak[0].slice(0, 90) : `${requests.length} requests checked`);
  out('URL unchanged (no query string or hash with values)', p.url() === startUrl);
  const storage = await p.evaluate(() => JSON.stringify([Object.entries(localStorage), Object.entries(sessionStorage), document.cookie]));
  out('nothing written to localStorage, sessionStorage or cookies', !needles.some((n) => storage.includes(n)), storage.slice(0, 80));
  out('nothing logged to the console', !consoleMsgs.some((m) => needles.some((n) => m.includes(n))), `${consoleMsgs.length} console messages`);
  const dl = await p.evaluate(() => (window.dataLayer || []).map((a) => JSON.stringify(Array.from(a.length !== undefined ? a : [a]))));
  const used = dl.filter((s) => s.includes('calculator_used'));
  out('analytics: calculator_used sent once, with no parameters', used.length === 1 && used[0] === '["event","calculator_used"]' && !needles.some((n) => dl.join().includes(n)), used.join());
  if (!home) out('Meta Pixel not loaded on the calculator page (neutral-URL rule)', !loadRequests.concat(requests).some((u) => u.includes('fbevents') || u.includes('facebook.com/tr')));
  else {
    out('homepage: Meta Pixel active after consent (test is meaningful)', loadRequests.some((u) => u.includes('fbevents')));
    const events = requests.filter((u) => u.includes('facebook.com/tr'));
    out('homepage: no Meta Pixel event while the calculator is used', events.length === 0, `${events.length} pixel beacons after load`);
  }
  out('no page errors', errors.length === 0, errors[0] || '');

  // CTAs.
  const wa = await p.locator('.calc-cta a[href^="https://wa.me/"]').getAttribute('href');
  out('WhatsApp CTA uses the existing number and the neutral message', wa.startsWith(`https://wa.me/${WA_NUMBER}?text=`) && decodeURIComponent(wa.split('text=')[1]) === 'Hi, I would like a free consultation about my loan situation.');
  out('no WhatsApp link on the page carries calculator values', !(await p.evaluate(() => [...document.querySelectorAll('a[href^="https://wa.me"]')].map((a) => a.href).join(' '))).match(/7342191|73%2C42|Consumer/));
  await p.locator('.calc-cta [data-lf-consult]').click();
  await p.waitForTimeout(300);
  const dlg = await p.evaluate(() => ({ open: document.getElementById('consult').open, carried: [...document.querySelectorAll('#consult input, #consult textarea, #consult select')].some((i) => /734|Consumer/.test(i.value)) }));
  out('"Get a Free Consultation" opens the existing dialog, carrying no values', dlg.open && !dlg.carried);

  // Existing WhatsApp fallback when the lead endpoint is unavailable (calculator page, desktop only).
  if (!home && width === 1440) {
    await ctx.route('**/api/lead', (r) => r.fulfill({ status: 503, contentType: 'application/json', body: '{"ok":false}' }));
    let waNav = '';
    await ctx.route('https://wa.me/**', (r) => { waNav = r.request().url(); r.fulfill({ status: 204, body: '' }); });
    await p.fill('#consult-form-name', 'Test Visitor');
    await p.fill('#consult-form-phone', '9876543210');
    await p.selectOption('#consult-form-topic', { index: 1 });
    await p.check('#consult form input[name=consent]');
    await p.click('#consult form button[type=submit]');
    await p.waitForTimeout(1500);
    out('lead endpoint down: existing WhatsApp fallback still runs', waNav.startsWith(`https://wa.me/${WA_NUMBER}`) && !/7342191|73%2C42|Consumer/.test(waNav), waNav.slice(0, 60));
  }
  await ctx.close();
}

// Responsive: the page never scrolls sideways and the open dropdown fits on screen.
console.log('-- responsive dropdown and layout');
for (const width of [375, 390, 430, 768, 1024, 1440]) {
  const { ctx, p } = await openPage('/settlement-calculator.html', width, { consent: 'essential' });
  await p.fill('#calc-amount', '1000000000');
  await p.locator('[data-ms-toggle]').click();
  await p.waitForTimeout(900); // the site uses smooth scrolling; let it settle before measuring
  const r = await p.evaluate(() => {
    const panel = document.querySelector('[data-ms-panel]').getBoundingClientRect();
    const done = document.querySelector('[data-ms-done]').getBoundingClientRect();
    const bar = document.querySelector('.sticky-bar');
    const barTop = bar && getComputedStyle(bar).display !== 'none' ? bar.getBoundingClientRect().top : innerHeight;
    const header = document.querySelector('.site-header').getBoundingClientRect().bottom;
    const tiny = [...document.querySelectorAll('.calc a, .calc button, .calc input[type=text], .calc label.calc-ms-opt')]
      .filter((e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && b.height < 44 && !e.classList.contains('calc-chip-x'); })
      .map((e) => e.className || e.tagName);
    return { overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, left: panel.left, right: panel.right, top: panel.top, header, doneBottom: done.bottom, barTop, tiny };
  });
  out(`${width}px: no horizontal overflow (₹100 crore entered, dropdown open)`, r.overflow === 0, `overflow ${r.overflow}`);
  out(`${width}px: dropdown within the screen width`, r.left >= 0 && r.right <= width);
  out(`${width}px: dropdown not under the header, Done button above the call bar`, r.top >= r.header - 1 && r.doneBottom <= r.barTop + 1, `top ${Math.round(r.top)} header ${Math.round(r.header)} done ${Math.round(r.doneBottom)} bar ${Math.round(r.barTop)}`);
  out(`${width}px: touch targets at least 44px tall`, r.tiny.length === 0, r.tiny.slice(0, 3).join(','));
  await ctx.close();
}

await browser.close();
console.log(`${pass} passed, ${fail} failed${LIVE_TAGS ? ' (real tag scripts loaded)' : ' (tag scripts stubbed; set LIVE_TAGS=1 to load them)'}`);
process.exit(fail ? 1 : 0);
