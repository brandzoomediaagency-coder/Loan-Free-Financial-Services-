# Rollback Recovery Report — Investigation

Date: 2026-11-01
Repository: `brandzoomediaagency-coder/Loan-Free-Financial-Services-`
Scope: Phase 1 investigation only. No files were changed before this report was written.

## Summary

**The Phase 2 and Phase 3 work was not rolled back or reverted. It never reached `main`.**

All Phase 2 and Phase 3 commits are intact on GitHub, on the branches `phase-2-implementation`, `phase-3-design-upgrade` and `claude/wonderful-edison-cp2xuq`. The Phase 2 work was started from a new **root commit with no parent** (`793d47f`, "Baseline: production snapshot from …zip"). That gives the Phase 2/3 branches a Git history that is unrelated to `main`. No pull request was ever opened from those branches into `main`. GitHub will not open a normal PR between branches with unrelated histories; it reports "entirely different commit histories". So the work stayed on side branches.

Meanwhile, four tracking-only commits were made on top of the **old** `main` (`8ee5d0c`) and pushed to `main` between 08:32 and 09:49 UTC on 2026-11-01. The last of these, PR #2, was merged at 09:49 UTC, after the final Phase 3 commit `c528029` at 08:21 UTC. `main` therefore still contains the pre-Phase-2 static site with GTM and Meta Pixel snippets added.

Vercel production most likely deploys `main`, so production is serving the pre-Phase-2 site. If a Phase 3 build was ever visible on the production domain, it came from a preview deployment or a manual promotion. The next push to `main` would have replaced it. **I could not verify this.** This session has no access to Vercel, and the sandbox network policy blocked requests to `www.loanfree.info` (HTTP CONNECT 403).

## Local and remote state

| Item | Value |
|---|---|
| Current local branch | `claude/bold-cerf-0b9gio` (session working branch, at `origin/main`) |
| Local `main` | `8ee5d0c` (stale; `origin/main` has 5 newer commits) |
| Clone | Complete (not shallow) |
| Reflog | Only this session's clone/fetch entries; no lost or orphaned commits |

### Remote branches (after `git fetch --all --prune`)

