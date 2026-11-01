# Phase 3 design report — premium redesign, UX and conversion

Branch `phase-3-design-upgrade`, created from `phase-2-implementation` at `7e99185`. Nothing was merged into `main`, deployed, or connected to an external service. No Vercel preview was created (no approved preview workflow).

## 1. Starting point (Stage A)

- Phase 2 was intact: 50 production pages built by `tools/build.mjs` from `src/pages`, shared templates, secure `/api/lead`, consent banner, privacy-safe tracking, drafts excluded from the live build. Working tree clean.
- Design inconsistencies found: two CSS layers (`base.css` 58 KB legacy + `components.css` overrides) fighting each other; solid Font Awesome icons mixed in style and weight; three different card styles; the Services page used older card markup and listed 9 of the 10 services; the header had no service menu; the footer was a plain list; long service pages had no way to jump between sections; homepage testimonials were still shown although unverified.

## 2. Reference analysis — settlemyloan.in (structure only)

Studied at 1440 px and 390 px. Nothing was copied (no code, text, images, claims or identity).

| Their pattern | What we took | What we deliberately did not take |
|---|---|---|
| Utility bar with phone/email above the nav | Slim navy top bar on desktop: confidentiality note, phone, email | Search icon, multiple phone numbers |
| Services mega-menu | Grouped Services dropdown (4 groups, 10 real services) | Services we do not offer (time-barred, reversal, foreclosure …) |
| Hero with a consultation form beside the copy | Hero with a compact enquiry card — uses our secure endpoint and consent | Fields asking for debt amount, missed EMIs, email in the hero; "callback within 24 hours" promise |
| Numbered service categories | Grouped service index with icons | Large stock photo of a laptop |
| 6-step horizontal process | 6-step timeline with connecting line (vertical on mobile) | "Agreed terms" / "completion" stages implying an outcome |
| Plus-icon FAQ accordion | Accessible accordion with rotating chevron | — |
| Dark multi-column footer | Dark 4-column footer | ISO badges, app-store badges, GST line (not ours) |
| — | — | "40,000+ accounts", "53% proceed", "83% savings", star-rated testimonials, case-study carousel, 45-day challenge, staff/client photos, chat widget |

## 3. Design direction (Stage B)

**Positioning:** a calm, established Indian financial-services consultancy — clear, confidential, never pushy.

**Palette** (tokens on `:root` in `src/css/site.css`, standardised from the Phase 2 colours):

| Token | Value | Use |
|---|---|---|
| `--navy-900` / `--navy-800` / `--navy-950` | #0B2035 / #15334B / #071726 | Headings, hero, footer |
| `--green-600` / `--green-700` | #167B68 / #10604F | Primary buttons / links and small text (AA on white and tints) |
| `--gold-500` / `--gold-700` | #D6AE58 / #8A6516 | Accents, eyebrows, caution markers |
| `--bg-soft`, `--bg-muted`, `--line` | #F7F9FC, #EEF2F6, #E2E8F0 | Section backgrounds, borders |
| `--ink`, `--muted` | #1F2937, #556070 | Body text, secondary text (≥ 5.9:1 on white) |

**Typography:** kept the self-hosted Inter (body) and Poppins (headings) from Phase 2 — no new font downloads. Fluid type scale with `clamp()`, tighter heading tracking, 1.65–1.75 line height for reading.

**Icons:** Lucide outline icons (ISC licence) for the whole interface, built into one SVG sprite; Font Awesome kept only for brand marks (WhatsApp, Facebook, Instagram) and numerals, which Lucide does not provide. Pages still write `<i class="fas fa-…">`; `tools/build.mjs` maps names.

**System:** one radius scale (8/12/18 px), three shadow levels, one button family (primary green, outline, light, ghost-on-dark; WhatsApp buttons are outline with a WhatsApp-green mark so there is a single primary CTA colour), consistent section spacing (`--section`), 16–32 px fluid gutters.

## 4. Components created or rebuilt

| Component | Where | Notes |
|---|---|---|
| Site header | All pages | Top bar (desktop), Services dropdown (disclosure button, Escape/outside-click to close), full-screen mobile drawer with call/WhatsApp, `aria-current` on the active section |
| Footer | All pages | Brand + "not a lender" note, all 10 services, resources, company, contact, legal row, cookie settings, disclaimer |
| Services index | Homepage, Services page | Generated from one catalogue (`SERVICE_GROUPS` in `src/site.config.mjs`) — also feeds the menu and footer |
| "On this page" rail | 14 long pages | Built automatically from H2s; sticky with a consultation card on desktop, collapsible at the top on mobile; highlights the section being read |
| Hero enquiry card | Homepage | Compact form on the existing `/api/lead` flow |
| Situation cards, timeline, feature grid, do/don't panels, knowledge-centre chips, FAQ layout, final CTA | Homepage | |
| CTA band | Most pages | Copy + actions side by side |
| Long-form styles | All content pages | Answer box, check/cross lists, numbered steps with connector, tables with a navy header and horizontal scroll on small screens, caution boxes (neutral markers, not ticks), sources, review box, accordions |

## 5. Homepage (Stage C)

Section order as briefed: header → hero → situations → services → how it works → why Loan Free → what we do / do not do → knowledge centre → FAQs → final CTA → footer.

- **Hero:** kept free of photos (Phase 2 decision). Considered a small SVG illustration; chose the enquiry card instead because it adds a conversion path at no image cost. The LCP element remains text.
- **H1 changed** from "Professional Guidance for Loan Settlement & Debt Resolution in India" to the briefed "A clearer path to resolving your debt challenges"; the keyword phrase moved to the line directly above the H1 and the `<title>`/description are unchanged.
- **Testimonials removed** from the homepage (`showHomepageTestimonials: false`): they were never verified (MANUAL_ACTIONS D7) and this brief forbids publishing unverified testimonials.
- **FAQs:** the 11 existing answers were moved verbatim (not rewritten); FAQPage schema is still generated from them.
- **Knowledge centre:** six topic links; "Hindi guides" shown as "after review" without a link, because the Hindi pages remain unpublished drafts.

PERF_AND_QA

## Outstanding decisions and manual actions

Unchanged from `MANUAL_ACTIONS_REQUIRED.md`, plus:

| # | Decision | Why |
|---|---|---|
| P3-1 | Approve the new homepage H1 or ask for the keyword-led one back | SEO/brand preference |
| P3-2 | Confirm the Tis Hazari address and Mon–Sat 10–8 hours before launch (D3/D9) | The address is the one already published on your live site; it is shown in the footer, contact page and final CTA. If you would rather not show it until verified, it can be removed from these places in one config change. |
| P3-3 | Testimonials | Removed from the homepage. Re-enable only for quotes with written client consent. |
| P3-4 | Real photography | No photos of people are used. If you want a human element, commission real photos of your office/team (with consent); see `docs/IMAGE_INVENTORY.md`. |
| P3-5 | Vercel preview | Not created. If you approve a preview workflow, deploy the branch as a preview and run the launch checks in `WEBSITE_IMPLEMENTATION_PLAN.md`. |
