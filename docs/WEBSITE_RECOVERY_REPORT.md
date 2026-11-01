# Website Recovery Report

Date: 2026-11-01 · Recovery branch: `claude/bold-cerf-0b9gio` · Target: `main`
Investigation details: [`docs/ROLLBACK_RECOVERY_REPORT.md`](ROLLBACK_RECOVERY_REPORT.md)

## 1. Why the updates "rolled back"

They were never on `main`. Phase 2 started from a parentless baseline commit (`793d47f`). That commit is a copy of `main@8ee5d0c` imported from a zip. As a result, `phase-2-implementation`, `phase-3-design-upgrade` and `claude/wonderful-edison-cp2xuq` share no Git history with `main`, and no PR was ever opened from them.

After Phase 3 was finished (`c528029`, 08:21 UTC), four tracking-only commits were pushed to the old `main`. The last was PR #2, merged at 09:49 UTC. Production (presumably deploying `main`) therefore kept serving the pre-Phase-2 site. Any Phase 3 version seen earlier was a local build (`localhost:8090`) or a preview deployment. Vercel could not be inspected from this session, so the production branch and deployment history are **unverified**.

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

- Vercel production branch, current deployment SHA and rollback history were not accessible to verify.
- `LEAD_WEBHOOK_URL` and `LEAD_WEBHOOK_SECRET` must be set in Vercel for leads to be stored. Until then, every enquiry goes to WhatsApp (see `docs/LEAD_CAPTURE.md`).
- Tags created inside the GTM containers must follow the rules in `docs/TRACKING_VERIFICATION.md`. A non-Google tag firing on "All Pages" would bypass the consent and neutral-page rules.
- The privacy policy names GA4 and the Meta Pixel but not Google Tag Manager by name. Ask your adviser whether a mention is needed.
- Spam trap: submissions within 2.5 s of page load get a silent "saved" response and are discarded (existing Phase 2 behaviour).
- Hindi guides, the RBI 2027 pillar and unresolved RBI circular URLs remain pending expert review (`docs/LEGAL_REVIEW_LOG.md`).

## 8–10. Deployment

The owner approved going live. The recovery is delivered as a PR into `main`. Once it is merged, Vercel builds `main` if `main` is the production branch. After that:

1. In Vercel → Deployments, confirm the newest production deployment shows the merge commit and its build log contains "Built 57 pages".
2. In Project Settings → Build & Output, make sure no dashboard override replaces `vercel.json`'s build command (`node tools/build.mjs`) or output directory (`dist`).
3. If production is set to a branch other than `main`, change it to `main` or promote the new deployment.
4. Set `LEAD_WEBHOOK_URL` / `LEAD_WEBHOOK_SECRET` and redeploy.
5. Check https://www.loanfree.info/, `/settlement-calculator.html` and `/blog/loan-settlement-letter-checklist.html`, then follow `docs/TRACKING_VERIFICATION.md`.
