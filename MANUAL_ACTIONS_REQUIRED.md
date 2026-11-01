# Manual actions required

Things that need your decision, your accounts, or a qualified professional. Nothing here has been done on your behalf. Items marked **Before launch** should be resolved before the `phase-2-implementation` branch goes to production.

## 1. Decisions only you can make

| # | Item | Why it matters | Where it is used | Before launch? |
|---|---|---|---|---|
| D1 | **Enquiry store / CRM.** Choose a private Google Sheet, a CRM (name it) or email. | Forms currently fall back to WhatsApp because no receiver is configured. | `docs/LEAD_CAPTURE.md` | **Yes** |
| D2 | **Operating entity.** Confirm that Athena Legal Solution LLP operates Loan Free, and provide the LLPIN. | Privacy policy names it as Data Fiduciary; About page hides the operator row until confirmed. Set `operatorConfirmed: true` and `llpin` in `src/site.config.mjs`. | Privacy policy, About, JSON-LD | **Yes** |
| D3 | **Hours.** Confirmed by you on 1 Nov 2026: Monday–Saturday, 10 a.m.–8 p.m. Shown in the top bar, footer, contact pages and structured data. | — | `src/site.config.mjs` | Resolved |
| D4 | **Email on the site's own domain** (e.g. `info@loanfree.info`). The site uses `info@athenalegalsolutionllp.in`. | Brand/entity consistency. Optional but recommended. | `src/site.config.mjs` + Contact, Delhi, policies | No |
| D5 | **Fee model.** Describe how you charge (fixed, stage-based, success-linked, ranges). | The site now says "ask for our fees in writing". A real fee page builds trust. | Services `#fees`, FAQ, About | No |
| D6 | **People.** Names, roles, real photos and (for advocates) enrolment details of the founder, advisers and any reviewer, with their written consent. | E-E-A-T. Nothing about people has been invented; the team block is empty until `SITE.people` is filled. | About, review boxes, Person schema | No |
| D7 | **Homepage testimonials.** Removed from the homepage in Phase 3 (`showHomepageTestimonials: false`). Re-enable only for quotes backed by a written consent record. | Unverifiable testimonials are a trust and consumer-law risk. | `src/templates.mjs` (`QUOTES`) | Resolved for launch |
| D8 | **Meta Pixel scope.** It now runs only on neutral URLs after consent (see `docs/TRACKING_VERIFICATION.md`). Confirm, or decide to drop Meta entirely. | Debt-distress URLs would otherwise go to Meta. | `SITE.analytics.metaPixelPages` | No |
| D9 | **Court-complex address — Google Business Profile only.** You confirmed on 1 Nov 2026 that the Tis Hazari address is correct, so it stays on the site. Still to check before creating a GBP listing: Confirm you may use Chamber No. 698, Tis Hazari as a business address for a consultancy, and that it is eligible for a Google Business Profile (staffed during stated hours, signage, etc.). | GBP suspension risk; Bar Council rules (see L2). | Contact, Delhi, GBP | **Yes** |
| D10 | **Old root files** `CNAME`, `_redirects`, `serve.ps1`, root `robots.txt`/`sitemap.xml` are no longer used (the build generates `dist/`). Confirm they can be deleted. | Housekeeping only. | Repo root | No |
| D12 | **Canva scratch design.** I created "Focused Scene with Natural Light" in your Canva account to export the generated photos (with your approval each time; it now has 10 pages — 9 site photos plus page 1). Its first page holds a stock image Canva inserted, which is not used anywhere. Delete the design whenever you like; the photos are saved in the project (`src/photos/`). | Housekeeping | Canva | No |
| D11 | **Phase 3 homepage H1** "A clearer path to resolving your debt challenges" (briefed) replaced the keyword-led H1. Approve, or ask for the keyword version back. | SEO/brand preference. | `src/pages/index.html` | No |

## 2. Professional review

| # | Item | Reviewer | Before launch? |
|---|---|---|---|
| L1 | Review all legal/regulatory statements listed in `docs/LEGAL_REVIEW_LOG.md` (service pages, FAQ, RBI 2027 pillar, Hindi drafts). Then add the reviewer to `SITE.people` and set `reviewer`/`lastReviewed` on reviewed pages. | Advocate familiar with banking/recovery law | **Yes** for live service pages |
| L2 | **Bar Council of India Rule 36** (advocates must not solicit or advertise). If any advocate is involved in Loan Free, check the site, the court-chamber address and the "coordinate with independent counsel" wording. | Advocate | **Yes** |
| L3 | Privacy policy, cookie banner text and terms against the DPDP Act, 2023 and DPDP Rules. | Privacy counsel | **Yes** |
| L4 | Hindi pages: native-language review for natural wording, and legal review. | Hindi reviewer + advocate | Before publishing `/hi/` |
| L5 | Any advertising copy (Google/Meta ads) for debt-related services, against platform financial-services policies. | Marketing/compliance | Before ads |

## 3. Account access (we did not log in to any of these)

| # | Task | Steps |
|---|---|---|
| A1 | **Vercel: permanent apex redirect.** | Vercel > Project > Settings > Domains: set `loanfree.info` to redirect to `www.loanfree.info` with **308 Permanent** (currently 307). |
| A2 | **Vercel: environment variables.** | Add `LEAD_WEBHOOK_URL` and `LEAD_WEBHOOK_SECRET` (Production + Preview) once D1 is decided. |
| A3 | **Vercel: build settings.** | `vercel.json` now sets `buildCommand: node tools/build.mjs` and `outputDirectory: dist`. Check that dashboard overrides are not set, then deploy a **preview** first. |
| A4 | **Google Search Console.** | Verify a Domain property for `loanfree.info` (DNS). Submit `https://www.loanfree.info/sitemap.xml`. After launch, use URL Inspection on the homepage and 3 service pages. Export a baseline before launch. |
| A5 | **GA4.** | Confirm `G-QF7NBLW9G0` is the right property; apply the settings in `docs/TRACKING_VERIFICATION.md`. |
| A6 | **Bing Webmaster Tools.** | Import from Search Console; submit the sitemap. |
| A7 | **Google Business Profile, Bing Places, Apple Business Connect, Justdial, LinkedIn page.** | After D3/D9. See `docs/LOCAL_SEO_GBP.md`. |
| A8 | **Social profiles.** | Add LinkedIn/YouTube/GBP URLs to `SITE.social` when they exist (used in `sameAs`). |

## 4. External actions

| # | Task |
|---|---|
| E1 | Real photos: office exterior/interior and team (with consent). No AI-generated people. See `docs/IMAGE_INVENTORY.md`. |
| E2 | Review programme on Google Business Profile: ask every client, no incentives, no review gating, never write reviews yourself. |
| E3 | Outreach: approve each pitch in `docs/BACKLINKS_OUTREACH.md` before it is sent, and name the spokesperson. |
| E4 | Case studies: only with written client consent and anonymised details. |

## 5. Production launch checklist (after the items above)

1. Deploy the branch to a **Vercel preview** and run the checks in `WEBSITE_IMPLEMENTATION_PLAN.md` (section "Launch checks").
2. Confirm D1–D3, D7, D9, L1–L3.
3. Give explicit approval to deploy to production. **We will not deploy without it.**
4. After launch: A1, A4 (submit sitemap, inspect URLs), A5, then compare Lighthouse/CrUX with the baseline in `docs/perf/`.
