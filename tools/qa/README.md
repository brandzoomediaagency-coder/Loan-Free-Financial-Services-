# Browser QA scripts

Optional checks used for Phase 3. They drive headless Chrome with `puppeteer-core`, which the site itself does not depend on.

```
npm i --no-save puppeteer-core            # once, in a scratch folder or here
npx @puppeteer/browsers install chrome@stable   # or point the scripts at your own Chrome
node tools/build.mjs && node tools/serve.mjs --root dist --port 8090 &
node tools/qa/sweep.mjs dist               # all pages x 375/390/430/768/1024/1440: overflow, console errors, failed requests, small tap targets
node tools/qa/interactions.mjs             # header menu, mobile drawer, dialog, consent/Meta scope, TOC, form validation and fallback
node tools/qa/screenshot.mjs http://localhost:8090/ out 1440 390   # full-page screenshots
node tools/qa/calculator-browser.mjs       # settlement & fee calculator: results, fee estimate (monthly fee, 8-month plan, 12-month service, below-₹2-lakh message), boundaries, validation, multi-select, responsive fit, CTAs, privacy
node tools/qa/calculator-screenshots.mjs docs/calculator/screenshots/pricing-update after-10-lakh 1000000 375,390,430,768,1024,1440   # element shots of the calculator (BASE=... for another server)
```

`calculator-browser.mjs` and `calculator-screenshots.mjs` use Playwright instead (`npm i --no-save playwright && npx playwright install chromium`, or set `CHROMIUM_PATH` to an existing Chromium/Chrome).

The scripts look for Chrome under `~/.cache/puppeteer/chrome/mac_arm-150*`; edit the `executablePath` line for other systems.
