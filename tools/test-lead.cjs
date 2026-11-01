#!/usr/bin/env node
// Usage: node tools/test-lead.cjs   (no network; spins up a local HMAC-verifying receiver)
// End-to-end test: api/lead.js -> mock receiver that verifies HMAC exactly like lead-receiver.gs
const http = require('node:http'), crypto = require('node:crypto');
const SECRET = 'test-secret-' + crypto.randomBytes(8).toString('hex');
const received = [];
const srv = http.createServer((req, res) => {
  let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
    const body = JSON.parse(b);
    const exp = crypto.createHmac('sha256', SECRET).update(body.payload).digest('hex');
    const hdr = req.headers['x-lf-signature'];
    const ok = exp === body.sig && hdr === 'sha256=' + exp;
    if (ok) received.push(JSON.parse(body.payload));
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(ok ? { ok: true } : { ok: false, error: 'bad_signature' }));
  });
}).listen(0, async () => {
  process.env.LEAD_WEBHOOK_URL = 'http://127.0.0.1:' + srv.address().port + '/';
  process.env.LEAD_WEBHOOK_SECRET = SECRET;
  const handler = require(require('node:path').join(__dirname, '..', 'api', 'lead.js'));
  const call = (body, headers = {}) => new Promise((resolve) => {
    const req = { method: 'POST', headers: { origin: 'https://www.loanfree.info', 'x-forwarded-for': '10.0.0.' + Math.floor(Math.random() * 200), ...headers }, body, socket: {} };
    const res = { statusCode: 200, headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(c) { this.statusCode = c; return this; }, json(o) { resolve({ status: this.statusCode, body: o }); }, end() { resolve({ status: this.statusCode }); } };
    handler(req, res);
  });
  const good = { name: 'Test User', phone: '9876543210', city: '=HYPERLINK("x")', topic: 'Personal loan', amount: '₹1–5 lakh', contact: 'WhatsApp', message: 'Acct 123456789012 <script>', consent: 'yes', page: '/contact.html', lang: 'en', formId: 'contact-form', elapsedMs: 9000 };
  const r1 = await call(good);
  console.log('valid lead ->', r1.status, JSON.stringify(r1.body));
  console.log('stored lead ->', JSON.stringify(received[0] && received[0].lead));
  console.log('honeypot ->', (await call({ ...good, company: 'x' })).status, 'forwarded:', received.length);
  console.log('too fast ->', (await call({ ...good, elapsedMs: 500 })).status, 'forwarded:', received.length);
  console.log('no consent ->', JSON.stringify((await call({ ...good, consent: '' })).body));
  console.log('bad phone ->', JSON.stringify((await call({ ...good, phone: '12345' })).body));
  console.log('bad origin ->', (await call(good, { origin: 'https://evil.example' })).status);
  process.env.LEAD_WEBHOOK_SECRET = 'wrong';
  console.log('receiver rejects wrong secret ->', JSON.stringify((await call(good)).body));
  srv.close();
});
