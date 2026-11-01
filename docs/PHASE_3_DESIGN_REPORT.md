# Phase 3 design report — premium redesign, original imagery and settlement calculator

Branch `phase-3-design-upgrade` (built on `phase-2-implementation`; `main` untouched). Nothing was merged, deployed, or connected to a CRM. No Vercel preview was created (the owner has not approved a preview workflow). The first Phase 3 pass is archived in `docs/archive/PHASE_3_DESIGN_REPORT_v1.md`.

## 1. Git safety checks

Repository `Loan-Free-Financial-Services--main` (local only — no remote, so nothing to fetch). Working tree clean before starting. `main` at `793d47f` (baseline); `phase-2-implementation` intact with its 11 commits; `phase-3-design-upgrade` already existed with 4 earlier Phase 3 commits built on Phase 2, so work continued on it — nothing was reset or overwritten.

## 2. Design strategy

Positioning: a calm, established Indian financial-services consultancy — clear, confidential, never pushy. Every section answers one of three questions a worried borrower has: *Is this for me? Can I trust them? What happens if I get in touch?* Conversion relies on clarity rather than urgency: one primary action ("Get a Free Consultation"), a secondary low-commitment action (the calculator), and WhatsApp/phone as alternatives.

## 3. Competitor analysis — settlemyloan.in (structure only)

Studied at 1440 px and 390 px. No code, text, images, claims or identity were copied.

| Their pattern | Our version | Deliberately not taken |
|---|---|---|
| White header + contact strip | Navy contact bar (confidential consultation · Mon–Sat 10–8 · India-wide phone/WhatsApp · phone · email) above a white header | Multiple phone numbers, search |
| Services mega-menu | Services and Resources dropdowns (grouped, keyboard accessible) | Services we do not offer |
| Split hero with form | Split hero with copy + original photo and two reassurance cards; the enquiry form lives in the dialog and on the Contact page | Long hero form asking for debt amounts, EMIs missed, email |
| Image-led "how we work" cards | Four original photo cards ("How we help") | Stock people presented as staff |
| Six-step journey | Six-step icon timeline | Steps implying a guaranteed outcome |
| Case studies, testimonials, stats | "What you can expect from our consultation" commitments | 40,000+ accounts, % savings, star ratings, case studies, 45-day challenge |
| Dark footer with badges | Dark four-column footer with a "not a lender / not RBI-approved" note | ISO badges, app badges |

Where our version is stronger: a transparent "what we do / don't do" section, verified legal sources on every service page, a privacy-first calculator, honest limitations, and no unverifiable claims.

## 4. Design system

Tokens on `:root` in `src/css/site.css` (one stylesheet for all pages, replacing two legacy files).

| Token | Value | Use |
|---|---|---|
| Deep navy / secondary navy / darkest | #0B2035 / #15334B / #071726 | Headings, hero, footer |
| Emerald / dark emerald | #167B68 / #10604F | Primary buttons / links and small text |
| Premium gold / dark gold | #D6AE58 / #8A6516 | Accents, eyebrows, caution markers |
| Off-white / light surface / line | #F7F9FC / #EEF2F6 / #E2E8F0 | Section backgrounds, borders |
| Primary / secondary text | #1F2937 / #556070 | Body / supporting text |

Secondary text uses #556070 instead of the suggested #667085 because #667085 falls below WCAG AA (4.3:1) on the light-grey surface; #556070 is 5.7:1 or better on every background used.

Typography: the existing self-hosted Inter (body) and Poppins (headings) were kept rather than adding Manrope — it avoids new font downloads on the critical path and preserves Devanagari heading support for the Hindi drafts. Fluid type scale, tighter heading tracking, 1.65–1.75 reading line height.

Icons: Lucide outline icons (ISC) in one SVG sprite; Font Awesome only for brand marks and numerals. Radius scale 8/12/18 px, three shadow levels, one button family, 1280 px content width, 16–32 px fluid gutters.

## 5. Homepage (16 sections, in the briefed order)

