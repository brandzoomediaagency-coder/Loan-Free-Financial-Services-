# SEO implementation tracker

Every finding from the audit (Claude Doc "Website Growth Audit 2026" and `LoanFree_Audit_Workbook_2026-10-31.xlsx`) mapped to what was done. Branch `phase-2-implementation`; nothing is deployed.

Status values: **Fixed** · **Partially fixed** · **Requires your input** · **Requires account access** · **Requires legal review** · **Requires external action**. Verification commands: `node tools/build.mjs && node tools/check.mjs` (0 errors / 0 warnings on 50 pages at last run) and `node tools/serve.mjs --root dist`.

## Technical issues (workbook "Tech Issue Tracker")

| ID | Finding | Solution | Files | Status | Verification |
|---|---|---|---|---|---|
| T01 | Apex domain 307 (temporary), 2 hops for http apex | Host-based permanent redirect apex → www in `vercel.json`; dashboard domain redirect must also be set to 308 | `vercel.json` | **Requires account access** (A1) | After deploy: `curl -sI http://loanfree.info/` → single 308 to `https://www.loanfree.info/` |
| T02 | `/index.html` 200 + 139 internal links to it | All internal links → `/`; `/index.html` → `/` (308) | templates, pages, `vercel.json` | Fixed | `grep -r 'href="/index.html"' dist` returns nothing; serve.mjs emulates redirect |
| T03 | Two templates | One header/footer/dialog/CTA system rendered by the build for all 50 pages | `src/templates.mjs`, `tools/build.mjs` | Fixed | All pages built from templates |
| T04 | Orphans / weak internal links | Related-guides blocks (3–5) on every service page and guide; contextual links; service backlink in every guide | pages, `templates.related()` | Fixed | `docs/inventory/internal-links.md` (min 2 inbound; no orphans) |
| T05 | "2024" in titles; URL with 2024 | Titles/H1 made year-less; URL kept (linked from 24 pages); 2027 section added | `blog/rbi-guidelines-2024-borrower-rights.html` | Fixed (URL kept deliberately) | Title: "RBI Rules on Recovery Agents: Borrower Rights" |
| T06 | Immutable cache on un-fingerprinted CSS/JS | Hashed `site.<hash>.css/js`, `icons.<hash>.svg`; immutable only on `/assets/build` and fonts; 30-day on images; HTML must-revalidate | `tools/build.mjs`, `vercel.json` | Fixed | Response headers via serve.mjs / after deploy |
| T07 | 3.48 MB hidden Unsplash background | Removed both Unsplash URLs; navy gradient | `src/css/base.css` | Fixed | Page weight 904 KB → see performance table |
| T08 | Font Awesome CSS render-blocking | Inline SVG sprite of the 63 icons used (FA Free, CC BY 4.0) | `src/icons`, build | Fixed | No requests to cdnjs |
| T09 | Google Fonts, 7 weights | Self-hosted Inter (variable) + Poppins 600/700, Latin + Devanagari subsets, `font-display: swap`, preload, metric-matched fallbacks | `src/css/fonts.css`, `assets/fonts` | Fixed | No requests to fonts.googleapis.com |
| T10 | No WebP/AVIF/srcset | WebP 480/800/1200 + `<picture>`; width/height; lazy below fold; `fetchpriority` only on LCP image | build `pictureFor()` | Fixed (WebP; AVIF not added — WebP covers all target browsers) | check.mjs srcset/alt checks |
| T11 | Titles > 60 chars | Rewritten for all pages (≤ 62 incl. "\| Loan Free") | all pages | Fixed | `docs/inventory/metadata.md` |
| T12 | Descriptions > 160 | Rewritten (120–160) | all pages | Fixed | same |
| T13 | Skipped heading levels | One H1; H2→H3 sequence; h4→h3 | pages | Fixed | check.mjs heading-order check |
| T14 | Schema mismatches | ProfessionalService (not LegalService), ₹ price range removed, logo 48 KB, Article author = organisation editorial team until named people exist, BreadcrumbList, Service, FAQPage from visible accordions | `tools/build.mjs` | Fixed; Person/reviewedBy **Requires your input** (D6) | `docs/inventory/structured-data.md`; validator.schema.org after deploy |
| T15 | Identical sitemap lastmod | Real `dateModified` per page; noindex/draft pages excluded; hreflang alternates supported | build `sitemap()` | Fixed | `dist/sitemap.xml` |
| T16 | Extension-less paths 404 | 48 permanent redirects `/about` → `/about.html` etc. (auto-generated) | `vercel.json` | Fixed | `docs/inventory/redirects.md` |
| T17 | og:image = square logo | Unique 1200×630 card per page | `tools/media.mjs`, `assets/og` | Fixed | `<meta property="og:image">` per page |
| T18 | `/favicon.ico` 404 | Added favicon.ico, 32px PNG, apple-touch-icon | `assets/brand`, root copy | Fixed | `dist/favicon.ico` |
| T19 | Forms only open WhatsApp | Validated POST to `/api/lead` → signed webhook → confirmation with reference → WhatsApp | `api/lead.js`, `src/js/site.js` | Partially fixed — **Requires your input** (D1: choose store) | `node tools/test-lead.cjs` passes |
| T20 | No conversion events | `whatsapp_click`, `phone_call_click`, `consult_open`, `form_start`, `form_submit`, `contact_enquiry` — no PII | `src/js/site.js` | Fixed in code; key-event set-up **Requires account access** (A5) | `docs/TRACKING_VERIFICATION.md` |
| T21 | Meta Pixel missing on 5 pages | Pixel now consent-gated and limited to neutral URLs (by design) | `site.config.mjs`, build | Fixed (scope decision D8) | fbevents.js absent on service pages |
| T22 | Popup auto-opens at 1.5/2.5 s | Dialog opens on click, `#consult` link, or desktop exit-intent once per session; never on mobile load | `src/js/site.js` | Fixed | Manual test |
| T23 | No consent notice | Banner (Essential only / Accept all), Consent Mode v2 defaults denied, footer "Cookie settings" | templates, site.js, build head | Fixed; legal wording **Requires legal review** (L3) | `docs/TRACKING_VERIFICATION.md` steps 1–2, 6 |
| T24 | Outdated legal references | DL Directions 2025, BNS, RB-IOS 2026, 2027 recovery directions; every change logged | 25 posts + pages | Fixed; **Requires legal review** (L1) | `docs/research/legal_fix_log.txt`, `docs/LEGAL_REVIEW_LOG.md` |
| T25 | Testimonials page with specific waivers/full names | Page rebuilt as a feedback policy, `noindex`, out of sitemap; original archived | `testimonials.html`, `docs/archive/` | Fixed; homepage quotes **Requires your input** (D7) | `<meta name="robots" content="noindex">` |

