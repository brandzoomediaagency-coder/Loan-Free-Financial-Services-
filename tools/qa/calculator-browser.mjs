// Browser test of the Loan Settlement & Legal Fee Calculator on its own page and on the homepage:
// live results and Indian formatting, the Loan Free service fee estimate (monthly fee, 8-month
// payment plan, 12-month service coverage, below-₹2-lakh message), fee-tier boundaries, empty/invalid input, the loan-type
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
  out('empty state: fee rate and amounts show a dash', (await text(p, 'fee-monthly')) === '—' && (await text(p, 'fee-total')) === '—' && (await text(p, 'settlement')) === '—' && (await text(p, 'fee-rate')) === '—');
  out('empty state: no below-₹2-lakh message', !(await p.locator('[data-r="below-note"]').isVisible()));
  out('empty state: payment and service durations shown as policy (8 / 12 months)', /Payment duration\s*8 months\s*Service duration\s*12 months/.test(await p.locator('.calc-cover-list').innerText()));

  // ₹10 lakh example from the brief, typed key by key.
  await typeAmount(p, '1000000');
  out('live Indian grouping while typing', (await p.inputValue('#calc-amount')) === '10,00,000', await p.inputValue('#calc-amount'));
  out('₹10,00,000: outstanding shown', (await text(p, 'outstanding')) === '₹10,00,000');
  out('₹10,00,000: settlement scenario ₹3,00,000 at 30%', (await text(p, 'settlement')) === '₹3,00,000' && (await p.locator('.calc-card-settle .calc-pill').innerText()) === '30%');
  out('₹10,00,000: supporting sentence', (await text(p, 'settlement-text')) === 'At a 30% illustrative scenario, the amount would be approximately ₹3,00,000.');
  out('₹10,00,000: fee estimate shows the outstanding amount', (await text(p, 'fee-outstanding')) === '₹10,00,000');
  out('₹10,00,000: 1%/month = ₹10,000 a month', (await text(p, 'fee-rate')) === '1%/month' && (await text(p, 'fee-monthly')) === '₹10,000', await text(p, 'fee-calc'));
  out('₹10,00,000: calculation line', (await text(p, 'fee-calc')) === '₹10,00,000 × 1% = ₹10,000 per month');
  out('₹10,00,000: payment plan ₹10,000 × 8 months, total ₹80,000', (await text(p, 'fee-plan')) === '₹10,000 × 8 months' && (await text(p, 'fee-total')) === '₹80,000');
  out('₹10,00,000: 12 months of service shown prominently', /12 months\s*of service/.test(await p.locator('.calc-cover').innerText()));
  out('₹10,00,000: second band (₹2 lakh–₹10 lakh) highlighted', await p.locator('[data-tier="tier-1"]').evaluate((e) => e.classList.contains('is-active') && e.getAttribute('aria-current') === 'true'));
  out('₹10,00,000: no below-₹2-lakh message', !(await p.locator('[data-r="below-note"]').isVisible()));
  out('settlement and fee cards are separate elements', (await p.locator('.calc-card-settle [data-r="fee-total"], .calc-card-fee [data-r="settlement"]').count()) === 0);

  // Below ₹2 lakh: fixed fee, application message, never blocked.
  await p.fill('#calc-amount', '150000');
  out('₹1,50,000: fixed ₹2,000/month, ₹2,000 × 8 months = ₹16,000', (await text(p, 'fee-rate')) === 'Fixed ₹2,000/month' && (await text(p, 'fee-monthly')) === '₹2,000' && (await text(p, 'fee-plan')) === '₹2,000 × 8 months' && (await text(p, 'fee-total')) === '₹16,000');
  const belowMsg = await p.locator('[data-r="below-note"]').innerText().catch(() => '');
  out('₹1,50,000: below-₹2-lakh application message shown', await p.locator('[data-r="below-note"]').isVisible() && belowMsg.trim() === 'Your outstanding amount is below our standard ₹2 lakh service threshold. You can still submit an application for consideration. Our fixed professional fee for this category is ₹2,000 per month for 8 months, with service coverage for 12 months.', belowMsg.slice(0, 60));
  out('₹1,50,000: no error, input valid, fixed band highlighted', (await p.getAttribute('#calc-amount', 'aria-invalid')) === 'false' && await p.locator('[data-tier="tier-0"]').evaluate((e) => e.classList.contains('is-active')));
  out('₹1,50,000: consultation and WhatsApp CTAs still available', await p.locator('.calc-cta [data-lf-consult]').isVisible() && await p.locator('.calc-cta a[href^="https://wa.me/"]').isVisible());

  // Boundaries and examples through the UI: [input, settlement, rate, monthly, total, below-₹2-lakh message].
  for (const [v, settle, rate, monthly, total, below] of [
    ['1', '₹0', 'Fixed ₹2,000/month', '₹2,000', '₹16,000', true],
    ['199999', '₹60,000', 'Fixed ₹2,000/month', '₹2,000', '₹16,000', true],
    ['200000', '₹60,000', '1%/month', '₹2,000', '₹16,000', false],
    ['500000', '₹1,50,000', '1%/month', '₹5,000', '₹40,000', false],
    ['1000001', '₹3,00,000', '0.75%/month', '₹7,500', '₹60,000', false],
    ['2500000', '₹7,50,000', '0.75%/month', '₹18,750', '₹1,50,000', false],
    ['9999999', '₹30,00,000', '0.75%/month', '₹75,000', '₹6,00,000', false],
    ['10000000', '₹30,00,000', '0.50%/month', '₹50,000', '₹4,00,000', false],
    ['15000000', '₹45,00,000', '0.50%/month', '₹75,000', '₹6,00,000', false],
    ['5000000000', '₹1,50,00,00,000', '0.50%/month', '₹2,50,00,000', '₹20,00,00,000', false]]) {
    await p.fill('#calc-amount', v);
    const got = [await text(p, 'settlement'), await text(p, 'fee-rate'), await text(p, 'fee-monthly'), await text(p, 'fee-total'), await p.locator('[data-r="below-note"]').isVisible()];
    out(`₹${v}: ${settle} / ${rate} / ${monthly} × 8 = ${total}${below ? ' / below-₹2-lakh message' : ''}`, got[0] === settle && got[1] === rate && got[2] === monthly && got[3] === total && got[4] === below, got.join(' '));
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
    out(`invalid "${v}": message, aria-invalid, no results or fee estimate`, re.test(msg) && st.inv === 'true' && (await text(p, 'fee-monthly')) === '—' && (await text(p, 'fee-total')) === '—' && (await text(p, 'settlement')) === '—' && !(await p.locator('[data-r="below-note"]').isVisible()), msg);
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
  out('loan types do not change the figures', (await text(p, 'fee-monthly')) === '₹18,750' && (await text(p, 'fee-total')) === '₹1,50,000' && (await text(p, 'settlement')) === '₹7,50,000');
  const offered = (await p.locator('.calc-ms-opt').allInnerTexts()).map((s) => s.trim());
  out('only unsecured loan types are offered (7, no home/vehicle/property/gold)', offered.length === 7 && !offered.some((l) => /\b(home|vehicle|car|property|gold)\b/i.test(l)), offered.join(' | '));
  out('"unsecured loans only" scope note is shown', /Unsecured loans only/.test(await p.locator('.calc-inputs .calc-note').innerText()));
  await p.locator('.calc-ms-opt', { hasText: 'Business Loan (unsecured)' }).click();
  await p.mouse.click(5, 300);
  out('click outside closes the dropdown', (await toggle.getAttribute('aria-expanded')) === 'false' && !(await panel.isVisible()));

  // Chips: remove a selection.
  await p.locator('[data-r="chips"] button[aria-label="Remove Business Loan (unsecured)"]').click();
  out('removing a chip unchecks the type and updates the results card', !(await p.locator('input[value="business"]').isChecked()) && (await p.locator('[data-r="types"] li').count()) === 2);
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
  out('Select all checks every type', (await p.locator('input[data-loan-type]:checked').count()) === 7 && (await p.locator('[data-ms-value]').innerText()) === 'All loan types selected');
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
  // 0.75% of ₹73,42,191 = ₹55,066 a month; × 8 = ₹4,40,528. 30% = ₹22,02,657.
  out('privacy amount: fee figures as expected', (await text(p, 'fee-monthly')) === '₹55,066' && (await text(p, 'fee-total')) === '₹4,40,528');
  const needles = ['7342191', '73,42,191', '73%2C42%2C191', '2202657', '22,02,657', '55066', '55,066', '440528', '4,40,528', '4%2C40%2C528', 'consumer-durable', 'Consumer Durable', 'Consumer%20Durable'];
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

  // CTAs and disclaimers.
  out('CTA below the fee estimate: "Discuss Your Loan Settlement Options"', (await p.locator('.calc-cta-title').innerText()).trim() === 'Discuss Your Loan Settlement Options'
    && /service process, applicable fees and options for your loan account/.test(await p.locator('.calc-cta-copy p').innerText())
    && await p.evaluate(() => !!(document.querySelector('.calc-card-fee').compareDocumentPosition(document.querySelector('.calc-cta')) & Node.DOCUMENT_POSITION_FOLLOWING)));
  const disc = await p.locator('.calc-disclaimer').innerText();
  out('existing disclaimer kept and fee disclaimer added', /Important Disclaimer:/.test(disc) && /Fee Estimate Disclaimer:/.test(disc) && /paid directly to the lender/.test(disc));
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
  // Largest accepted amount (₹1,000 crore): every figure must fit inside its own block.
  await p.fill('#calc-amount', '10000000000');
  const fit = await p.evaluate(() => {
    const bad = [];
    for (const el of document.querySelectorAll('.calc-results .calc-big, .calc-results .calc-mid, .calc-results .calc-plan, .calc-results .calc-pill, .calc-cover strong, .calc-tiers strong')) {
      const r = el.getBoundingClientRect(), box = el.closest('.calc-fee-block, .calc-card, .calc-tiers').getBoundingClientRect();
      if (el.scrollWidth > el.clientWidth + 1 && getComputedStyle(el).display !== 'inline') bad.push(el.dataset.r || el.className);
      if (r.left < box.left - 1 || r.right > box.right + 1) bad.push((el.dataset.r || el.className) + ' outside');
    }
    const blocks = [...document.querySelectorAll('.calc-fee-block')].map((b) => b.getBoundingClientRect());
    for (let i = 0; i < blocks.length; i++) for (let j = i + 1; j < blocks.length; j++) {
      const a = blocks[i], b = blocks[j];
      if (a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1) bad.push(`blocks ${i} and ${j} overlap`);
    }
    return { bad, monthly: document.querySelector('[data-r="fee-monthly"]').textContent, total: document.querySelector('[data-r="fee-total"]').textContent };
  });
  out(`${width}px: ₹1,000 crore fee values fit their blocks, blocks do not overlap`, fit.bad.length === 0 && fit.total === '₹40,00,00,000', fit.bad.slice(0, 3).join(', ') || `${fit.monthly} / ${fit.total}`);
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
  out(`${width}px: no horizontal overflow (₹1,000 crore entered, dropdown open)`, r.overflow === 0, `overflow ${r.overflow}`);
  out(`${width}px: dropdown within the screen width`, r.left >= 0 && r.right <= width);
  out(`${width}px: dropdown not under the header, Done button above the call bar`, r.top >= r.header - 1 && r.doneBottom <= r.barTop + 1, `top ${Math.round(r.top)} header ${Math.round(r.header)} done ${Math.round(r.doneBottom)} bar ${Math.round(r.barTop)}`);
  out(`${width}px: touch targets at least 44px tall`, r.tiny.length === 0, r.tiny.slice(0, 3).join(','));
  await ctx.close();
}

await browser.close();
console.log(`${pass} passed, ${fail} failed${LIVE_TAGS ? ' (real tag scripts loaded)' : ' (tag scripts stubbed; set LIVE_TAGS=1 to load them)'}`);
process.exit(fail ? 1 : 0);
