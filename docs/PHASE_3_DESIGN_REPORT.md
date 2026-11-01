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

QA_RESULTS

PERF_RESULTS

## Remaining manual actions and owner approvals

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
