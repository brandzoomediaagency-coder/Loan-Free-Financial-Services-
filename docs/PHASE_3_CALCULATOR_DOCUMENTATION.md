# Loan Settlement Scenario Calculator — documentation

Page: `/settlement-calculator.html` (follows the site's `.html` URL convention). Source: `src/pages/settlement-calculator.html`, logic and browser binding in `src/js/calculator.js` (loaded only on this page via front matter `"scripts": ["calculator"]`). Tests: `tools/test-calculator.cjs` (unit) and `tools/qa/calculator-browser.mjs` (browser).

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
- Analytics: one aggregate event `calculator_used` per page view, **with no parameters**, sent through the existing GA4 set-up and therefore under the existing Consent Mode rules. No Meta Pixel event; the pixel does not run on this page at all (neutral-URL rule from Phase 2).
- The consultation button opens the existing secure enquiry dialog; no figures are copied into it. WhatsApp links use the standard neutral message.
- The page asks for no names, PAN, account numbers or passwords.

## Test coverage (executed)

`node tools/test-calculator.cjs` — **47 passed, 0 failed**: parsing (grouping, ₹/Rs prefixes, decimals, empty, negative, text, mixed, very large, limit), capacity (normal, optional fields, negative, exactly zero, expenses > income, zero income), required/invalid fields, scenario (remaining, months incl. rounding up, difference, progress, equal-to-outstanding, above-outstanding, zero, savings ≥ hypothetical, zero capacity, > 10 years, very large, decimals, never suggests an amount), formatting (Indian grouping, paise, month wording) and static privacy checks on the source (no storage, network, URL writes, console, Meta calls; single parameter-free analytics call).

`node tools/qa/calculator-browser.mjs` (local server on :8090) — **40 passed, 0 failed** at 1440 px and 390 px, with cookies fully accepted (strictest case): live results and arithmetic, Indian grouping on blur, Enter does not navigate, validation messages and `aria-invalid`, zero-capacity explanation, reset, and privacy — no entered value in any network request, the URL, storage or the console; `calculator_used` carries no parameters; Meta Pixel absent; consultation dialog and WhatsApp links carry no values.

## Content review

The explanatory text uses only facts already verified in Phase 2 (RBI compromise-settlement framework: board-approved policies, >3 months treated as restructuring, 12-month cooling period; "Settled" reporting). It should be included in the legal review with the other pages (`docs/LEGAL_REVIEW_LOG.md`).