1. Contact bar — verified details only (phone, email, hours confirmed by the owner, India-wide phone/WhatsApp support).
2. Header — Home · About Us · Services▾ · How It Works · Settlement Calculator · Resources▾ · FAQs · Contact, with "Get a Free Consultation". Full navigation from 1200 px; drawer below. Between 1200 and 1599 px the menu shows "Calculator" (screen readers still hear "Settlement Calculator") so the bar fits on one line.
3. Hero — "Understand your loan resolution options. Move forward with clarity." with the briefed copy, "Get a Confidential Consultation", "Try Settlement Calculator" and the reassurance line. Right: original photo, labelled "Illustrative image", with two verified reassurance cards.
4. Trust strip — five verified service characteristics; no statistics.
5. Situations — six cards linking to existing pages.
6. Services — all ten real services in a 12-cell grid (two featured with illustrations), each with "Learn more" and "Free consultation".
7. How we help — four original photo cards; states that not every lender agrees to a settlement.
8. Calculator preview — "Explore your settlement scenario" + "Open Calculator".
9. Six-step timeline — step 3 is "Financial assessment" rather than "Financial and legal assessment", because Loan Free is not a law firm; legal questions go to independent advocates.
10. Why choose Loan Free — six genuine characteristics + the "who does what" diagram.
11. What we do / what we don't — the briefed lists, plus "We are not RBI-approved".
12. Knowledge centre — seven topic links (Hindi guides omitted until approved) and four resource cards including the calculator.
13. What you can expect from our consultation — replaces testimonials, which stay unpublished (unverified).
14. FAQ — the 11 existing answers, unchanged; link to the full FAQ page.
15. Final CTA — briefed headline and copy, consultation + WhatsApp, verified contact details.
16. Footer — brand, services, resources (including the calculator), company, contact, legal.

The homepage `<title>` and meta description are unchanged; the H1 changed to the briefed headline (owner decision D11).

## 6. All pages

All 51 pages (50 existing + the calculator) share the header, footer, typography, cards, tables, accordions, CTA band and long-form styles. Page-specific layouts:

- 13 pages have an original illustration in the hero (the 10 service pages, Settlement vs Restructuring, About, Calculator).
- 5 settlement pages have an in-page calculator promo before their FAQs.
- 15 long pages have an "On this page" rail (sticky on desktop, collapsible on mobile).
- The Services page uses the shared grouped service index; the guides index keeps its topic filters, which now accept deep links (`/blog.html#topic-credit`).

Reviewed page content was not edited, except the homepage, the new calculator page, the Services page index, and the hero/promo additions above (front matter and one marker line per page).

## 7. Images and illustrations created

- **5 original photographs** generated for the site (Indian people in Indian settings, or no people), exported at full size with the owner's approval and published as AVIF + WebP at 480/800/1200 px. Treated as illustrative and never presented as staff or clients.
- **10 original SVG illustrations**: About scene, calculator illustration, 8 service illustrations.
- **Share images** regenerated for the homepage and created for the calculator.
- Reused: the 9 Phase 2 diagrams and the generated guide images.
- Full inventory with sources, sizes, usage and alt text: `docs/IMAGE_INVENTORY.md`.

## 8. Settlement calculator

See `docs/PHASE_3_CALCULATOR_DOCUMENTATION.md` for formulas, inputs, validation, limitations, privacy and tests. Summary: an educational budgeting planner; the visitor enters every amount; no suggested percentage; capacity, remaining amount, illustrative months and "difference in your hypothetical scenario"; prominent disclaimer; all calculation in the browser with no storage, network, URL or console use; one parameter-free `calculator_used` analytics event under the existing consent rules; the Meta Pixel does not run on the page.

## 9. Quality assurance (all executed on this branch)

| Check | Command | Result |
|---|---|---|
| Build and static checks (links, assets, titles, descriptions, canonicals, JSON-LD, sitemap, headings, alt text) | `node tools/check.mjs` | 51 pages, 0 errors, 0 warnings |
| Calculator unit tests | `node tools/test-calculator.cjs` | 47 passed, 0 failed |
| Calculator in the browser, incl. privacy | `node tools/qa/calculator-browser.mjs` | 40 passed, 0 failed (1440 and 390 px) |
| Header, drawer, dropdowns, dialog, consent and Meta scope, TOC, form validation | `node tools/qa/interactions.mjs` | 28 passed, 0 failed |
| Secure enquiry endpoint (`/api/lead`) | `node tools/test-lead.cjs` | Passed |
| Unpublished drafts (5 Hindi pages, 2027 RBI recovery-rules draft) still build with the new templates, carry `noindex`, and are absent from the production build and sitemap | `node tools/build.mjs --drafts`, then `node tools/build.mjs` | 57 pages with drafts; production 51 pages, 49 sitemap URLs, no drafts |
| Responsive sweep: every page at 375, 390, 430, 768, 1024, 1440 px | `node tools/qa/sweep.mjs dist` | 306 page loads; 0 horizontal overflow, 0 console errors, 0 failed requests |

