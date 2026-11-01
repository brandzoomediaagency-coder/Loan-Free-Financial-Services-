# Lead capture: how enquiries are saved

## Flow

1. A visitor fills in a form (Contact page, homepage, or the "Free Consultation" dialog on every page).
2. The browser validates the fields and requires the consent checkbox.
3. The form is POSTed over HTTPS to `/api/lead` (Vercel serverless function, `api/lead.js`).
4. The function checks the origin, rate-limits by IP (5 per 10 minutes per warm instance), drops spam silently (hidden honeypot field, or submitted in under 2.5 s), validates every field against allow-lists, and cleans text (removes control characters, `<` `>`, leading `= + - @`, and any 9–18 digit number in the message).
5. It forwards the cleaned lead to `LEAD_WEBHOOK_URL`, signed with HMAC-SHA256 using `LEAD_WEBHOOK_SECRET`.
6. The visitor sees a confirmation with a reference number (e.g. `LF-3F9A1C`) and a button to continue on WhatsApp with a pre-filled, non-sensitive message.
7. If saving is not configured or fails, the visitor is told and offered WhatsApp/phone instead. Nothing is lost silently.

No API keys or secrets are in browser code. Lead contents are never sent to Google Analytics or Meta.

## Environment variables (Vercel > Project > Settings > Environment Variables)

| Variable | Required | Value |
|---|---|---|
| `LEAD_WEBHOOK_URL` | Yes | The receiver URL (your CRM's webhook, or the Apps Script web-app URL) |
| `LEAD_WEBHOOK_SECRET` | Yes | A long random secret, e.g. `openssl rand -hex 32`. The same value goes into the receiver. |
| `LEAD_ALLOWED_ORIGINS` | No | Comma-separated origins. Default: `https://www.loanfree.info,https://loanfree.info`. Add the preview URL only for testing. |

Until both required variables are set, `/api/lead` returns `503 not_configured` and the form offers WhatsApp instead.

## Delivery format

`POST` with `Content-Type: application/json` and header `X-LF-Signature: sha256=<hex>`:

```json
{ "payload": "{\"ref\":\"LF-3F9A1C\",\"receivedAt\":\"2026-11-01T10:00:00.000Z\",\"lead\":{...}}", "sig": "<hex>" }
```

`sig` = HMAC-SHA256 of the exact `payload` string with the shared secret. The receiver must verify it, reject deliveries older than a few minutes, and ignore duplicate `ref`s. The receiver should reply `{"ok":true}`; anything else is treated as a failure.

`lead` fields: `name`, `phone` (`+91XXXXXXXXXX`), `city`, `topic`, `amount` (range or empty), `contact`, `message`, `page`, `lang`, `formId`, `consent` (`true`).

## Choosing where enquiries go — decision needed

You asked to be consulted before an external CRM is connected, so none is connected. Options:

| Option | Notes |
|---|---|
| **Private Google Sheet via Apps Script** | Free, quick. Use `docs/lead-receiver.gs` (verifies the signature, blocks replays and duplicates, stores values as text). Sheet must stay private. |
| **A CRM with an inbound webhook** (e.g. Zoho CRM, HubSpot, LeadSquared) | Better for follow-up and reminders. Needs a small adapter if the CRM cannot verify an HMAC signature; tell us which CRM and we will write it. |
| **Email notification** via a transactional email service | Simple, but harder to track follow-ups. Needs an email-service API key in Vercel (server-side only). |

Never point `LEAD_WEBHOOK_URL` at a publicly shared spreadsheet or form.

## Testing

- Locally, without network: `node tools/test-lead.cjs` (valid lead, honeypot, too-fast, consent, phone, origin, wrong secret).
- On a Vercel preview: set the variables for the Preview environment, add the preview origin to `LEAD_ALLOWED_ORIGINS`, submit a test enquiry, and confirm the row/record appears with the same reference number shown on screen. Delete test records afterwards.

## Retention

Decide how long enquiries are kept (e.g. 12 months for non-clients) and delete older rows on that schedule. The privacy policy says you keep enquiry data only as long as needed and delete it on request.
