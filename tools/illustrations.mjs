#!/usr/bin/env node
// Generates the original explanatory SVG illustrations in assets/illustrations/.
// Each is a 1200x675 diagram in the brand palette, drawn from facts stated on the page that uses it.
// Edit the definitions below and run:  node tools/illustrations.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/illustrations');
const C = { navy: '#102a43', navy2: '#1f3b5c', green: '#00875a', greenBg: '#e6f4ee', gold: '#c79a3a', goldBg: '#fbf3e1', red: '#b42318', redBg: '#fdecea', grey: '#52606d', line: '#cbd5e1', bg: '#f7f9fc', white: '#ffffff', purple: '#6d28d9', purpleBg: '#f1eafd' };
const FONT = "Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// Multi-line text: lines is an array; first line can be bold via opts.boldFirst.
function text(x, y, lines, { size = 20, color = C.navy, weight = 400, anchor = 'start', lh = 1.35, boldFirst = false } = {}) {
  return (Array.isArray(lines) ? lines : [lines]).map((l, i) =>
    `<text x="${x}" y="${y + i * size * lh}" font-size="${size}" fill="${color}" font-weight="${boldFirst && i === 0 ? 700 : weight}" text-anchor="${anchor}">${esc(l)}</text>`).join('');
}
const rect = (x, y, w, h, fill, { rx = 16, stroke = 'none', sw = 2 } = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"/>`;
const circle = (cx, cy, r, fill) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>`;
const arrow = (x1, y1, x2, y2, color = C.grey) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="3" marker-end="url(#ah)"/>`;
const tick = (x, y, color = C.green) => `<path d="M${x} ${y + 8} l6 6 l12 -14" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
const cross = (x, y, color = C.red) => `<path d="M${x + 2} ${y} l14 14 M${x + 16} ${y} l-14 14" fill="none" stroke="${color}" stroke-width="3.5" stroke-linecap="round"/>`;

function svg(title, desc, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" width="1200" height="675" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>
<defs><marker id="ah" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${C.grey}"/></marker></defs>
${rect(0, 0, 1200, 675, C.bg, { rx: 0 })}
${body}
</svg>\n`;
}
const heading = (t, sub) => text(60, 78, t, { size: 34, weight: 700 }) + (sub ? text(60, 116, sub, { size: 20, color: C.grey }) : '');

