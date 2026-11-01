# Website Recovery Report

Date: 2026-11-01 · Recovery branch: `claude/bold-cerf-0b9gio` · Target: `main`
Investigation details: [`docs/ROLLBACK_RECOVERY_REPORT.md`](ROLLBACK_RECOVERY_REPORT.md)

## 1. Why the updates "rolled back" (confirmed from GitHub deployment records)

Vercel records each deployment on GitHub. Deployment IDs are sequential; some records carry wrong (future) timestamps, so the order below is by ID.

| Deployment ID | Environment | Commit | What it was |
|---|---|---|---|
| 7470301547 | **Production** | `5a4405a` | Phase 3 (calculator sliders, homepage redesign) **went live**, deployed from the Phase 3 branch rather than from `main` |
| 7470493656 / 7470537760 | Preview only | `217f7b1`, `c528029` | Guide images, 6 new guides, WhatsApp fallback: **never reached production** |
| 7470713793 | **Production** | `95cf563` | A push to `main`, which never contained Phase 2/3, built the old static site. **This replaced Phase 3 in production: the rollback.** |
| 7470786924 | **Production** | `b9edf12` | PR #2 merged into `main`: old site + second GTM container |
| 7471117216 | **Production** | `753e402` | This recovery (PR #3), with all Phase 2/3 work |

Root cause: Phase 2/3 lived on a history unrelated to `main` (parentless baseline `793d47f`) and was never merged. Vercel's production branch is `main`. Phase 3 reached production once, by a deployment from the Phase 3 branch. The next ordinary push to `main` (tracking work from another session) redeployed the old `main` and silently replaced it.

## 2. Branch with the latest completed implementation

`phase-3-design-upgrade` = `claude/wonderful-edison-cp2xuq` = `c52802963494d4f09922f67b9161729b5dd3b4d9`. The owner confirmed it from a screenshot of the local build.

## 3. Commits recovered

All 22 Phase 2/3 commits, from `793d47f` through `c528029`, are joined into `main`'s history unchanged, with their original SHAs, by one `--allow-unrelated-histories` merge (`32e0da4`). That merge's tree is byte-identical to `c528029`. Nothing was rebuilt by hand.

| Commit | Purpose |
|---|---|
| `eb7ed58` | Investigation report |
| `32e0da4` | Merge restoring `c528029` exactly |
| `efdc1f0` | Re-applies `main`'s two GTM containers (`GTM-MZT2JKM8`, `GTM-54VQF7S6`) in the shared template, loaded after Consent Mode defaults; `meta_lead`/`meta_contact` dataLayer events |
| (this commit) | This report and QA screenshots |

Not re-applied: `88acd54` (Meta Pixel on every page without consent). Phase 2 already fires Meta `Lead`/`Contact` only after "Accept all" and only on neutral pages. Re-adding it would weaken the privacy safeguards.

## 4. Features restored

Phase 2 templates and rebuilt pages; service-page structure (answers, eligibility, steps, documents, comparisons, FAQs, sources); legal-claim checks; illustrations and OG images; secure lead endpoint with validation and spam traps; cookie consent; consent-aware GA4; Meta Pixel neutral-page rule; SEO metadata, canonicals, sitemap, schema and redirects. Phase 3 design, header/nav, hero, consultation popup, trust/process sections and settlement calculator (unchanged formulas and disclaimer). WhatsApp fallback when a lead cannot be saved. Guide illustrations (`tools/guide-images.mjs`). Six new English guides. The Hindi guides and RBI 2027 pillar remain **unpublished drafts** with their review notices.

## 5. Files changed versus `main`

689 files: 620 added, 67 removed, 2 modified. The removals are the old root static HTML, `styles.css`, `script.js` and replaced images. Phase 2 moved every page into `src/pages/`. `vercel.json` now runs `node tools/build.mjs`, and Vercel serves `dist/`. All 50 URLs on the old `main` exist in the new build, and 7 new ones were added (calculator + 6 guides).

## 6. Build and test results

| Check | Result |
|---|---|
| `node tools/build.mjs` | 57 pages built |
| `node tools/check.mjs` | 57 pages, 0 errors, 0 warnings |
| `node tools/test-lead.cjs` | all cases pass (exit 0) |
| `node tools/test-calculator.cjs` | 58 passed, 0 failed |
| Browser sweep: 57 pages × 375/390/430/768/1024/1440 | No horizontal overflow, broken images, console errors or failed requests. No missing alt attributes or canonicals. Only `noindex` page: `testimonials.html` (intentional since Phase 2) |
| English contact form, English popup, Hindi popup (draft build) | Without a webhook: API returns 503 `not_configured`; message "Opening WhatsApp with your details…"; redirect to `wa.me/917042538878` with all typed details; Call button present |
| Consent | First visit: banner shown, Consent Mode denied, no Meta Pixel. After "Accept all": Pixel loads on `/`, not on `/personal-loan-settlement.html`; both GTM containers load on every page |

Screenshots: `docs/recovery/screenshots/` (home, calculator, blog, personal-loan service, settlement-letter guide; 1440 and 390).

## 7. Unresolved issues

- The Vercel dashboard and the live domain could not be opened from this session (network policy). Production status is taken from Vercel's GitHub deployment records: deployment 7471117216 of `753e402` reports `success`.
- `LEAD_WEBHOOK_URL` and `LEAD_WEBHOOK_SECRET` must be set in Vercel for leads to be stored. Until then, every enquiry goes to WhatsApp (see `docs/LEAD_CAPTURE.md`).
- Tags created inside the GTM containers must follow the rules in `docs/TRACKING_VERIFICATION.md`. A non-Google tag firing on "All Pages" would bypass the consent and neutral-page rules.
- The privacy policy names GA4 and the Meta Pixel but not Google Tag Manager by name. Ask your adviser whether a mention is needed.
- Spam trap: submissions within 2.5 s of page load get a silent "saved" response and are discarded (existing Phase 2 behaviour).
- Hindi guides, the RBI 2027 pillar and unresolved RBI circular URLs remain pending expert review (`docs/LEGAL_REVIEW_LOG.md`).

## 8–10. Deployment

- Production branch: `main` (confirmed by Vercel's GitHub deployment records).
- The owner approved going live. PR #3 was merged into `main` as `753e4029b32d41c339f1c7de7bde8a3647dc4fc0`. Vercel production deployment 7471117216 completed successfully: https://loan-free-financial-services-8c75crdfo-brandzoo-medias-projects.vercel.app
- **Never deploy production from a side branch again.** Merge into `main` first; otherwise the next push to `main` replaces it.

Remaining steps:

1. In Vercel → Deployments, confirm the newest production deployment shows the merge commit and its build log contains "Built 57 pages".
2. In Project Settings → Build & Output, make sure no dashboard override replaces `vercel.json`'s build command (`node tools/build.mjs`) or output directory (`dist`).
3. If production is set to a branch other than `main`, change it to `main` or promote the new deployment.
4. Set `LEAD_WEBHOOK_URL` / `LEAD_WEBHOOK_SECRET` and redeploy.
5. Check https://www.loanfree.info/, `/settlement-calculator.html` and `/blog/loan-settlement-letter-checklist.html`, then follow `docs/TRACKING_VERIFICATION.md`.
