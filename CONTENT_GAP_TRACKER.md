# Content gap tracker

Status of every content item the audit and brief called for, plus ready-to-write briefs for the articles not yet drafted. Legal/regulatory articles must not be published until the sources are checked and a named reviewer approves them (see `docs/LEGAL_REVIEW_LOG.md`). Drafts live in `src/pages` with `"status": "draft"`: they are excluded from the production build and appear (noindex, with a DRAFT banner) only with `node tools/build.mjs --drafts`.

## Status

| # | Item | URL | Status | Blocker |
|---|---|---|---|---|
| 1 | RBI Recovery Agent Rules 2027 (pillar) | `/rbi-recovery-agent-rules-2027.html` | **Draft written** (from official texts) | Legal review |
| 2 | Can a recovery agent visit home/office? | `/blog/recovery-agent-home-visit-rules.html` | Brief below | Writing + review |
| 3 | Loan settlement letter format | `/loan-settlement-letter-format.html` | Brief below | Writing + review |
| 4 | NOC after loan settlement | `/blog/noc-after-loan-settlement.html` | Brief below | Writing + review |
| 5 | Settled status on CIBIL (and loan after settlement) | `/blog/loan-after-settlement-cooling-period.html` | Brief below; core covered on `/credit-score-guidance.html` | Writing |
| 6 | Lok Adalat loan settlement (English) | `/blog/lok-adalat-loan-settlement.html` | Brief below; Hindi draft written | Writing + review |
| 7 | Credit card bill not paid | `/blog/credit-card-bill-not-paid-what-happens.html` | Brief below | Writing |
| 8 | Loan settlement fees | `/blog/loan-settlement-fees-india.html` (+ fees section) | Brief below | **Your fee model (D5)** |
| 9 | How to choose a settlement company | `/blog/how-to-choose-loan-settlement-company.html` | Brief below | Writing |
| 10 | Multiple loans / EMIs | `/blog/multiple-loans-debt-management-options.html` | Brief below | Writing |
| H0 | Hindi hub | `/hi/` | **Draft written** | Native + legal review |
| H1 | लोन सेटलमेंट कैसे करें | `/hi/loan-settlement-kaise-kare.html` | **Draft written** | Native + legal review |
| H2 | रिकवरी एजेंट से कैसे बचें | `/hi/recovery-agent-se-kaise-bache.html` | **Draft written** | Native + legal review |
| H3 | लोन नहीं भरा तो क्या होगा | `/hi/loan-nahi-bhara-to-kya-hoga.html` | **Draft written** | Native + legal review |
| H4 | लोक अदालत लोन सेटलमेंट | `/hi/lok-adalat-loan-settlement.html` | **Draft written** | Native + legal review |
| R1 | Refresh: RBI borrower-rights post | `/blog/rbi-guidelines-2024-borrower-rights.html` | **Done** — retitled, 2027 section added; URL kept | — |
| R2 | Refresh: Digital lending post | `/blog/digital-lending-apps-rbi-regulations.html` | **Done** — 2025 Directions | — |
| R3 | Refresh: RBI complaint post | `/blog/how-to-file-rbi-complaint-recovery-harassment.html` | **Done** — RB-IOS 2026, BNS | — |
| R4 | Refresh: calling-hours post | `/blog/recovery-agent-calling-hours-india-rbi.html` | **Done** — quotes 2027 directions | — |
| — | Service pages: answer box, table, 6–8 FAQs, sources, illustration | 12 pages | **Done** | Legal review |

### When publishing a Hindi page
1. Remove `"status": "draft"` and set `reviewer`/`lastReviewed`.
2. Add the reciprocal `"alternates"` to the English page it pairs with (hreflang must be two-way): `/personal-loan-settlement.html` ↔ H1, `/recovery-agent-harassment-protection.html` ↔ H2, `/blog/what-to-do-when-you-cannot-pay-emi.html` ↔ H3, `/blog.html` ↔ H0. H4 has no English pair until item 6 is published.
3. Run `node tools/media.mjs hi-<slug>` for the OG card, then build and check.

## Linkable resources

