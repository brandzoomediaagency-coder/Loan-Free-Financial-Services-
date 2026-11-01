# Phase 3 design report — premium redesign, UX and conversion

Branch `phase-3-design-upgrade`, created from `phase-2-implementation` at `7e99185`. Nothing was merged into `main`, deployed, or connected to an external service. No Vercel preview was created (no approved preview workflow).

## 1. Starting point (Stage A)

- Phase 2 was intact: 50 production pages built by `tools/build.mjs` from `src/pages`, shared templates, secure `/api/lead`, consent banner, privacy-safe tracking, drafts excluded from the live build. Working tree clean.
- Design inconsistencies found: two CSS layers (`base.css`, 58 KB of legacy rules, plus `components.css` overriding it); heavy solid icons; several unrelated card and section styles carried over from the original template; the Services page used older card markup and listed 9 of the 10 services; the header had no service menu; the footer was a plain list; long service pages had no way to jump between sections; homepage testimonials were still shown although unverified.

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
| `--ink`, `--muted` | #1F2937, #556070 | Body text, secondary text (≥ 5.7:1 on every background used) |

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

## 6. Shared templates and all 50 pages (Stage D)

Every page is rebuilt from the same templates and stylesheet, so all 50 pages received the new header, footer, buttons, typography, cards, tables, accordions and CTA band. Page content was not edited, apart from:

| Page | Change |
|---|---|
| `index.html` | Redesigned (section 5) |
| `services.html` | Old 9-card grid replaced by the shared 10-service index; heading and intro copy unchanged |
| 3 guides (`improve-cibil-score…`, `how-to-remove-loan-settlement-status-cibil`, `rbi-guidelines-2024-borrower-rights`) | Header image switched from a stock photo to the generated topic image (image only) |

The "On this page" rail is added at build time to the 14 long pages with five or more sections (About, Process, the 10 service pages, Settlement vs Restructuring, Delhi); it only adds `id`s to existing H2s. Legal and regulatory wording is unchanged everywhere, and the Hindi and RBI 2027 drafts are still excluded from the live build and sitemap.

## 7. Images (Stage E)

- **Removed:** all 14 legacy stock photos and their 36 WebP variants (1.6 MB). None were used after the redesign.
- **Reused:** the 9 original diagrams (homepage now shows `how-we-work.svg`), the generated guide images for resource cards, and the per-page share images.
- **Added:** no new raster images. Interface icons are Lucide SVGs. A "consultation scene" image was not produced: it would need people, and the rules for this site exclude stock or AI-generated people presented in a business context; real, consented office/team photos remain the recommendation (P3-4).
- Every content image keeps explicit width/height, lazy loading below the fold and meaningful alt text (homepage resource-card thumbnails use empty alt because the card title is the link text).

## 8. Quality assurance (Stage F)

| Test | Result |
|---|---|
| `node tools/check.mjs` (canonical, titles, descriptions, one H1, heading order, JSON-LD, links/assets, srcset, alt, banned claims, orphans) | 50 pages, 0 errors, 0 warnings |
| `node tools/test-lead.cjs` (secure endpoint) | All cases behave as in Phase 2: valid lead delivered with verified signature and sanitised fields; honeypot and too-fast submissions dropped; missing consent, bad mobile, wrong origin and wrong secret rejected |
| Responsive sweep: all 50 pages × 375, 390, 430, 768, 1024, 1440 px (300 loads, headless Chrome) | 0 pages with horizontal overflow, console errors or failed requests |
| Tap targets ≤ 430 px | All stand-alone controls ≥ 44 px after fixes; remaining smaller items are inline text links, the hidden honeypot field, the consent checkbox (its whole label is the target) and card titles (the whole card is the target) |
| Interaction tests (23) | 23/23 pass: consent banner; no Meta request before consent; Meta on homepage after "Accept all" but not on service pages; Services dropdown opens/closes by keyboard with focus return; mobile drawer opens full-height, hides the sticky bar, expands services, closes on Escape with focus return; no floating WhatsApp button on mobile; consultation dialog opens by keyboard and closes on Escape; "On this page" open on desktop, collapsed on mobile; empty hero form shows field errors; filled form with no receiver configured shows the honest fallback, never a fake success |
| SEO diff against the Phase 2 build | Same 50 URLs; titles, descriptions, canonicals, robots, JSON-LD types and FAQ counts identical on every page; sitemap URL set, `robots.txt` and `vercel.json` identical; only the homepage H1 changed (intentional) |
| Drafts | `/hi/*` and `/rbi-recovery-agent-rules-2027.html` absent from `dist/` and the sitemap |
| Bug found and fixed during QA | The header's `backdrop-filter` made the mobile drawer render as a thin strip; blur is now desktop-only and a geometry assertion was added to the test |

Screenshots (in `docs/phase3/screenshots/`): `before-home-1440.jpg`, `before-home-390.jpg`, `after-home-1440.jpg`, `after-home-390.jpg`, `before-service-1440.jpg`, `before-service-390.jpg`, `after-service-1440.jpg`, `after-service-390.jpg`, `after-menu-desktop.png`, `after-menu-mobile.png`. The mobile homepage is 39% shorter (24,559 → 14,971 px of scrolling) with the same information plus the enquiry card; the testimonial carousel accounts for part of the difference.

## 9. Performance

PERF_RESULTS

## 10. Accessibility

- Keyboard: skip link; Services dropdown is a real `<button>` with `aria-expanded`/`aria-controls`, closes on Escape (focus returns) and outside click; mobile drawer toggle announces open/close, closes on Escape; dialog traps focus via native `<dialog>`; accordions are buttons with `aria-expanded`.
- Visible focus ring on every interactive element (`:focus-visible`, 3 px green outline or ring).
- Colour: text colours chosen for WCAG AA on white and on the light tints (`--green-700` 7.5:1 on white and 7.1:1 on the soft background; `--muted` 6.4:1 on white and 5.7:1 on the grey tint); white text only on navy or on `--green-600` buttons (5.2:1).
- Touch targets: stand-alone controls are at least 44 px high on phones (inline text links excepted, as WCAG 2.5.8 allows).
- Motion: reveal animations and smooth scrolling are disabled under `prefers-reduced-motion`; no autoplaying content on the homepage.
- Forms: visible labels, hints linked with `aria-describedby`, `aria-invalid` on errors, an `aria-live` status line, and an honest result panel.



## Outstanding decisions and manual actions

Unchanged from `MANUAL_ACTIONS_REQUIRED.md`, plus:

| # | Decision | Why |
|---|---|---|
| P3-1 | Approve the new homepage H1 or ask for the keyword-led one back | SEO/brand preference |
| P3-2 | Confirm the Tis Hazari address and Mon–Sat 10–8 hours before launch (D3/D9) | The address is the one already published on your live site; it is shown in the footer, contact page and final CTA. If you would rather not show it until verified, it can be removed from these places in one config change. |
| P3-3 | Testimonials | Removed from the homepage. Re-enable only for quotes with written client consent. |
| P3-4 | Real photography | No photos of people are used. If you want a human element, commission real photos of your office/team (with consent); see `docs/IMAGE_INVENTORY.md`. |
| P3-5 | Vercel preview | Not created. If you approve a preview workflow, deploy the branch as a preview and run the launch checks in `WEBSITE_IMPLEMENTATION_PLAN.md`. |
