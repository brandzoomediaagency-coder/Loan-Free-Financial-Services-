# Browser QA scripts

Optional checks used for Phase 3. They drive headless Chrome with `puppeteer-core`, which the site itself does not depend on.

```
npm i --no-save puppeteer-core            # once, in a scratch folder or here
npx @puppeteer/browsers install chrome@stable   # or point the scripts at your own Chrome
node tools/build.mjs && node tools/serve.mjs --root dist --port 8090 &
node tools/qa/sweep.mjs dist               # all pages x 375/390/430/768/1024/1440: overflow, console errors, failed requests, small tap targets
node tools/qa/interactions.mjs             # header menu, mobile drawer, dialog, consent/Meta scope, TOC, form validation and fallback
node tools/qa/screenshot.mjs http://localhost:8090/ out 1440 390   # full-page screenshots
```

The scripts look for Chrome under `~/.cache/puppeteer/chrome/mac_arm-150*`; edit the `executablePath` line for other systems.
