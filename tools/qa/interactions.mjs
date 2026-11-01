// Interaction QA for Phase 3: header dropdown, mobile drawer, dialog, consent/Meta scope, form validation + fallback, TOC.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const exe = fs.readdirSync(process.env.HOME + '/.cache/puppeteer/chrome').filter(d => d.startsWith('mac_arm-150'))[0];
const b = await puppeteer.launch({ executablePath: `${process.env.HOME}/.cache/puppeteer/chrome/${exe}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`, headless: 'new' });
const base = 'http://localhost:8090';
const results = []; const out = (k, v, pass) => { results.push(pass); console.log((pass ? 'PASS ' : 'FAIL ') + k.padEnd(56), v); };
const wait = (ms) => new Promise(r => setTimeout(r, ms));
// Analytics and pixel beacons are answered locally so test runs never reach Google or Meta.
const BEACON = /\/g\/collect|google-analytics\.com\/.*collect|facebook\.com\/tr/;
const block = async (page, log) => { await page.setRequestInterception(true); page.on('request', r => { if (log) log.push(r.url()); BEACON.test(r.url()) ? r.respond({ status: 204, body: '' }) : r.continue(); }); };
let p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
const reqs = []; await block(p, reqs);
await p.goto(base + '/', { waitUntil: 'networkidle2' });
out('consent banner on first visit', '', await p.$eval('#lf-consent', e => !e.hidden));
out('no Meta request before consent', '', !reqs.some(u => u.includes('fbevents')));
// desktop dropdown via keyboard
await p.focus('.sub-toggle'); await p.keyboard.press('Enter'); await wait(250);
out('services dropdown opens (aria-expanded)', '', await p.$eval('.sub-toggle', e => e.getAttribute('aria-expanded') === 'true'));
out('dropdown visible', '', await p.$eval('#sub-services', e => getComputedStyle(e).visibility === 'visible'));
out('dropdown lists 10 services', '', (await p.$$eval('#sub-services .sub-group a', a => a.length)) === 10);
await p.keyboard.press('Escape'); await wait(250);
out('Escape closes dropdown, focus back on toggle', '', await p.evaluate(() => document.querySelector('.sub-toggle').getAttribute('aria-expanded') === 'false' && document.activeElement.classList.contains('sub-toggle')));
await p.click('[data-consent="all"]'); await wait(1200);
await p.click('[aria-controls="sub-resources"]'); await wait(250);
out('resources dropdown opens', '', await p.$eval('[aria-controls="sub-resources"]', e => e.getAttribute('aria-expanded') === 'true'));
await p.click('[aria-controls="sub-services"]'); await wait(250);
out('opening services closes resources (one menu at a time)', '', await p.evaluate(() => document.querySelector('[aria-controls="sub-resources"]').getAttribute('aria-expanded') === 'false' && document.querySelector('[aria-controls="sub-services"]').getAttribute('aria-expanded') === 'true'));
await p.mouse.click(5, 600); await wait(200);
out('outside click closes menus', '', await p.evaluate(() => [...document.querySelectorAll('.sub-toggle')].every(b => b.getAttribute('aria-expanded') === 'false')));
out('desktop nav items on one line', '', await p.evaluate(() => [...document.querySelectorAll('.nav-menu > li')].every(li => li.getBoundingClientRect().height <= 46)));

out('Meta loads on homepage after Accept all', '', reqs.some(u => u.includes('fbevents')));
reqs.length = 0;
await p.goto(base + '/personal-loan-settlement.html', { waitUntil: 'networkidle2' });
out('Meta absent on service page after consent', '', !reqs.some(u => u.includes('fbevents')));
out('TOC list visible on desktop', '', await p.$eval('#doc-toc-list', e => getComputedStyle(e).display !== 'none'));
await p.focus('.nav-cta'); await p.keyboard.press('Enter'); await wait(300);
out('consult dialog opens from header CTA (keyboard)', '', await p.$eval('#consult', d => d.open));
out('focus moved into dialog', '', await p.evaluate(() => !!document.activeElement.closest('#consult')));
await p.keyboard.press('Escape'); await wait(250);
out('Escape closes dialog', '', await p.$eval('#consult', d => !d.open));
await p.close();

