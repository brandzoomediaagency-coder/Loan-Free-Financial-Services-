# Website implementation plan — loanfree.info

Baseline: production snapshot of 19 Aug 2026 (commit `793d47f` on `main`). Work branch: `phase-2-implementation`. Specification: the Website Growth Audit (31 Oct 2026) and the implementation brief. **No production deployment without the owner's explicit approval.**

## How the site is built now

| Part | Where |
|---|---|
| Page sources (HTML with a JSON front-matter block) | `src/pages/**.html` |
| Shared header, footer, forms, CTA, review box, related links, consent banner | `src/templates.mjs` |
| Business facts (NAP, hours, analytics IDs, people) — one place to change them | `src/site.config.mjs` |
| CSS / JS / icons | `src/css`, `src/js/site.js`, `src/icons` |
| Build (zero dependencies, Node 18+) | `node tools/build.mjs` → `dist/` (add `--drafts` to preview drafts) |
| QA gate | `node tools/check.mjs` (canonical, titles, descriptions, H1, heading order, JSON-LD, links/assets, alt, banned claims, orphans) |
| Local preview incl. redirects, headers and `/api` | `node tools/serve.mjs --root dist --port 8090` |
| Lead endpoint | `api/lead.js` (Vercel function) — `docs/LEAD_CAPTURE.md` |
| Images | `tools/media.mjs` (OG cards, guide images), `tools/illustrations.mjs` (SVG diagrams) |
| Inventories | `python3 tools/oneoff/make_inventories.py <workbook.xlsx>` → `docs/inventory/` |

Vercel runs `node tools/build.mjs` and serves `dist/` (`vercel.json`). All 49 original URLs keep the same paths; extension-less variants redirect to them.

## Phases

### Phase A — Critical fixes · **Done**
Single template system; homepage hero text-only; 3.48 MB background removed; self-hosted fonts; SVG icons; WebP pipeline; fingerprinted assets and correct caching; `/index.html` and extension-less redirects; apex redirect rule; unique titles/descriptions; heading order; favicon; sitemap with real dates; robots.txt; accurate JSON-LD; banned-claims checker; outdated legal references corrected; testimonials page withdrawn; popup no longer automatic; one mobile CTA system.

### Phase B — Trust, conversion and tracking · **Done in code; needs your inputs**
Lead capture API with validation, spam protection, signed webhook and WhatsApp hand-off; consent banner and Consent Mode v2; GA4 events without personal data; Meta Pixel consent-gated and limited to neutral URLs; About/Contact/Services/Process/FAQ/Blog rebuilt; privacy policy, editorial policy, terms and disclaimer updated. Waiting on: D1 enquiry store, D2 entity, D3 hours, D6 people, D7 testimonials, L1–L3 reviews.

### Phase C — Content and AEO · **Mostly done**
12 service pages rebuilt to the service layout with verified rules, comparison tables, 6–8 FAQs and sources; 9 original illustrations; OG cards for every page; RBI 2027 pillar and Hindi section written as drafts; briefs for 9 further articles. Waiting on: legal and Hindi review before publishing drafts.

### Phase D — Authority and local · **Prepared**
GBP/NAP pack, outreach plan, LinkedIn/YouTube plans, linkable-asset specs. Needs account access and approvals.

## Testing done on this branch

| Check | Result |
|---|---|
| Build | 50 production pages (56 with drafts) |
| `tools/check.mjs` | 0 errors, 0 warnings |
| Console errors / horizontal overflow (puppeteer, 375/390/768/1024/1440 on key pages) | None found on pages tested |
| Lead API (`node tools/test-lead.cjs`) | Valid lead delivered and signature verified; honeypot and too-fast submissions dropped; missing consent, bad phone, wrong origin and wrong secret rejected |
| Lighthouse (local, before vs after) | See `IMPLEMENTATION_REPORT.md` and `docs/perf/` |

## Launch checks (run on a Vercel preview before approving production)

1. Preview deploy succeeds; `vercel.json` build settings are used.
2. `curl -sI <preview>/about` → 308 to `/about.html`; `/index.html` → `/`.
3. Spot-check 10 old URLs from the current sitemap: all 200.
4. Response headers: `/assets/build/*` immutable; HTML `must-revalidate`; security headers present.
5. Submit a test enquiry (with the webhook configured for Preview): reference shown, record stored, WhatsApp opens with a neutral message.
6. Consent banner behaviour and tracking per `docs/TRACKING_VERIFICATION.md`.
7. Phone at 375 px: no horizontal scroll, sticky bar visible, dialog usable with keyboard and screen reader.
8. Validate 3 pages in the Schema Markup Validator and Rich Results Test.
9. Lighthouse mobile on the preview for home, one service page, one guide.
10. Owner gives explicit approval → promote to production → set apex 308 in Vercel → submit sitemap in Search Console.

## Rollback

`main` still holds the original site. If anything goes wrong after launch, redeploy the previous production deployment from the Vercel dashboard ("Promote to production" on the last good deployment).