| Branch | Tip | Date (UTC) | Notes |
|---|---|---|---|
| `main` | `b9edf12a5bc28f8eec9ffdb29fc9b3b5aff10f8d` | 2026-11-01 08:49 (merged 09:49) | Merge of PR #2 (GTM-54VQF7S6). Pre-Phase-2 static site + tracking. |
| `phase-3-design-upgrade` | `c52802963494d4f09922f67b9161729b5dd3b4d9` | 2026-11-01 08:21 | **Latest completed website.** |
| `claude/wonderful-edison-cp2xuq` | `c52802963494d4f09922f67b9161729b5dd3b4d9` | same | Identical to `phase-3-design-upgrade`. |
| `phase-2-implementation` | `7e9918565d6f0379d12509f12267cd7312caea00` | 2026-11-01 00:43 | Ancestor of Phase 3; fully contained in it. |
| `claude/confident-lovelace-2adggf` | `95cf563` | 2026-11-01 08:40 | Already in `main`. |
| `claude/modest-cannon-b3ogb7` | `3f3a231` | 2026-11-01 08:48 | Already in `main` (PR #2). |
| `seo-aeo-geo-2026-08` | `b8ad169` | 2026-08-09 | Old open PR #1, unrelated to this recovery. |

The commit clue `c528029` resolves to `c52802963494d4f09922f67b9161729b5dd3b4d9`, "Cache-bust guide images and share cards with content-hash query strings". It is the tip of both `phase-3-design-upgrade` and `claude/wonderful-edison-cp2xuq`.

## Why the histories are unrelated

- `git merge-base origin/main origin/phase-3-design-upgrade` returns nothing.
- `793d47f` has no parent. It is a root commit.
- The tree of `793d47f` is byte-identical to `main@8ee5d0c` (`git diff --quiet 8ee5d0c 793d47f` succeeds). The Phase 2 baseline was a copy of `main@8ee5d0c` re-imported from a zip, not a branch created from `main`.

As a result, all `main` content up to `8ee5d0c` is already inside the Phase 2/3 history.

## Commits on `main` that are not in Phase 3

| Commit | What it does |
|---|---|
| `88acd54` | Meta Pixel base code on 5 more pages; `Lead` on any form submit, `Contact` on WhatsApp/tel/mailto clicks |
| `58af001` | GTM container `GTM-MZT2JKM8` (head snippet + noscript iframe) on all 50 pages; `meta_lead` / `meta_contact` pushed to `dataLayer` |
| `95cf563` | `script.js?v=` cache-bust |
| `3f3a231` / `b9edf12` | Second GTM container `GTM-54VQF7S6` on all 50 pages (PR #2) |

I checked every changed line: these commits contain **only tracking changes**. No content, page or design work exists on `main` that is missing from Phase 3.

These snippets load GTM and Meta Pixel **without consent** on every page, including debt-specific URLs. That conflicts with the Phase 2 privacy safeguards: Consent Mode v2 defaults to denied, the Meta Pixel loads only after "Accept all", and only on the six neutral pages listed in `src/site.config.mjs`. Phase 3 already sends consent-gated Meta `Lead` (lead saved) and `Contact` (WhatsApp/call click, WhatsApp fallback) events. The only functionality on `main` that Phase 3 lacks is the two GTM container IDs and the `meta_lead` / `meta_contact` `dataLayer` events.

## Updates present in `c528029` (verified by building it)

`node tools/build.mjs` → 57 pages; `node tools/check.mjs` → 0 errors, 0 warnings; `node tools/test-lead.cjs` → all cases pass; `node tools/test-calculator.cjs` → 58 passed, 0 failed.

- Phase 2: shared templates (`src/templates.mjs`, `src/site.config.mjs`, `tools/build.mjs`), rebuilt service pages, legal checks (`tools/check.mjs`), lead API (`api/lead.js`, `LEAD_WEBHOOK_URL`), cookie consent, Consent Mode GA4, Meta Pixel neutral-page restriction, SEO metadata, sitemap, redirects.
- Phase 3: design system, header/nav, hero, consultation popup, settlement calculator (`settlement-calculator.html`, in the sitemap).
- WhatsApp fallback on failed lead save (`src/js/site.js`: `showResult(false, …)` → `whatsapp_redirect`, full details prefilled, English and Hindi).
- Guide illustrations (`tools/guide-images.mjs`; 72 files in `assets/thumbs`, 600 px and 1200 px WebP).
- All six new English guides (in `dist/blog/`, the sitemap, `vercel.json` short-URL redirects, and with thumbnails).
- 31 English guides in total; four Hindi guides and the RBI 2027 pillar remain **drafts**, excluded from the build and the sitemap.

## Updates missing from production / `main`

All of the above. `main` has 25 root pages + 25 blog pages of static HTML and no `tools/`, `src/`, `api/` or build step.

## Vercel

**Update after the investigation:** Vercel's GitHub deployment records later confirmed the cause. Production deployment `5a4405a` (Phase 3) was replaced by production deployments of the old `main` (`95cf563`, `b9edf12`). See `docs/WEBSITE_RECOVERY_REPORT.md` §1.

Not accessible from this session: no Vercel connector, and outbound requests to Vercel and the live domain were blocked. **Not verified:** production branch, latest production deployment SHA, rollback events, preview URLs.

Note: the Phase 2/3 `vercel.json` sets `"buildCommand": "node tools/build.mjs"` and `"outputDirectory": "dist"`. The `main` version has neither and serves root files directly. A Vercel dashboard override of the build/output settings could break a Phase 3 deployment, so check these settings when deploying.

## Recommended recovery strategy

1. Base the recovery branch on `origin/main` (`b9edf12`) so it fast-forwards cleanly into `main`.
2. Join the Phase 3 history with a single `--allow-unrelated-histories` merge whose resulting tree is exactly `c528029`. This keeps all 22 original Phase 2/3 commits with their original SHAs. Cherry-picking would rewrite them and conflict in every page. Nothing is rebuilt by hand.
3. In a separate, reviewable commit, re-apply the newer work from `main`: the two GTM containers, loaded under the existing Consent Mode defaults, and the `meta_lead` / `meta_contact` `dataLayer` events. Do not reintroduce unconsented Meta Pixel loading.
4. Build, run all checks, open a PR into `main`, and do not merge or deploy without owner approval.