| Resource | URL (proposed) | Status | Notes |
|---|---|---|---|
| Borrower rights checklist (PDF + page) | `/resources/borrower-rights-checklist.html` | Not started | Based on the verified 2027 directions; print-friendly page, PDF generated from it |
| Recovery agent evidence log | `/resources/recovery-evidence-log.html` | Not started | Printable table: date, time, number, name, agency, what was said, witnesses |
| Settlement document checklist | part of item 3 | Not started | Uses `settlement-documents.svg` |
| Settlement letter format | item 3 | Not started | Template with placeholders only; never a real client's letter |
| CIBIL Settled vs Closed guide | `/credit-score-guidance.html` | **Done** (page + illustration) | Could be offered as a one-page PDF |
| Settlement affordability planner | `/tools/settlement-affordability-planner.html` | Not started | Calculates what you could set aside per month and by when. **Must not predict a waiver %.** Runs in the browser; no data sent anywhere |
| RBI 2027 infographic | `/assets/illustrations/recovery-rules-2027.svg` | **Done** | Embeddable with attribution link |

---

## Article briefs

Each brief: SEO title · H1 · keywords · intent · direct answer (40–60 words) · outline · example · FAQs · sources · internal links · illustration · CTA · disclaimer · author/reviewer. Examples are illustrative scenarios, never presented as real clients.

### 2. Can a recovery agent visit your home or office?
- **SEO title:** Can a Recovery Agent Visit Your Home? RBI Rules | Loan Free
- **H1:** Can a Recovery Agent Visit Your Home or Office? What the RBI Allows
- **Keywords:** can recovery agent visit your house; recovery agent home visit rules; how to stop recovery agent home visit; recovery agent office visit
- **Intent:** Informational, high anxiety → service
- **Direct answer:** Yes, but within limits. From 1 January 2027, agents of banks and NBFCs should ordinarily meet you at a place of your choice, may come to your home or workplace only if you have not chosen one or missed two meetings, must visit between 8 a.m. and 7 p.m., and must carry ID and an authorisation letter.
- **Outline:** Short answer · Where agents may meet you (454Y(5)) · Notice one day before first visit (454L) · What they must show (454X) · Times and occasions to avoid · What they cannot do at your home or office (454Z) · Microfinance collection at a designated place (454Y(7)) · What to do during a visit (stay calm, ask for ID, do not sign, receipt) · If they harass your employer · Complaint route · FAQs
- **Example:** A salaried borrower asks the bank in writing to meet at a café near home on Saturdays; the agency then turns up at the office. The borrower notes the date, time and name, and cites the request in a complaint to the grievance officer.
- **FAQs:** Can they come on Sunday? · Can they come without notice? · Can they talk to my neighbours? · Can they take my belongings? (security enforcement only through lawful process) · What if the agent will not show ID? · Can I record the visit?
- **Sources:** RBI/2026-27/223 paras 454L, 454X, 454Y, 454Z; RBI/2026-27/230; RB-IOS 2026
- **Internal links:** → `/recovery-agent-harassment-protection.html`, `/rbi-recovery-agent-rules-2027.html`, `/blog/recovery-agent-calling-hours-india-rbi.html`; from those pages back to this one
- **Illustration:** "What a visiting agent must show" card (ID, authorisation letter, notice copy)
- **CTA:** "Facing home visits? Talk to us in confidence."
- **Disclaimer:** General information; not legal advice; go to police for threats.
- **Author/reviewer:** Editorial team / [named advocate — pending]

