/**
 * Loan Free — secure enquiry receiver for a PRIVATE Google Sheet (template).
 *
 * Use this only if you choose Google Sheets as the enquiry store (see docs/LEAD_CAPTURE.md).
 * The website's /api/lead function signs every delivery with HMAC-SHA256; this script
 * rejects anything that is not signed with the shared secret, is stale, or is a duplicate.
 *
 * Set-up:
 *  1. Create a new Google Sheet owned by the business account. Do NOT share it publicly or
 *     "with anyone with the link". Share only with the people who handle enquiries.
 *  2. Extensions > Apps Script. Paste this file.
 *  3. Project Settings > Script properties: add LEAD_WEBHOOK_SECRET with the same long random
 *     value you set in Vercel (generate with: openssl rand -hex 32).
 *  4. Deploy > New deployment > Web app. Execute as: Me. Who has access: Anyone.
 *     ("Anyone" lets the Vercel function reach it; the signature check keeps others out.)
 *  5. Copy the web-app URL into Vercel as LEAD_WEBHOOK_URL. Redeploy the Vercel project.
 */
var SHEET_NAME = 'Enquiries';
var MAX_AGE_MS = 5 * 60 * 1000; // reject deliveries older than 5 minutes (replay protection)
var COLUMNS = ['Received (UTC)', 'Reference', 'Name', 'Mobile', 'City', 'Topic', 'Amount range',
  'Preferred contact', 'Message', 'Page', 'Language', 'Form', 'Consent', 'Status', 'Notes'];

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var secret = PropertiesService.getScriptProperties().getProperty('LEAD_WEBHOOK_SECRET');
    if (!secret || typeof body.payload !== 'string' || typeof body.sig !== 'string') return reply(false, 'bad_request');

    var expected = toHex(Utilities.computeHmacSha256Signature(body.payload, secret));
    if (!safeEqual(expected, body.sig)) return reply(false, 'bad_signature');

    var data = JSON.parse(body.payload);
    var age = Date.now() - new Date(data.receivedAt).getTime();
    if (!(age >= -60000 && age <= MAX_AGE_MS)) return reply(false, 'stale');

    var lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      var sheet = getSheet();
      var refs = sheet.getRange(2, 2, Math.max(sheet.getLastRow() - 1, 1), 1).getValues();
      for (var i = 0; i < refs.length; i++) if (refs[i][0] === data.ref) return reply(true, 'duplicate');
      var l = data.lead || {};
      sheet.appendRow([data.receivedAt, data.ref, text(l.name), text(l.phone), text(l.city), text(l.topic),
        text(l.amount), text(l.contact), text(l.message), text(l.page), text(l.lang), text(l.formId),
        l.consent === true ? 'Yes' : 'No', 'New', '']);
    } finally {
      lock.releaseLock();
    }
    return reply(true);
  } catch (err) {
    return reply(false, 'error');
  }
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.appendRow(COLUMNS);
  return sheet;
}

// Store values as plain text so nothing can be interpreted as a formula.
function text(v) {
  var s = String(v == null ? '' : v);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

function toHex(bytes) {
  return bytes.map(function (b) { return ('0' + (b & 0xff).toString(16)).slice(-2); }).join('');
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  var diff = 0;
  for (var i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function reply(ok, error) {
  return ContentService.createTextOutput(JSON.stringify(ok ? { ok: true } : { ok: false, error: error }))
    .setMimeType(ContentService.MimeType.JSON);
}
