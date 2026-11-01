// usage: node snap.mjs <url> <outprefix> [w...]  full-page PNG after scrolling (lazy images), consent banner hidden
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const exe = fs.readdirSync(process.env.HOME + '/.cache/puppeteer/chrome').filter(d => d.startsWith('mac_arm-150'))[0];
const b = await puppeteer.launch({ executablePath: `${process.env.HOME}/.cache/puppeteer/chrome/${exe}/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing`, headless: 'new' });
const [url, out, ...ws] = process.argv.slice(2);
for (const w of (ws.length ? ws : ['1440', '390']).map(Number)) {
  const p = await b.newPage(); await p.setViewport({ width: w, height: w > 800 ? 900 : 844 });
  await p.evaluateOnNewDocument(() => { try { localStorage.setItem('lf_consent', 'essential'); } catch (e) {} });
  await p.goto(url, { waitUntil: 'networkidle2' });
  await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); document.querySelectorAll('.reveal').forEach(e => e.classList.add('is-visible')); });
  await new Promise(r => setTimeout(r, 600));
  await p.screenshot({ path: `${out}-${w}.png`, fullPage: true });
  await p.close();
}
await b.close();