### 3. Loan settlement letter format
- **SEO title:** Loan Settlement Letter Format and Checklist | Loan Free
- **H1:** Loan Settlement Letter: Format, Sample Wording and What to Check
- **Keywords:** loan settlement letter format; letter to bank for loan settlement; credit card settlement letter; settlement letter sample pdf
- **Intent:** Transactional / linkable asset
- **Direct answer:** There are two letters: your request to the lender, and the lender's settlement letter. Your request explains the hardship and offers an amount. The lender's letter must state your account number, the agreed amount, the deadline and payment method, and that the account will be closed with no further dues.
- **Outline:** Two letters explained · Template A: borrower's settlement request (placeholders) · Template B: what the lender's letter must contain (checklist table, reuse from OTS page) · Red flags (no letterhead, personal account, "verbal settlement") · After payment: receipt, NOC · Downloadable template (DOCX/PDF from the page) · FAQs
- **Example:** Template with `[Name]`, `[Account number]`, `[Reason for hardship]`, `[Amount offered]` placeholders only.
- **FAQs:** Is an email from the bank enough? · Who should sign? · What if the letter says "settled" but not "closed"? · Can I negotiate after receiving it? · What if I miss the deadline?
- **Sources:** RBI compromise-settlement framework 2023
- **Internal links:** → `/loan-ots-one-time-settlement.html`, `/personal-loan-settlement.html`, item 4; from OTS and personal-loan pages
- **Illustration:** `settlement-documents.svg`
- **CTA:** "Want your settlement letter checked before you pay?"
- **Disclaimer:** Template for information only; adapt to your facts; no guarantee of acceptance.
- **Author/reviewer:** Editorial team / [named reviewer — pending]