// mobile
p = await b.newPage(); await p.setViewport({ width: 390, height: 844 }); await block(p);
await p.evaluateOnNewDocument(() => { try { localStorage.setItem('lf_consent', 'essential'); } catch (e) {} });
await p.goto(base + '/', { waitUntil: 'networkidle2' });
out('mobile: drawer hidden initially', '', await p.$eval('#primary-menu', e => getComputedStyle(e).visibility === 'hidden'));
await p.click('.mobile-toggle'); await wait(300);
out('mobile: drawer opens, aria-expanded true', '', await p.evaluate(() => document.querySelector('#primary-menu').classList.contains('is-open') && document.querySelector('.mobile-toggle').getAttribute('aria-expanded') === 'true'));
out('mobile: drawer fills the screen below the header', '', await p.$eval('#primary-menu', e => e.getBoundingClientRect().height > 600));
out('mobile: sticky bar hidden while menu open', '', await p.$eval('.sticky-bar', e => getComputedStyle(e).display === 'none'));
await p.click('.sub-toggle'); await wait(200);
out('mobile: services expand inside drawer', '', await p.$eval('#sub-services', e => getComputedStyle(e).display !== 'none'));
await p.keyboard.press('Escape'); await wait(300);
out('mobile: one Escape closes drawer, focus on toggle', '', await p.evaluate(() => !document.querySelector('#primary-menu').classList.contains('is-open') && document.activeElement.classList.contains('mobile-toggle')));
out('mobile: no floating WhatsApp button (sticky bar only)', '', await p.$eval('.wa-float', e => getComputedStyle(e).display === 'none'));
out('mobile: sticky bar visible', '', await p.$eval('.sticky-bar', e => getComputedStyle(e).display !== 'none'));
await p.goto(base + '/personal-loan-settlement.html', { waitUntil: 'networkidle2' });
out('mobile: TOC collapsed by default', '', await p.$eval('#doc-toc-list', e => getComputedStyle(e).display === 'none'));
await p.click('.doc-toc-toggle'); await wait(200);
out('mobile: TOC button expands list (aria-expanded)', '', await p.evaluate(() => getComputedStyle(document.querySelector('#doc-toc-list')).display !== 'none' && document.querySelector('.doc-toc-toggle').getAttribute('aria-expanded') === 'true'));
// hero form: empty submit blocked, filled submit falls back to WhatsApp (no receiver configured locally)
await p.goto(base + '/contact.html', { waitUntil: 'networkidle2' });
await p.$eval('#contact-form [type=submit]', e => e.click()); await wait(400);
out('contact form: empty submit shows field errors', '', await p.$$eval('#contact-form [aria-invalid="true"]', l => l.length) >= 2);
await p.$eval('#contact-form [name=name]', e => { e.value = 'QA Test'; e.dispatchEvent(new Event('input', { bubbles: true })); });
await p.$eval('#contact-form [name=phone]', e => { e.value = '9876543210'; e.dispatchEvent(new Event('input', { bubbles: true })); });
await p.$eval('#contact-form [name=topic]', e => { e.selectedIndex = 1; });
await p.$eval('#contact-form [name=consent]', e => { e.checked = true; });
await wait(2700);
// Unsaved lead: the visitor is redirected to WhatsApp with every typed detail in the message.
let waUrl = '';
await p.setRequestInterception(true);
p.on('request', (r) => { if (/^https:\/\/(wa\.me|api\.whatsapp\.com)\//.test(r.url())) { waUrl = waUrl || r.url(); r.abort(); } else r.continue(); });
await p.$eval('#contact-form [type=submit]', e => e.click()); await wait(2000);
const waText = waUrl ? decodeURIComponent(new URL(waUrl).searchParams.get('text') || '') : '';
out('contact form: unconfigured store -> redirect to WhatsApp with details, no fake success', waUrl.slice(0, 60), /QA Test/.test(waText) && /9876543210/.test(waText));
await b.close();
console.log(`${results.filter(Boolean).length}/${results.length} passed`);
