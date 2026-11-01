# Loan Settlement Scenario Calculator — documentation

Where it appears: its own page `/settlement-calculator.html` (with the explanatory content and FAQs) and the homepage section "Explore your settlement scenario" (`#calculator`, linked from the hero's "Try Settlement Calculator" button). Both use the same component: markup from `calculator()` in `src/templates.mjs` (build marker `<!-- lf:calculator -->`), logic and browser binding in `src/js/calculator.js`, loaded only on those two pages via front matter `"scripts": ["calculator"]`. Tests: `tools/test-calculator.cjs` (unit) and `tools/qa/calculator-browser.mjs` (browser, both pages).

## Purpose and limits

An **educational budgeting planner**. It shows how a figure the visitor chooses fits their own monthly budget and how long saving the remaining amount would take. It is **not** a settlement predictor or a financial recommendation:

- It never suggests, prefills or defaults a settlement amount or percentage. No universal percentage exists.
- It does not predict whether a lender will settle, what it will accept, or how long resolution takes.
- The "difference" result is labelled "Difference in your hypothetical scenario" and explained as not a saving, discount or waiver.

The required disclaimer is shown beside the results, together with a note that a settled account is usually reported as "Settled" and can make future borrowing harder.

## Inputs

| Field | Required | Notes |
|---|---|---|
| Current outstanding loan amount (₹) | Yes | Must be greater than zero |
| Monthly take-home income (₹) | Yes | Zero is allowed and explained |
| Essential monthly household expenses (₹) | Yes | |
| Other monthly commitments (₹) | No (0 if empty) | Other EMIs, excluding the loan being explored |
| Monthly safety buffer (₹) | No (0 if empty) | |
| Existing savings for this purpose (₹) | No (0 if empty) | |
| Hypothetical settlement amount (₹) | No | Entered by the visitor only; never suggested |

Accepted formats: `150000`, `1,50,000`, `₹ 1,50,000`, `Rs. 150000`, decimals (rounded to paise). Values are re-displayed with Indian digit grouping when a field loses focus.

## Sliders

Every amount can be typed or set by dragging a slider under the field. The text field is always the source of truth; the slider mirrors it.

| Field | Slider range | Scale |
|---|---|---|
| Outstanding | ₹0 – ₹1 crore | Cubic (fine control at small amounts) |
| Income, essential expenses | ₹0 – ₹5 lakh | Cubic |
| Other commitments | ₹0 – ₹3 lakh | Cubic |
| Safety buffer | ₹0 – ₹1 lakh | Cubic |
| Savings | ₹0 – ₹50 lakh | Cubic |
| Hypothetical amount | ₹0 – the outstanding amount entered | Linear |

- Dragging fills the field with a round figure (₹100 steps below ₹10,000, rising to ₹1 lakh steps above ₹1 crore); the end of a slider gives exactly its maximum.
- A typed amount above a slider's range is kept exactly as typed; the slider simply sits at its end.
- Sliders start unset (grey handle) — empty fields stay empty until the visitor types or drags.
- The hypothetical-amount slider is disabled until an outstanding amount is entered, ends at exactly that amount, and has no percentage marks or labels other than "₹0" and "Your outstanding amount", so it never suggests a figure. Dragging it back to the start clears the field.
- Sliders have no `name`, so they are never part of form data. Each has an accessible name and announces its value (`aria-valuetext`, e.g. "₹7,34,219"); keyboard arrows, Page Up/Down, Home and End work. Touch area is 44 px tall.
- On phones and tablets, a compact copy of the result summary sits just above the buttons and stays visible while the visitor drags, because the full results panel is further down the page. It is hidden from screen readers (the results panel already announces changes).

## Formulas

| Result | Formula | Shown when |
|---|---|---|
| Estimated monthly capacity | `max(0, income − expenses − commitments − buffer)` | Required fields valid |
| Remaining amount to build | `max(0, hypothetical − savings)` | Valid hypothetical entered |
| Illustrative months to build | `ceil(remaining ÷ capacity)`; `0` if remaining is 0 | Capacity > 0 (otherwise "Not possible with this budget") |
| Difference in your hypothetical scenario | `outstanding − hypothetical` | Hypothetical > 0 and ≤ outstanding |
| Savings progress | `min(1, savings ÷ hypothetical)` | Valid hypothetical entered |

Without a hypothetical amount, only the affordability snapshot (outstanding, capacity, savings) is shown.

## Validation and messages

| Condition | Behaviour |
|---|---|
| Empty required field | "This amount is needed." (shown after the field is touched or on submit) |
| Outstanding of zero | "Enter the amount currently outstanding on the loan." |
| Negative amount | "Amounts cannot be negative." |
| Text or invalid characters | "Please enter an amount using digits only, for example 150000." |
| Above ₹1,000 crore | "That amount looks too large. Please check it." |
| Zero income | Capacity ₹0 + explanation |
| Expenses greater than income | Capacity ₹0 + explanation |
| Zero capacity for other reasons | Capacity ₹0 + explanation; no timeline |
| Hypothetical of zero | Asked to leave empty or enter more than zero |
| Hypothetical greater than outstanding | Field error; no difference or timeline shown |
| Savings greater than or equal to hypothetical | Remaining ₹0, "Already covered", explanation |
| Timeline over 120 months | Shown as "More than 10 years" with explanation |

Errors use `aria-invalid` and `aria-describedby`; the summary line is an `aria-live` region; the progress bar is a labelled `role="progressbar"`. Enter submits without navigating and moves focus to the first error or to the results.

## Privacy implementation

- All calculation happens in the browser; there is no server call.
- No `localStorage`, `sessionStorage`, cookies or IndexedDB are used by the calculator.
- No URL parameters or hash are written; the form has no action and submit is prevented.
- No `console` output.
- Analytics: one aggregate event `calculator_used` per page view, **with no parameters**, sent through the existing GA4 set-up and therefore under the existing Consent Mode rules. No Meta Pixel event. The pixel does not run on the calculator page at all (neutral-URL rule from Phase 2). On the homepage, a neutral URL, the pixel may run after marketing consent; it is initialised with automatic event collection switched off (`autoConfig: false`), sends only its page-view on load, and the calculator never calls it — verified in the browser test.
- The consultation button opens the existing secure enquiry dialog; no figures are copied into it. WhatsApp links use the standard neutral message.
- The page asks for no names, PAN, account numbers or passwords.

## Test coverage (executed)

`node tools/test-calculator.cjs` — **58 passed, 0 failed**: slider scale (ends, clamping, never decreasing, fine control at small amounts, round figures, hypothetical linear and capped at the outstanding amount, typed values mapping back, no range before outstanding is entered), parsing (grouping, ₹/Rs prefixes, decimals, empty, negative, text, mixed, very large, limit), capacity (normal, optional fields, negative, exactly zero, expenses > income, zero income), required/invalid fields, scenario (remaining, months incl. rounding up, difference, progress, equal-to-outstanding, above-outstanding, zero, savings ≥ hypothetical, zero capacity, > 10 years, very large, decimals, never suggests an amount), formatting (Indian grouping, paise, month wording) and static privacy checks on the source (no storage, network, URL writes, console, Meta calls; single parameter-free analytics call).

`node tools/qa/calculator-browser.mjs` (local server on :8090) — **122 passed, 0 failed** on the calculator page and the homepage, each at 1440 px and 390 px, with cookies fully accepted (strictest case). Analytics and pixel beacons are intercepted and answered locally, so the test sees exactly what would be sent without sending anything to Google or Meta. Covers: sliders (not form fields; hypothetical disabled until outstanding is set; keyboard End/Home; exact maximum; start clears the hypothetical; real mouse drag gives a round figure; typing moves the slider; reset clears sliders), live results and arithmetic, Indian grouping on blur, Enter does not navigate, validation messages and `aria-invalid`, zero-capacity explanation, reset, and privacy — no entered value in any network request, the URL, storage or the console; `calculator_used` carries no parameters; Meta Pixel absent on the calculator page; on the homepage the pixel (which runs there after marketing consent, with automatic event collection switched off) sends no event at all while the calculator is used; no slider-produced amount appears in any request; consultation dialog and WhatsApp links carry no values.

## Content review

The explanatory text uses only facts already verified in Phase 2 (RBI compromise-settlement framework: board-approved policies, >3 months treated as restructuring, 12-month cooling period; "Settled" reporting). It should be included in the legal review with the other pages (`docs/LEGAL_REVIEW_LOG.md`).