**Results for every page.** All 51 pages (50 existing + the calculator) passed the static checks and the six-width sweep. SEO was compared with the Phase 2 inventory: the 50 existing URLs keep their titles, meta descriptions, robots directives, canonicals and JSON-LD types; the only new URL is `/settlement-calculator.html` (added to the sitemap, now 49 indexable URLs); drafts stay excluded; `vercel.json` and robots.txt are unchanged. The only intentional on-page SEO change is the homepage H1 (D11).

**Accessibility.** Lighthouse accessibility is 100 on all six audited pages (mobile and desktop). Keyboard: dropdowns open with Enter/Space, one at a time, close on Escape and outside click, and return focus to their button; on mobile, one Escape closes the drawer and returns focus to the menu button; the enquiry dialog moves focus inside and restores it on close. Remaining small tap targets at phone widths are inline text links inside paragraphs (exempt under WCAG 2.2 target size), 24 px "card-link" arrows that sit inside a larger clickable card, and the visually hidden honeypot field and consent checkbox (the checkbox has a full-width clickable label).

**Screenshots** (`docs/phase3/screenshots/v2/`, desktop 1440 px and mobile 390 px): home, calculator, personal loan settlement, credit card settlement, recovery agent harassment, about, resources, contact.


## 10. Performance (Lighthouse, Phase 2 → Phase 3)

Same tool, Chrome build, throttling and pages as the Phase 2 baseline, plus the new calculator page. Two sets were run because the Phase 2 report measured an uncompressed local server, while Vercel serves pages compressed. Raw output: `docs/perf/lighthouse-phase3v2-2026-11-01.txt` (Phase 3), `docs/perf/lighthouse-phase2-gzip-2026-11-01.txt` and `docs/perf/lighthouse-after-2026-11-01.txt` (Phase 2). Each figure is a single run; mobile LCP varies by about ±0.2 s between runs.

**Compressed (gzip, as Vercel serves pages) — Phase 2 → Phase 3, mobile**

| Page | Performance | LCP | FCP | TBT | CLS | Accessibility | Best practices | SEO | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| Home | 99 → 99 | 2.0 s → 2.0 s | 1.5 s → 1.5 s | 28 ms → 62 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 333 KB → 304 KB |
| Personal loan settlement | 100 → 100 | 1.7 s → 1.7 s | 1.4 s → 1.4 s | 38 ms → 52 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 292 KB → 291 KB |
| About | 100 → 100 | 1.7 s → 1.7 s | 1.2 s → 1.4 s | 55 ms → 41 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 291 KB → 291 KB |
| RBI guide | 99 → 99 | 1.7 s → 1.8 s | 1.4 s → 1.5 s | 73 ms → 24 ms | 0.025 → 0.023 | 100 → 100 | 100 → 100 | 100 → 100 | 303 KB → 312 KB |
| Contact | 100 → 99 | 1.7 s → 1.8 s | 1.2 s → 1.5 s | 42 ms → 31 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 288 KB → 285 KB |
| Calculator (new) | — → 99 | — → 1.8 s | — → 1.5 s | — → 53 ms | — → 0 | — → 100 | — → 100 | — → 100 | — → 295 KB |

**Compressed (gzip, as Vercel serves pages) — Phase 2 → Phase 3, desktop**

| Page | Performance | LCP | FCP | TBT | CLS | Accessibility | Best practices | SEO | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| Home | 100 → 100 | 0.4 s → 0.4 s | 0.3 s → 0.4 s | 0 ms → 0 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 333 KB → 339 KB |
| Personal loan settlement | 100 → 100 | 0.4 s → 0.4 s | 0.3 s → 0.3 s | 0 ms → 0 ms | 0.001 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 292 KB → 291 KB |
| About | 100 → 100 | 0.4 s → 0.4 s | 0.3 s → 0.3 s | 0 ms → 0 ms | 0.001 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 291 KB → 291 KB |
| RBI guide | 100 → 100 | 0.4 s → 0.4 s | 0.3 s → 0.3 s | 0 ms → 0 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 303 KB → 312 KB |
| Contact | 100 → 100 | 0.4 s → 0.4 s | 0.3 s → 0.3 s | 0 ms → 0 ms | 0.001 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 288 KB → 285 KB |
| Calculator (new) | — → 100 | — → 0.4 s | — → 0.3 s | — → 0 ms | — → 0 | — → 100 | — → 100 | — → 100 | — → 295 KB |

**Uncompressed (same conditions as the Phase 2 report baseline) — Phase 2 → Phase 3, mobile**

