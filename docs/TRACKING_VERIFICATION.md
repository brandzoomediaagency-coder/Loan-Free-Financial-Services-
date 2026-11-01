# Analytics and conversion tracking: set-up and verification

## What is installed

| Item | Detail |
|---|---|
| GA4 | Measurement ID `G-QF7NBLW9G0` (kept from the existing site — confirm it is the right property in GA4 > Admin > Data streams). Loaded with Google Consent Mode v2; all storage `denied` until the visitor clicks "Accept all". |
| Meta Pixel | ID `1010576377287782` (existing). Loads only after "Accept all", and only on `/`, `/about.html`, `/contact.html`, `/services.html`, `/process.html`, `/faq.html` (see `SITE.analytics.metaPixelPages`). `autoConfig` is off. |
| Google Tag Manager | Not used. The previous site did not have a GTM container, and gtag.js covers the events below. If you want GTM later, provide the container ID; the events below are already pushed to `dataLayer` by gtag. |
| Consent | Banner with "Essential only" / "Accept all"; choice stored in `localStorage` (`lf_consent`); "Cookie settings" link in every footer reopens it. |

### Why the Meta Pixel is limited

Meta receives the full page URL with every event. Most URLs on this site describe a debt problem (for example `/recovery-agent-harassment-protection.html`). Your brief asked us not to send debt-distress information to Meta through parameters, event names or URL paths, so the pixel runs only on neutral pages. This means Meta will not see conversions that happen on service pages. If you want broader Meta measurement, the privacy-safer option is Meta's Conversions API sending only an event name and a hashed, consented identifier — discuss with your adviser first.

## Events

| Event (GA4) | Fired when | Parameters | Meta event |
|---|---|---|---|
| `whatsapp_click` | Any `wa.me` link is clicked | `link_location` (e.g. `hero`, `sticky_bar`, `cta_band`, `form_result`) | `Contact` (neutral pages only) |
| `phone_call_click` | Any `tel:` link is clicked | `link_location` | `Contact` (neutral pages only) |
| `consult_open` | The consultation dialog is opened | `trigger` (e.g. `button`, `exit_intent`) | — |
| `form_start` | First interaction with a form field | `form_id` | — |
| `form_submit` | A consultation form is submitted and the server has answered | `form_id`, `lead_saved` (`yes`/`no`) | — |
| `contact_enquiry` | The lead was saved (`/api/lead` returned ok) | `form_id` | `Lead` (neutral pages only) |

No names, phone numbers, cities, topics, amounts or messages are sent to GA4 or Meta.

## GA4 settings to change (needs GA4 admin access)

1. Admin > Data streams > Web > Enhanced measurement > **Form interactions: off** (our own events replace it and avoid double counting).
2. Admin > Events: after the events first appear, mark `contact_enquiry` as a **key event**. Optionally also `whatsapp_click` and `phone_call_click`.
3. Admin > Custom definitions: create event-scoped dimensions `link_location`, `form_id`, `lead_saved`, `trigger`.
4. Admin > Data retention: choose the shortest period that meets your reporting needs.
5. Admin > Data collection: leave Google signals off unless you have reviewed it with your adviser.

## How to verify after deployment

1. Open the site in a private window. The consent banner should appear. Open DevTools > Network and filter `collect`: GA4 requests should carry `gcs=G100` (denied) and no `_ga` cookie should be set.
2. Click "Accept all". `_ga` cookies appear; requests now carry `gcs=G111`. On the homepage, `fbevents.js` loads; on `/personal-loan-settlement.html` it must **not** load.
3. Use Google Tag Assistant (tagassistant.google.com) with GA4 > Admin > DebugView, then click a WhatsApp button and a phone link: `whatsapp_click` and `phone_call_click` appear with `link_location`.
4. Submit a test enquiry on a preview with the webhook configured: `form_submit` (`lead_saved: yes`) and `contact_enquiry` appear; the record appears in your enquiry store with the same reference.
5. Meta Events Manager > Test events: on the Contact page, a test enquiry shows `Lead`; check that no custom parameters are attached.
6. Click "Cookie settings" in the footer, choose "Essential only", reload: Meta should not load and GA4 returns to denied.