## Design and UX (brief Part 2)

| Finding | Solution | Status |
|---|---|---|
| Homepage hero must stay text-only | Navy gradient, no image, H1 + two CTAs | Fixed |
| Empty grid gaps / uneven card heights | Balanced 3/2/1 grids, equal-height cards | Fixed |
| `$` icons | Rupee/neutral icons via build alias; checker bans dollar icons | Fixed |
| Duplicate floating WhatsApp + sticky bar | Desktop: floating button only; mobile ≤768px: sticky Call/WhatsApp bar only | Fixed |
| Repeated testimonials, excessive animation | One marquee with pause button, pauses off-screen and for reduced-motion; reveal animations only with JS | Fixed |
| 7 old-template pages | About, Contact, Services, Process, FAQ, Blog, Testimonials rebuilt | Fixed |
| Service page layout | 12 pages: breadcrumb, navy title, short answer, explanation, who it helps, eligibility & limitations, steps, documents, comparison table, risks, 6–8 FAQs, sources, review box, related guides, CTA, disclaimer | Fixed; **Requires legal review** |
| Illustrations in content only | 9 original SVG diagrams | Fixed |
| Misleading images (copyrighted book covers, US tax forms, stock "advisors") | Replaced or deleted | Fixed |

## Trust, E-E-A-T and compliance (Part 3)