| Page | Performance | LCP | FCP | TBT | CLS | Accessibility | Best practices | SEO | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| Home | 94 → 94 | 2.8 s → 2.9 s | 2.0 s → 2.1 s | 30 ms → 32 ms | 0 → 0 | 96 → 100 | 100 → 100 | 100 → 100 | 472 KB → 455 KB |
| Personal loan settlement | 97 → 96 | 2.3 s → 2.5 s | 1.8 s → 1.8 s | 10 ms → 25 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 404 KB → 419 KB |
| About | 96 → 96 | 2.5 s → 2.6 s | 1.8 s → 1.8 s | 40 ms → 26 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 398 KB → 416 KB |
| RBI guide | 97 → 94 | 2.4 s → 2.8 s | 1.8 s → 2.0 s | 50 ms → 31 ms | 0.025 → 0.023 | 100 → 100 | 100 → 100 | 100 → 100 | 414 KB → 433 KB |
| Contact | 96 → 96 | 2.6 s → 2.5 s | 1.8 s → 1.8 s | 70 ms → 20 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 390 KB → 397 KB |
| Calculator (new) | — → 94 | — → 2.9 s | — → 2.0 s | — → 54 ms | — → 0 | — → 100 | — → 100 | — → 100 | — → 433 KB |

**Uncompressed (same conditions as the Phase 2 report baseline) — Phase 2 → Phase 3, desktop**

| Page | Performance | LCP | FCP | TBT | CLS | Accessibility | Best practices | SEO | Transfer |
|---|---|---|---|---|---|---|---|---|---|
| Home | 100 → 100 | 0.6 s → 0.6 s | 0.4 s → 0.5 s | 0 ms → 0 ms | 0 → 0 | 96 → 100 | 100 → 100 | 100 → 100 | 472 KB → 492 KB |
| Personal loan settlement | 100 → 100 | 0.5 s → 0.6 s | 0.4 s → 0.4 s | 0 ms → 0 ms | 0.001 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 404 KB → 419 KB |
| About | 100 → 100 | 0.5 s → 0.5 s | 0.4 s → 0.4 s | 0 ms → 0 ms | 0.001 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 398 KB → 416 KB |
| RBI guide | 100 → 100 | 0.5 s → 0.6 s | 0.4 s → 0.4 s | 0 ms → 0 ms | 0 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 414 KB → 433 KB |
| Contact | 100 → 100 | 0.5 s → 0.5 s | 0.4 s → 0.4 s | 0 ms → 0 ms | 0.001 → 0 | 100 → 100 | 100 → 100 | 100 → 100 | 390 KB → 397 KB |
| Calculator (new) | — → 100 | — → 0.6 s | — → 0.4 s | — → 0 ms | — → 0 | — → 100 | — → 100 | — → 100 | — → 433 KB |

**Reading the results**

- **Compressed (closest to production):** every page scores 99–100 on mobile and 100 on desktop, the same as Phase 2 within one point. LCP is unchanged or 0.1 s slower. CLS stays at 0 except the RBI guide (0.023, unchanged from Phase 2's 0.025). The homepage transfers 29 KB less on mobile despite the new photograph, because the photo is served as AVIF at a size matched to the screen.
- **Accessibility** is 100 everywhere; the homepage improved from 96 to 100.
- **Uncompressed (Phase 2 report conditions):** Home, About and Contact are level with Phase 2; Personal loan settlement is one point lower. **The RBI guide is lower: 97 → 94 (three reruns: 94, 96, 94; LCP 2.6–2.9 s against 2.4 s).** The cause is measurable: in the first Phase 3 pass the article's hero image moved to the shared 600/1200 px thumbnail set, and mobile screens pick the 1200 px file (image transfer 19 → 30 KB), and the single stylesheet is slightly larger (13 → 14 KB compressed). With compression on, the same page scores 99 with LCP 1.8 s (Phase 2: 99, 1.7 s). Adding an 800 px thumbnail for the 10 article heroes would close most of this gap if you want it; it was not done here.
- The new calculator page scores 99 (compressed) / 94 (uncompressed) on mobile and 100 on desktop. Its script loads only on that page.


## 11. Remaining manual actions and owner approvals

See `MANUAL_ACTIONS_REQUIRED.md`. New or changed in this phase:

| # | Item |
|---|---|
| D3 | Hours confirmed (Mon–Sat 10–8) — resolved |
| D9 | Address confirmed; only Google Business Profile eligibility of the court-chamber address remains |
| D11 | Approve the new homepage H1 |
| D12 | Optional: delete the Canva scratch design "Focused Scene with Natural Light" |
| — | Legal review now also covers the calculator page's explanatory text |
| — | Approve a Vercel preview workflow if you want a preview URL; none was created |
| — | Still open from earlier phases: enquiry store/CRM choice, operating entity and LLPIN, people/credentials, fees, testimonials with consent, legal and Hindi reviews |
