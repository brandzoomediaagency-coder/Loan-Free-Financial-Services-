// POST /api/lead — saves a consultation enquiry before the WhatsApp hand-off.
//
// Runs as a Vercel Node.js serverless function. All credentials stay in
// server-side environment variables (never in browser code):
//
//   LEAD_WEBHOOK_URL     where validated leads are forwarded (e.g. a Google
//                        Apps Script web app writing to a private Sheet, or a
//                        CRM webhook). Required for leads to be saved.
//   LEAD_WEBHOOK_SECRET  shared secret; each delivery is signed with
//                        HMAC-SHA256 so the receiver can reject forgeries.
//   LEAD_ALLOWED_ORIGINS optional comma-separated list of allowed Origin
//                        headers (defaults to the production domains).
//
// See docs/LEAD_CAPTURE.md for set-up and the Apps Script receiver template.
'use strict';

const crypto = require('node:crypto');

const DEFAULT_ORIGINS = ['https://www.loanfree.info', 'https://loanfree.info'];
const TOPICS = ['Personal loan', 'Credit card dues', 'NBFC or app loan', 'Business / MSME loan', 'Recovery agent harassment', 'Loan app harassment', 'Legal notice / Section 138', 'Credit report after settlement', 'Several loans together', 'Something else'];
const AMOUNTS = ['', 'Under ₹1 lakh', '₹1–5 lakh', '₹5–10 lakh', '₹10–25 lakh', 'Over ₹25 lakh', 'Prefer not to say'];
const CONTACTS = ['', 'WhatsApp', 'Phone call'];
const MIN_FILL_MS = 2500; // humans take longer than this to fill the form

// Best-effort in-memory rate limit (per warm instance): 5 submissions / 10 min / IP.
const hits = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > 5;
}

// Strip control characters and markup-significant characters, collapse spaces.
function clean(value, max) {
  return String(value == null ? '' : value)
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/^[=+\-@]+/, '') // block spreadsheet formula injection
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function validate(body) {
  const errors = [];
  const name = clean(body.name, 80);
  const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
  const topic = clean(body.topic, 60);
  const amount = clean(body.amount, 30);
  const contact = clean(body.contact, 20);
  if (name.length < 2) errors.push('name');
  if (!/^[6-9]\d{9}$/.test(phone)) errors.push('phone');
  if (!TOPICS.includes(topic)) errors.push('topic');
  if (!AMOUNTS.includes(amount)) errors.push('amount');
  if (!CONTACTS.includes(contact)) errors.push('contact');
  if (body.consent !== 'yes') errors.push('consent');
  return {
    errors,
    lead: {
      name,
      phone: '+91' + phone,
      city: clean(body.city, 60),
      topic,
      amount,
      contact: contact || 'WhatsApp',
      // Free text is kept short; the form asks people not to share account numbers.
      message: clean(body.message, 600).replace(/\b\d{9,18}\b/g, '[number removed]'),
      page: clean(body.page, 120).replace(/[^\w\-./]/g, ''),
      lang: body.lang === 'hi' ? 'hi' : 'en',
      formId: clean(body.formId, 40),
      consent: true,
    },
  };
}

function reference() {
  return 'LF-' + crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 6);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Robots-Tag', 'noindex');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'method_not_allowed' });
  }

  const allowed = (process.env.LEAD_ALLOWED_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean);
  const origins = allowed.length ? allowed : DEFAULT_ORIGINS;
  const origin = req.headers.origin;
  const isLocal = /^http:\/\/localhost(:\d+)?$/.test(origin || '') && process.env.VERCEL_ENV !== 'production';
  if (origin && !origins.includes(origin) && !isLocal) {
    return res.status(403).json({ ok: false, error: 'origin' });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
  if (rateLimited(ip)) return res.status(429).json({ ok: false, error: 'rate_limited' });

  // Spam traps: hidden honeypot field filled, or submitted implausibly fast.
  // Respond as if successful so bots get no signal, but do not forward.
  if (body.company || Number(body.elapsedMs) < MIN_FILL_MS) {
    return res.status(200).json({ ok: true, ref: reference() });
  }

  const { errors, lead } = validate(body);
  if (errors.length) return res.status(422).json({ ok: false, error: 'invalid', fields: errors });

  const ref = reference();
  const url = process.env.LEAD_WEBHOOK_URL;
  const secret = process.env.LEAD_WEBHOOK_SECRET;
  if (!url || !secret) {
    // Not configured yet: tell the browser so it offers the WhatsApp fallback.
    console.warn('lead not saved: LEAD_WEBHOOK_URL / LEAD_WEBHOOK_SECRET not set');
    return res.status(503).json({ ok: false, error: 'not_configured' });
  }

  const payload = { ref, receivedAt: new Date().toISOString(), lead };
  const json = JSON.stringify(payload);
  const sig = crypto.createHmac('sha256', secret).update(json).digest('hex');
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-LF-Signature': 'sha256=' + sig },
      // The signature is also sent in the body for receivers that cannot read
      // headers (Google Apps Script). It covers the exact `payload` string.
      body: JSON.stringify({ payload: json, sig }),
      signal: ctrl.signal,
      redirect: 'follow',
    });
    clearTimeout(timer);
    const text = await r.text();
    let ok = r.ok;
    try { ok = ok && JSON.parse(text).ok !== false; } catch { /* non-JSON 2xx counts as success */ }
    if (!ok) throw new Error('receiver ' + r.status);
    return res.status(200).json({ ok: true, ref });
  } catch (err) {
    // Never log the lead itself; only the reference and the failure reason.
    console.error('lead delivery failed', ref, err.message);
    return res.status(502).json({ ok: false, error: 'delivery_failed' });
  }
};

module.exports.validate = validate;