const ILLUSTRATIONS = {
  'how-we-work': () => svg('How Loan Free works with you and your lender',
    'Three columns: you share your situation and decide; Loan Free assesses, prepares the request and checks documents; your lender decides and issues the settlement letter. Settlement money goes directly to the lender.',
    heading('Who does what in a settlement', 'You stay in control. Only your lender can agree terms.') +
    [['You', C.navy, [['Share your loans, income', 'and documents'], ['Decide whether to', 'go ahead'], ['Pay the lender directly']]],
     ['Loan Free', C.green, [['Assess your options'], ['Prepare a written request'], ['Check offers and letters'], ['Guide you on the NOC', 'and credit report']]],
     ['Your lender', C.gold, [['Reviews your request', 'under its own policy'], ['Accepts, counters', 'or declines'], ['Issues the settlement', 'letter']]]]
      .map(([name, col, items], i) => {
        const x = 60 + i * 380;
        return rect(x, 170, 320, 400, C.white, { stroke: C.line }) + rect(x, 170, 320, 70, col, { rx: 16 }) + rect(x, 210, 320, 30, col, { rx: 0 }) +
          text(x + 160, 216, name, { size: 26, weight: 700, color: C.white, anchor: 'middle' }) +
          items.reduce((acc, lines) => {
            acc.out += circle(x + 34, acc.y - 7, 5, col) + text(x + 50, acc.y, lines, { size: 20, lh: 1.3 });
            acc.y += lines.length * 26 + 22;
            return acc;
          }, { y: 286, out: '' }).out +
          (i < 2 ? arrow(x + 326, 370, x + 374, 370) : '');
      }).join('') +
    rect(60, 600, 1080, 50, C.goldBg, { rx: 12 }) +
    text(600, 632, 'Settlement amounts are always paid to your lender’s official account — never to Loan Free.', { size: 19, anchor: 'middle', weight: 600 })),

  'settlement-timeline': () => svg('The six stages of a typical settlement case',
    'A timeline: 1 free assessment, 2 documents and engagement, 3 strategy, 4 lender communication, 5 written offer checked, 6 payment, NOC and credit report check.',
    heading('Six stages of a typical case', 'Timings depend on your lender and on how quickly documents and funds are ready.') +
    `<line x1="120" y1="270" x2="1080" y2="270" stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>` +
    [['Assessment', ['Free, confidential', 'review of options']], ['Documents', ['Statements, KYC,', 'proof of hardship']], ['Strategy', ['Settlement,', 'restructuring or', 'another route']],
     ['Lender contact', ['Written request', 'to the lender']], ['Written offer', ['Settlement letter', 'checked before', 'you pay']], ['Closure', ['Payment, NOC,', 'credit report', 'check']]]
      .map(([t, d], i) => {
        const x = 120 + i * 192;
        const col = i === 5 ? C.gold : C.green;
        return circle(x, 270, 34, col) + text(x, 281, String(i + 1), { size: 30, weight: 700, color: C.white, anchor: 'middle' }) +
          text(x, 350, t, { size: 21, weight: 700, anchor: 'middle' }) + text(x, 380, d, { size: 17, color: C.grey, anchor: 'middle' });
      }).join('') +
    rect(60, 520, 1080, 80, C.white, { rx: 12, stroke: C.line }) +
    text(600, 553, 'Never pay before you have a written settlement letter. Pay only into the lender’s official account.', { size: 19, anchor: 'middle', weight: 600 }) +
    text(600, 581, 'A settlement paid over more than three months is treated as a restructuring under the RBI framework.', { size: 17, anchor: 'middle', color: C.grey })),

  'settled-vs-closed': () => svg('Closed, Settled and Written-off compared',
    'Three credit report statuses. Closed: loan repaid in full, the best outcome. Settled: lender accepted less than the full amount; negative for future credit. Written-off: lender removed the dues from its books but may still recover; the debt is not forgiven.',
    heading('What your credit report status means', 'How the three most common end statuses are usually read by lenders.') +
    [['Closed', C.green, C.greenBg, 'Best', ['Loan repaid in full', 'as agreed.', '', 'Seen as a positive', 'repayment record.']],
     ['Settled', C.gold, C.goldBg, 'Negative', ['Lender accepted less', 'than the full amount', 'and closed the account.', 'Better than unpaid', 'default; worse than Closed.']],
     ['Written-off', C.red, C.redBg, 'Serious', ['Lender removed the dues', 'from its books.', 'The debt is NOT forgiven;', 'recovery can continue.', '']]]
      .map(([name, col, bg, badge, lines], i) => {
        const x = 60 + i * 370;
        return rect(x, 160, 340, 430, C.white, { stroke: C.line }) + rect(x, 160, 340, 12, col, { rx: 6 }) +
          text(x + 30, 230, name, { size: 32, weight: 700 }) +
          rect(x + 30, 254, 120, 36, bg, { rx: 18 }) + text(x + 90, 279, badge, { size: 17, weight: 700, color: col, anchor: 'middle' }) +
          lines.map((l, j) => text(x + 30, 340 + j * 40, l, { size: 20 })).join('');
      }).join('') +
    text(600, 635, 'Illustrative summary. Each lender and credit bureau applies its own policies.', { size: 17, color: C.grey, anchor: 'middle' })),

  'recovery-rules-2027': () => svg('Recovery agent rules from 1 January 2027',
    'Key changes under the RBI recovery directions of 6 August 2026 for banks and NBFCs, effective 1 January 2027: contact only between 8 a.m. and 7 p.m.; agency details given at least one day before the first visit; agents carry ID, authorisation letter and a copy of that notice; recovery calls logged and recorded; agents discuss the loan only with the borrower or guarantor; compensation policy for non-compliant recovery.',
    heading('Recovery rules for banks and NBFCs from 1 January 2027', 'RBI directions dated 6 August 2026. Always check the official text for your lender type.') +
    [['Contact hours', ['8:00 a.m. to 7:00 p.m.', 'unless you ask otherwise']],
     ['Notice before visits', ['Agency details given at', 'least one day before the', 'first visit']],
     ['Agent must carry', ['Identity card, authorisation', 'letter and a copy of', 'the notice']],
     ['Calls on record', ['Recovery calls logged;', 'recordings kept by', 'the lender']],
     ['Who they may contact', ['Only you or your guarantor', 'about the loan — no', 'harassing family or friends']],
     ['Compensation policy', ['Lenders must have a policy', 'for losses from', 'non-compliant recovery']]]
      .map(([t, d], i) => {
        const x = 60 + (i % 3) * 370, y = 160 + Math.floor(i / 3) * 225;
        return rect(x, y, 340, 200, C.white, { stroke: C.line }) + circle(x + 44, y + 48, 22, C.greenBg) + tick(x + 34, y + 38) +
          text(x + 80, y + 56, t, { size: 22, weight: 700 }) + text(x + 30, y + 110, d, { size: 19, color: C.grey });
      }).join('') +
    text(600, 640, 'Summary for general information only — not legal advice.', { size: 17, color: C.grey, anchor: 'middle' })),

  'complaint-escalation': () => svg('Where to complain about recovery or loan app harassment',
    'An escalation ladder: 1 record everything; 2 complain in writing to the lender’s grievance redressal officer; 3 if there is no reply within 30 days or you are not satisfied, complain to the RBI Ombudsman at cms.rbi.org.in; for threats, extortion or morphed images, go to the police or cybercrime.gov.in at any stage.',
    heading('How to escalate a recovery complaint', 'Start with the lender. Go to the police at any stage if you are threatened.') +
    [['1', 'Record everything', ['Dates, times, numbers, screenshots,', 'call recordings and names']],
     ['2', 'Write to the lender', ['Grievance redressal officer of the', 'bank or NBFC (details on its website)']],
     ['3', 'RBI Ombudsman', ['No reply in 30 days or not satisfied:', 'complain at cms.rbi.org.in']]]
      .map(([n, t, d], i) => {
        const x = 60 + i * 140, y = 470 - i * 130;
        return rect(x, y, 520, 112, C.white, { stroke: C.line }) + circle(x + 50, y + 56, 30, C.green) +
          text(x + 50, y + 66, n, { size: 28, weight: 700, color: C.white, anchor: 'middle' }) +
          text(x + 100, y + 44, t, { size: 23, weight: 700 }) + text(x + 100, y + 78, d, { size: 17, color: C.grey, lh: 1.3 });
      }).join('') +
    rect(890, 150, 250, 432, C.redBg, { stroke: '#f5c2bd' }) +
    text(1015, 198, 'Any stage', { size: 22, weight: 700, color: C.red, anchor: 'middle' }) +
    text(1015, 250, ['Threats, abuse,', 'extortion or', 'morphed photos?', '', 'Police station or', 'cybercrime.gov.in', '(helpline 1930)'], { size: 19, anchor: 'middle', lh: 1.45 }) +
    text(600, 640, 'Keep copies of every complaint and reply. General information, not legal advice.', { size: 17, color: C.grey, anchor: 'middle' })),

  'minimum-due-cycle': () => svg('The credit card minimum-due cycle',
    'A loop: you pay only the minimum due; interest is charged on the unpaid balance; fees and new spending add to it; the next bill is about as high as before, so the cycle repeats.',
    heading('Why paying only the minimum due keeps you in debt', 'Interest is charged on the balance you carry forward, so the total falls very slowly.') +
    `<circle cx="600" cy="390" r="170" fill="none" stroke="${C.line}" stroke-width="6" stroke-dasharray="14 12"/>` +
    [[600, 220, 'You pay the', 'minimum due'], [770, 390, 'Interest on the', 'unpaid balance'], [600, 560, 'Fees and new', 'spending added'], [430, 390, 'Next bill: almost', 'the same balance']]
      .map(([x, y, a, b], i) => rect(x - 120, y - 44, 240, 88, i === 0 ? C.navy : C.white, { stroke: C.line }) +
        text(x, y - 6, a, { size: 20, weight: 700, anchor: 'middle', color: i === 0 ? C.white : C.navy }) +
        text(x, y + 22, b, { size: 20, weight: 700, anchor: 'middle', color: i === 0 ? C.white : C.navy })).join('') +
    rect(60, 250, 230, 210, C.greenBg, { rx: 14 }) + text(80, 290, ['Ways out', '• Pay more than', '   the minimum', '• EMI conversion', '• Repayment plan', '   or settlement'], { size: 18, boldFirst: true, lh: 1.42 }) +
    rect(910, 250, 230, 210, C.goldBg, { rx: 14 }) + text(930, 290, ['Read your', 'statement', 'It shows the', 'interest rate and', 'the total amount', 'you owe'], { size: 18, boldFirst: true, lh: 1.42 })),

  'settlement-documents': () => svg('Documents to collect when you settle a loan',
    'Four documents in order: the written settlement letter before you pay; the payment receipt from the lender’s official account; the no-dues certificate or NOC after payment; and an updated credit report showing the account as closed or settled.',
    heading('Your settlement paperwork, in order', 'Keep copies of every document for at least a few years.') +
    [['Settlement letter', 'Before you pay', ['Amount, deadline and', 'that the account will', 'be closed on payment']],
     ['Payment receipt', 'When you pay', ['Paid only into the', 'lender’s official', 'account']],
     ['NOC / no-dues letter', 'After payment', ['Confirms nothing more', 'is owed on the', 'account']],
     ['Credit report', 'A few weeks later', ['Check the account', 'shows the agreed', 'status and zero dues']]]
      .map(([t, when, d], i) => {
        const x = 60 + i * 275;
        return rect(x, 170, 250, 380, C.white, { stroke: C.line }) +
          `<path d="M${x + 95} ${200} h46 l18 18 v62 h-64z" fill="${C.greenBg}" stroke="${C.green}" stroke-width="2.5"/>` +
          `<path d="M${x + 106} 236 h40 M${x + 106} 250 h40 M${x + 106} 264 h28" stroke="${C.green}" stroke-width="2.5"/>` +
          text(x + 125, 330, t, { size: 21, weight: 700, anchor: 'middle' }) +
          rect(x + 45, 348, 160, 32, C.goldBg, { rx: 16 }) + text(x + 125, 370, when, { size: 16, weight: 700, color: '#8a6516', anchor: 'middle' }) +
          text(x + 125, 420, d, { size: 18, color: C.grey, anchor: 'middle' }) + (i < 3 ? arrow(x + 254, 360, x + 271, 360) : '');
      }).join('') +
    text(600, 610, 'If anything in the letter is unclear, ask the lender to correct it in writing before you pay.', { size: 19, weight: 600, anchor: 'middle' })),

  'settlement-or-restructuring': () => svg('Settlement or restructuring: a simple decision guide',
    'A decision flow. Can you keep paying if the EMI is lower or the tenure longer? If yes, ask about restructuring, which usually harms your credit report less. If no, can you arrange a lump sum or short plan? If yes, a settlement may be possible but will be reported as Settled. If neither, get advice before missing more payments.',
    heading('Settlement or restructuring?', 'A starting point for the conversation — your lender decides what it will offer.') +
    rect(380, 150, 440, 90, C.navy, { rx: 14 }) + text(600, 188, ['Could you keep paying with a', 'lower EMI or longer tenure?'], { size: 20, weight: 700, color: C.white, anchor: 'middle' }) +
    arrow(470, 244, 280, 320) + text(345, 280, 'Yes', { size: 18, weight: 700, color: C.green }) +
    arrow(730, 244, 860, 320) + text(808, 280, 'No', { size: 18, weight: 700, color: C.red }) +
    rect(60, 330, 440, 200, C.greenBg, { rx: 14 }) + text(90, 375, ['Ask about restructuring', 'Smaller EMIs or a longer tenure.', 'Usually less damage to your', 'credit report than a settlement.'], { size: 20, boldFirst: true }) +
    rect(640, 330, 500, 90, C.white, { rx: 14, stroke: C.line }) + text(890, 368, ['Can you arrange a lump sum', 'or a short payment plan?'], { size: 20, weight: 700, anchor: 'middle' }) +
    arrow(780, 424, 740, 470) + arrow(1000, 424, 1040, 470) +
    rect(560, 480, 330, 140, C.goldBg, { rx: 14 }) + text(580, 518, ['Settlement may be possible', 'Reported as “Settled”; the', 'lender must agree.'], { size: 18, boldFirst: true }) +
    rect(910, 480, 230, 140, C.redBg, { rx: 14 }) + text(930, 518, ['Get advice now', 'before missing', 'more payments.'], { size: 18, boldFirst: true })),

  'section-138-timeline': () => svg('Cheque bounce (Section 138) time limits',
    'A timeline under the Negotiable Instruments Act, 1881: the cheque is returned unpaid; the payee has 30 days from learning of the dishonour to send a written demand notice; the drawer has 15 days from receiving the notice to pay; if unpaid, the payee may file a complaint within one month after those 15 days end.',
    heading('Section 138 cheque bounce: the key time limits', 'Negotiable Instruments Act, 1881 — sections 138 and 142.') +
    `<line x1="140" y1="340" x2="1060" y2="340" stroke="${C.line}" stroke-width="6" stroke-linecap="round"/>` +
    [[140, 'Cheque returned', ['Bank returns the', 'cheque unpaid'], C.navy], [450, 'Demand notice', ['Within 30 days of', 'learning of the bounce'], C.green],
     [760, 'Time to pay', ['15 days from', 'receiving the notice'], C.gold], [1060, 'Complaint', ['Within 1 month after', 'the 15 days end'], C.red]]
      .map(([x, t, d, col]) => circle(x, 340, 26, col) + text(x, 260, t, { size: 22, weight: 700, anchor: 'middle' }) + text(x, 400, d, { size: 18, color: C.grey, anchor: 'middle' })).join('') +
    rect(60, 500, 1080, 110, C.white, { rx: 12, stroke: C.line }) +
    text(600, 540, 'Received a notice? Paying within the 15 days, or replying with your side, matters.', { size: 20, weight: 700, anchor: 'middle' }) +
    text(600, 574, 'Speak to an advocate quickly — court proceedings have their own rules. General information only.', { size: 18, color: C.grey, anchor: 'middle' })),
};

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
for (const [name, make] of Object.entries(ILLUSTRATIONS)) {
  if (only.length && !only.includes(name)) continue;
  fs.writeFileSync(path.join(OUT, name + '.svg'), make());
}
console.log(`Wrote ${only.length || Object.keys(ILLUSTRATIONS).length} illustrations to assets/illustrations/`);