| Finding | Solution | Status |
|---|---|---|
| Unsupported claims ("most trusted", "1000s of clients", "RBI-compliant", "within 30 minutes", "since 2020", guaranteed waivers, "free legal advice") | Removed; `tools/check.mjs` fails the build on banned phrases | Fixed |
| Implied RBI approval | Explicit "not approved by the RBI" in footer, disclaimer, service pages | Fixed |
| About page | Rebuilt with business model, services, how we work, fees approach, team block (empty until real people), office, grievance; operator row hidden until confirmed | Partially fixed — **Requires your input** (D2, D5, D6) |
| Named reviewers | Review box says "independent expert review pending" until a reviewer exists | **Requires your input / legal review** |
| Editorial policy | Rewritten honestly (no unverified team experience; AI-assistance disclosure; correction process) | Fixed |
| Bar Council Rule 36 exposure | Wording "coordinate with independent counsel"; flagged | **Requires legal review** (L2) |

## Content, AEO and GEO (Parts 6, 7, 13)

| Item | Status |
|---|---|
| 40–60 word answer boxes on service pages and key pages | Fixed |
| Comparison tables (Settled/Closed/Written-off; settlement vs restructuring vs consolidation vs full repayment; bank vs NBFC; recovery rules before/after 2027; legal notice types; Section 138 limits; regulated vs illegal app) | Fixed |
| Visible FAQs + FAQPage schema (no rich-result promise) | Fixed |
| Official sources sections | Fixed on service pages and refreshed posts |
| Visible "Last updated" dates | Fixed (review box on YMYL pages) |
| `llms.txt` | Generated at build (`dist/llms.txt`) — not a ranking factor |
| robots.txt allows Googlebot, Bingbot, GPTBot, OAI-SearchBot, PerplexityBot, ClaudeBot etc. | Fixed (`dist/robots.txt`) |
| RBI 2027 pillar | Draft — **Requires legal review** |
| Hindi `/hi/` section (hub + 4 pages) | Drafts — **Requires native + legal review** |
| 9 further articles | Briefs in `CONTENT_GAP_TRACKER.md` |
| Keyword-to-URL map | `docs/inventory/keyword-url-map.md` (39 live, 6 draft, 24 to create) |

## Local SEO and links (Parts 11, 12)

| Item | Status |
|---|---|
| GBP description, categories, services, Q&A, review process; NAP list | Prepared in `docs/LOCAL_SEO_GBP.md` — **Requires external action** + D3/D9 |
| Citations (Bing Places, Apple Business Connect, Justdial, LinkedIn) | **Requires external action** |
| Outreach targets, pitch template, LinkedIn/YouTube plans | `docs/BACKLINKS_OUTREACH.md` — **Requires your approval** |
| Linkable assets | 2 done (Settled vs Closed, 2027 infographic); 5 specified in `CONTENT_GAP_TRACKER.md` |
| Fake city pages | None created |

## Phase 3 — design upgrade (branch `phase-3-design-upgrade`)

Full details: `docs/PHASE_3_DESIGN_REPORT.md`.

| Item | Solution | Status | Verification |
|---|---|---|---|
| Inconsistent legacy CSS (two layers, 62 KB) | One design-system stylesheet `src/css/site.css` with tokens; legacy files removed | Fixed | Build uses `fonts.css` + `site.css` only |
| Mixed icon styles | Lucide outline icons in one sprite; Font Awesome only for brand marks and numerals | Fixed | Sprite comment lists both licences |
| No services menu; plain footer | Header with grouped Services dropdown and mobile drawer; 4-column footer | Fixed | `interact3` tests (dropdown, drawer, Escape, focus) |
| Long service pages hard to scan | Automatic "On this page" rail from H2s (sticky desktop, collapsible mobile) | Fixed | 14 pages |
| Services page listed 9 of 10 services | Shared services index from one catalogue | Fixed | |
| Homepage redesign | Briefed section order; hero enquiry card on the secure endpoint | Fixed | |
| Unverified homepage testimonials | Removed (`showHomepageTestimonials: false`) | Fixed | |
| Unused legacy photos (14 + WebP variants, 1.6 MB) | Deleted; last three guides switched to generated topic images | Fixed | No page references `/assets/*.jpg` |
| Touch targets under 44 px | Chips, filters, arrow links, small buttons raised to 44 px | Fixed | Tap-target scan at ≤430 px |
| SEO preservation | Same 50 URLs, titles, descriptions, canonicals, robots, JSON-LD types, FAQ counts, sitemap set, robots.txt, vercel.json as Phase 2 | Verified | Diff of both builds; only the homepage H1 changed (intentional) |
| Homepage H1 | Changed to the briefed headline; keyword line moved above it | Requires your approval (P3-1) | |