### 4. NOC after loan settlement
- **SEO title:** NOC After Loan Settlement: How to Get It | Loan Free
- **H1:** NOC After Loan Settlement: What It Is and What to Do If the Bank Delays
- **Keywords:** noc after loan settlement; bank not giving noc after loan settlement; no dues certificate after settlement
- **Intent:** Informational → service
- **Direct answer:** After you pay the agreed settlement amount, ask the lender in writing for a no-dues certificate or closure letter confirming that nothing more is owed. Keep it with the settlement letter and payment receipt. If the lender delays, complain to its grievance officer and, after 30 days, to the RBI Ombudsman.
- **Outline:** What a NOC/no-dues letter is · Settlement letter vs NOC · How to request it (template) · Secured loans: return of original documents (check RBI's 2023 instruction on release of property documents before citing) · If the lender delays · Checking the credit report · FAQs
- **FAQs:** Is NOC compulsory? · How long does it take? · Does NOC change "Settled" to "Closed"? · What if the lender still calls after settlement? · Lost NOC — what now?
- **Sources:** RBI framework 2023; RB-IOS 2026; **verify** RBI circular on release of movable/immovable property documents (Sept 2023) before using
- **Internal links:** → item 3, `/credit-score-guidance.html`, `/loan-ots-one-time-settlement.html`
- **Illustration:** `settlement-documents.svg`
- **CTA:** "Lender not issuing your NOC? We can help you write to them."
- **Disclaimer / Author:** As above

### 5. Settled status on CIBIL and borrowing after settlement
- **SEO title:** Settled Status on CIBIL: Getting a Loan Again | Loan Free
- **H1:** "Settled" on Your CIBIL Report: What It Means and When You Can Borrow Again
- **Keywords:** settled status in cibil; can i get loan after settlement; settlement ke baad loan mil sakta hai
- **Direct answer:** "Settled" means the lender accepted less than the full amount, which future lenders treat as negative. The lender that settled with you must wait at least 12 months before lending to you again; other lenders decide case by case. Paying all other credit on time is the main way to rebuild.
- **Outline:** What "Settled" means (table from credit page) · Cooling period rule · Changing Settled to Closed · Rebuilding steps · Disputing errors · Avoiding "credit repair" scams · FAQs
- **Sources:** RBI framework para 11; CICRA 2005; credit bureau dispute pages
- **Internal links:** → `/credit-score-guidance.html`, `/blog/how-to-remove-loan-settlement-status-cibil.html`, `/blog/improve-cibil-score-after-debt-settlement.html`
- **Illustration:** `settled-vs-closed.svg`
- **Note:** Do not state how long "Settled" stays on a report or how often lenders report unless verified.

### 6. Lok Adalat loan settlement (English)
- **SEO title:** Lok Adalat Loan Settlement: How It Works | Loan Free
- **H1:** Lok Adalat Loan Settlement: What Happens and How to Prepare
- **Keywords:** lok adalat loan settlement; lok adalat notice for loan; lok adalat loan settlement process
- **Direct answer:** Lok Adalats, held under the Legal Services Authorities Act, 1987, let banks and borrowers settle disputes by agreement. Settlement is voluntary. If you agree, the award is treated as a civil-court decree, is final and cannot be appealed — so agree only to terms you can meet.
- **Outline:** Mirror the Hindi draft (H4) · How to verify a Lok Adalat notice (DLSA / NALSA calendar) · Delhi angle: DLSA contacts — **verify on official DLSA sites before publishing** · FAQs
- **Sources:** Legal Services Authorities Act, 1987 (s.21); nalsa.gov.in; Delhi State Legal Services Authority site
- **Internal links:** ↔ `/hi/lok-adalat-loan-settlement.html` (hreflang pair), `/cheque-bounce-section-138.html`, `/legal-notice-reply.html`

### 7. Credit card bill not paid: what happens
- **SEO title:** Credit Card Bill Not Paid? What Happens Next | Loan Free
- **H1:** What Happens If You Don't Pay Your Credit Card Bill in India
- **Keywords:** what happens if i don't pay credit card bill; credit card overdue; credit card ka bill nahi bhara to kya hoga
- **Direct answer:** Late fees and interest are added, missed payments are reported to credit bureaus, and the issuer starts recovery calls; later it may send legal notices or settle. Talk to the issuer early about EMI conversion or a repayment plan — you usually have more options before the account is long overdue.
- **Outline:** Timeline table (reuse Hindi EMI structure) · Interest on carried balance · Minimum due trap (`minimum-due-cycle.svg`) · Options · Recovery rights · Is it a crime? (civil, unless cheque/fraud) · FAQs
- **Sources:** RBI credit card directions — **verify the current Master Direction on credit cards before citing any specific rule** (e.g. billing, closure, reporting)
- **Internal links:** → `/credit-card-debt-settlement.html`, `/blog/credit-card-debt-cycle-how-to-break-free.html`, `/recovery-agent-harassment-protection.html`

### 8. Loan settlement fees
- **Blocked on your fee model (D5).** Outline ready: what consultancies typically charge for (assessment, documentation, negotiation support), fee structures and their risks (large upfront fees, % of "savings"), questions to ask, our own fees (from you), red flags. Never compare named competitors' fees without verified sources.
- **SEO title:** Loan Settlement Fees in India: What to Expect | Loan Free

### 9. How to choose a loan settlement company
- **SEO title:** How to Choose a Loan Settlement Company in India | Loan Free
- **H1:** How to Choose a Loan Settlement Company: A Checklist
- **Keywords:** best loan settlement company in india; do debt settlement companies really work; loan settlement scam
- **Direct answer:** Choose a company that explains your options honestly (including when settlement is wrong), gives fees in writing, never takes the settlement money itself, never promises a fixed waiver or "RBI approval", and lets you deal with the lender directly. No company is licensed by the RBI to settle loans.
- **Outline:** Checklist (10 questions) · Red flags (guarantees, upfront lump sums, asking you to stop paying, asking for OTPs, fake RBI logos) · What a consultancy can and cannot do · Doing it yourself · FAQs
- **Internal links:** → `/about.html`, `/process.html`, `/services.html#fees`, item 8

### 10. Several loans and EMIs
- **SEO title:** Can't Manage Multiple Loans? Your Options | Loan Free
- **H1:** Struggling With Several Loans and EMIs? Options That Actually Work
- **Keywords:** help with multiple overdue loans; debt management plan india; debt consolidation vs debt settlement
- **Direct answer:** List every loan with its EMI, rate and overdue amount, then decide loan by loan: keep paying the most important ones, ask for restructuring where you can still pay something, consider consolidation only if your credit is still good, and settlement only in genuine hardship with a lump sum.
- **Outline:** Make the list (template) · Prioritise (secured loans, cheque-backed loans, highest rates) · Talk to lenders early · Options table (reuse comparison) · Avoid app loans to repay loans · Worked example (illustrative, round numbers, no promised outcome) · FAQs
- **Internal links:** → `/loan-settlement-vs-restructuring.html`, `/blog/debt-consolidation-vs-debt-settlement-india.html`, `/blog/what-to-do-when-you-cannot-pay-emi.html`
