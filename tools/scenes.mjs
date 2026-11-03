#!/usr/bin/env node
// Original scene illustrations (Phase 3): homepage hero, "How we help" scenes, service
// illustrations and the calculator illustration. Flat editorial style in the brand palette,
// built from one shared vocabulary of objects so every image matches. No people, no logos,
// no readable personal data, no official seals.
// Run: node tools/scenes.mjs [name...]   -> assets/illustrations/<name>.svg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/illustrations');
import { C, FONT, esc, defs, R, T, lines, tick, tickDot, paper, laptop, calculator, phone, mug, plant, folder, binder, envelope, building, card, iconCircle, shield, bars, blob, dashPath, flag, rupeeCircle, svg } from './svg-kit.mjs';

// ---------------------------------------------------------------- compositions
const S = {};

// Workspace scene (About page visual; sits on a navy background)
S['hero-clarity'] = () => svg(640, 560, 'A calm workspace for reviewing loan options',
  'Illustration: a laptop showing a simple plan, documents, a calculator and a plant on a desk, with cards for repayment, restructuring and settlement options and a dashed path leading to a gold flag.',
  blob(470, 150, 170, 'url(#gGlow)') + blob(140, 430, 140, 'url(#gGlow)', .7) +
  dashPath('M40 520 C150 470 160 380 260 360 S430 300 470 210 S540 110 590 92', C.gold, 3.5) + flag(590, 96) +
  // desk
  `<path d="M60 428 H600 L622 470 H38 Z" fill="url(#gDesk)"/>${R(38, 470, 584, 14, C.woodD, 4)}` +
  laptop(210, 238, 250, `${R(16, 16, 120, 9, C.navy, 4)}${R(16, 34, 80, 6, C.line, 3)}
    ${R(16, 58, 202, 32, C.greenXL, 8)}${tickDot(34, 74, 9)}${R(52, 70, 110, 7, C.green, 3.5)}
    ${R(16, 98, 202, 32, C.bg, 8)}${R(26, 108, 160, 6, C.line, 3)}${R(26, 118, 100, 6, C.line, 3)}`) +
  paper(78, 352, 112, 74, { n: 3, rot: -8 }) + paper(100, 340, 112, 80, { n: 4, rot: 4, accent: C.green }) +
  calculator(482, 334, .78) + mug(560, 392) + plant(500, 270, .95) +
  // floating cards
  card(36, 92, 214, 150, `${T(18, 30, 'Your options', 15, C.navy, 700)}
    ${tickDot(30, 58, 10)}${T(48, 63, 'Repayment plan', 13, C.ink, 500)}
    ${tickDot(30, 90, 10)}${T(48, 95, 'Restructuring', 13, C.ink, 500)}
    ${tickDot(30, 122, 10, C.goldXL, C.goldD)}${T(48, 127, 'Settlement', 13, C.ink, 500)}`) +
  card(404, 470 - 84 - 300, 196, 70, `${iconCircle(34, 35, 20, C.greenXL, shield(34, 37, .9))}${T(62, 31, 'Confidential', 14, C.navy, 700)}${T(62, 50, 'consultation', 12.5, '#556070', 500)}`)
);

// Service illustrations (4:3, compact)
const svc = (name, title, desc, body) => { S[name] = () => svg(480, 360, title, desc, R(0, 0, 480, 360, 'transparent', 0) + body); };
svc('svc-personal-loan', 'Personal loan settlement', 'Illustration: a loan statement, a written settlement request and a calculator, with a tick confirming the paperwork is in order.',
  blob(360, 90, 100, C.greenXL) + blob(110, 290, 90, C.goldXL) + paper(70, 70, 150, 200, { n: 8, accent: C.navy3, rot: -5 }) +
  paper(190, 100, 150, 190, { n: 7, accent: C.green, rot: 4 }) + calculator(340, 170, .9) + `<g filter="url(#sh2)">${iconCircle(320, 96, 30, C.green, tick(305, 97, 1.5, '#fff'))}</g>`);
svc('svc-credit-card', 'Credit card dues', 'Illustration: two payment cards beside a statement with a downward-trending balance chart.',
  blob(120, 90, 100, C.greenXL) + blob(380, 280, 90, C.goldXL) +
  `<g filter="url(#sh)" transform="rotate(-10 180 170)">${R(70, 110, 220, 136, 'url(#gNavy)', 16)}${R(96, 150, 40, 30, C.gold, 6)}${R(96, 206, 150, 9, C.navy3, 4.5)}</g>` +
  `<g filter="url(#sh)" transform="rotate(6 250 200)">${R(150, 140, 220, 136, 'url(#gGreen)', 16)}${R(176, 180, 40, 30, C.goldL, 6)}${R(176, 236, 150, 9, '#127060', 4.5)}</g>` +
  card(300, 40, 150, 110, `${T(14, 26, 'Balance', 13, C.navy, 700)}<path d="M16 48 L50 56 L84 66 L118 84" fill="none" stroke="${C.green}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>${R(14, 92, 90, 6, C.line, 3)}`));
svc('svc-multiple-emis', 'Several EMIs', 'Illustration: a calendar with several due dates marked and stacked statement cards being sorted into a single plan.',
  blob(360, 100, 100, C.greenXL) + blob(100, 270, 90, C.goldXL) +
  card(60, 60, 200, 210, `${R(0, 0, 200, 44, C.navy2, 14)}${R(0, 30, 200, 14, C.navy2, 0)}${T(18, 28, 'Due dates', 14, '#fff', 700)}
    ${Array.from({ length: 15 }, (_, i) => { const cx = 28 + (i % 5) * 36, cy = 72 + Math.floor(i / 5) * 46; const due = [1, 7, 11].includes(i); return due ? `<circle cx="${cx}" cy="${cy}" r="13" fill="${C.goldL}"/>${T(cx, cy + 4, String(i + 3), 11, C.goldD, 700, 'middle')}` : T(cx, cy + 4, String(i + 3), 11, '#8795A3', 500, 'middle'); }).join('')}`) +
  [0, 1, 2].map((i) => `<g filter="url(#sh2)">${R(290 + i * 10, 120 + i * 34, 130, 50, C.paper, 10)}${R(304 + i * 10, 136 + i * 34, 60, 7, i === 2 ? C.green : C.line, 3.5)}${R(304 + i * 10, 150 + i * 34, 90, 6, C.line2, 3)}</g>`).join('') +
  dashPath('M360 280 C360 300 360 310 360 318', C.green, 3) + `<circle cx="360" cy="322" r="6" fill="${C.green}"/>`);
svc('svc-recovery-rules', 'Recovery-agent guidance', 'Illustration: a shield with a tick, a phone showing permitted calling hours and a clock reading eight to seven.',
  blob(120, 100, 100, C.greenXL) + blob(370, 280, 90, C.goldXL) +
  `<g filter="url(#sh)">${shield(150, 170, 4.2, 'url(#gGreen)')}</g>` +
  phone(268, 70, 1.25, `${T(27, 36, '8:00–19:00', 9.5, C.navy, 700, 'middle')}${R(8, 56, 52, 6, C.line, 3)}${R(8, 68, 40, 6, C.line, 3)}${tickDot(34, 102, 11)}`) +
  `<g filter="url(#sh2)"><circle cx="395" cy="250" r="44" fill="${C.paper}"/></g><circle cx="395" cy="250" r="36" fill="none" stroke="${C.navy}" stroke-width="4"/>
   <path d="M395 250 V226 M395 250 L412 260" stroke="${C.gold}" stroke-width="5" stroke-linecap="round"/>`);
svc('svc-legal-notice', 'Legal notice documentation', 'Illustration: a notice in an opened envelope, a reply letter with a pen and a calendar mark for the deadline.',
  blob(360, 90, 100, C.greenXL) + blob(110, 290, 90, C.goldXL) +
  envelope(60, 170, 170, 110) + paper(84, 70, 130, 150, { n: 6, accent: C.red, fold: false }) +
  paper(250, 90, 150, 200, { n: 8, accent: C.green, rot: 3 }) +
  `<g transform="rotate(35 350 260)" filter="url(#sh2)">${R(300, 254, 110, 12, C.navy, 6)}<path d="M410 254 l16 6 l-16 6 Z" fill="${C.gold}"/></g>` +
  card(380, 40, 80, 80, `${R(0, 0, 80, 22, C.red, 14)}${R(0, 12, 80, 10, C.red, 0)}${T(40, 58, '15', 26, C.navy, 700, 'middle')}`));
svc('svc-msme', 'Business and MSME credit', 'Illustration: a small shopfront, a cash-flow chart and a revised repayment schedule.',
  blob(120, 90, 100, C.greenXL) + blob(380, 280, 90, C.goldXL) +
  `<g filter="url(#sh)">${R(50, 130, 190, 160, C.paper, 12)}<path d="M40 136 H250 L236 96 H54 Z" fill="${C.green}"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${54 + i * 38} 136 h38 v14 a19 19 0 0 1 -38 0 Z" fill="${i % 2 ? '#fff' : C.goldL}"/>`).join('')}
   ${R(74, 186, 60, 104, C.navy2, 6)}${R(152, 186, 70, 50, C.greenXL, 6)}</g>` +
  card(270, 60, 180, 130, `${T(16, 28, 'Cash flow', 13, C.navy, 700)}${bars(18, 44, [.5, .35, .6, .45, .75, .85], 16, 10, 60)}`) +
  card(270, 210, 180, 90, `${T(16, 28, 'Revised plan', 13, C.navy, 700)}${lines(16, 44, 140, 3, 12)}`));
svc('svc-credit-report', 'Credit report guidance', 'Illustration: a credit report with three status labels — Closed, Settled and Written-off — and a magnifying glass checking an entry.',
  blob(360, 90, 100, C.greenXL) + blob(110, 290, 90, C.goldXL) +
  card(80, 50, 240, 260, `${T(20, 32, 'Credit report', 15, C.navy, 700)}${R(20, 46, 200, 1.5, C.line2, 1)}
    ${[['Closed', C.green, C.greenXL], ['Settled', C.goldD, C.goldXL], ['Written-off', C.red, '#FBECE8']].map(([l, f, b], i) => `${R(20, 66 + i * 58, 200, 44, '#F8FAFC', 10)}${R(30, 77 + i * 58, 70, 7, C.line, 3.5)}${R(30, 90 + i * 58, 46, 6, C.line2, 3)}${R(130, 76 + i * 58, 80, 24, b, 12)}${T(170, 92 + i * 58, l, 11, f, 700, 'middle')}`).join('')}`) +
  `<g filter="url(#sh2)"><circle cx="350" cy="200" r="46" fill="#fff" fill-opacity=".55" stroke="${C.navy}" stroke-width="9"/><path d="M383 233 L428 278" stroke="${C.navy}" stroke-width="14" stroke-linecap="round"/></g>`);
svc('svc-closure', 'Loan closure documentation', 'Illustration: a no-dues letter with a tick, a payment receipt and a folder for keeping closure papers safe.',
  blob(120, 90, 100, C.greenXL) + blob(380, 280, 90, C.goldXL) + folder(250, 150, 190, 150) +
  paper(80, 60, 160, 210, { n: 8, accent: C.green }) + paper(270, 70, 120, 120, { n: 4, accent: C.gold, rot: 6 }) +
  `<g filter="url(#sh2)">${iconCircle(212, 236, 30, C.green, tick(197, 237, 1.5, '#fff'))}</g>`);

// Calculator illustration: one input (total outstanding, with loan-type tags) leading to two SEPARATE
// cards — the illustrative settlement scenario and the professional fee. The example figures are
// computed from src/js/calculator.js CONFIG so the picture always matches the calculator.
const CALC = createRequire(import.meta.url)('../src/js/calculator.js');
S['calculator-planning'] = () => {
  const ex = CALC.calculate(1000000, []).results;
  const pct = ex.settlement.percentLabel, rate = ex.fee.percentLabel;
  const pill = (x, y, w, label, fill, color) => `${R(x, y, w, 24, fill, 12)}${T(x + w / 2, y + 17, label, 13, color, 700, 'middle')}`;
  const tag = (x, y, w, label) => `${R(x, y, w, 22, C.greenXL, 11)}${T(x + w / 2, y + 15, label, 11, C.green, 700, 'middle')}`;
  return svg(560, 420, 'An illustrative settlement scenario and our professional fee, shown separately',
    `Illustration: a total outstanding amount of ${CALC.formatINR(ex.outstanding)} with loan-type tags leads to two separate cards — an illustrative settlement scenario at ${pct} and the professional fee at ${rate} — beside a calculator. The figures are examples, not offers or guarantees.`,
    blob(450, 96, 112, C.greenXL) + blob(110, 340, 104, C.goldXL) +
    card(28, 34, 300, 136, `${T(20, 30, 'Total outstanding', 13, '#556070', 600)}
      ${R(20, 42, 260, 44, C.bg, 10, `stroke="${C.line}" stroke-width="1.5"`)}${T(36, 71, '₹', 18, C.navy, 700)}${T(56, 72, CALC.formatINR(ex.outstanding).replace('₹', ''), 20, C.navy, 700)}
      ${tag(20, 98, 84, 'Credit card')}${tag(110, 98, 70, 'Personal')}${tag(186, 98, 48, 'Other')}`) +
    calculator(392, 40, 1.05) +
    dashPath('M120 176 C120 200 118 212 118 226', C.goldD) + dashPath('M250 176 C300 200 360 214 386 236', C.green) +
    card(28, 232, 228, 156, `${R(14, 0, 200, 5, C.gold, 2.5)}${T(18, 34, 'Illustrative scenario', 14, C.navy, 700)}${pill(18, 48, 52, pct, C.gold, C.navy)}
      ${T(18, 106, CALC.formatINR(ex.settlement.amount), 26, C.navy, 700)}${lines(18, 124, 180, 2, 11, C.line, .55)}`) +
    card(276, 244, 256, 156, `${R(14, 0, 228, 5, C.green, 2.5)}${T(18, 34, 'Professional fee', 14, C.navy, 700)}${pill(18, 48, 46, rate, C.green, '#fff')}
      ${T(18, 106, CALC.formatINR(ex.fee.amount), 26, C.green, 700)}
      ${R(18, 122, 220, 9, C.green, 4.5)}${R(18, 136, 220, 6, C.line, 3)}${R(18, 146, 220, 6, C.line, 3)}`)
  );
};

// Homepage "What we do / what we don't" illustration
const crossDot = (cx, cy, r = 11, bg = '#FBECE8', fg = C.red) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"/><path d="M${cx - r * .38} ${cy - r * .38} L${cx + r * .38} ${cy + r * .38} M${cx + r * .38} ${cy - r * .38} L${cx - r * .38} ${cy + r * .38}" stroke="${fg}" stroke-width="${2.6 * r / 11}" stroke-linecap="round"/>`;
S['honest-role'] = () => svg(560, 420, 'Our role, clearly defined',
  'Illustration: a card listing what we do — consultation, options, documents — with green ticks, a card listing what we do not do — lending, guarantees, encouraging default — with crosses, and a shield between them.',
  blob(130, 140, 120, C.greenXL) + blob(440, 300, 110, C.goldXL) +
  card(30, 96, 230, 250, `${R(0, 0, 230, 48, C.green, 14)}${R(0, 34, 230, 14, C.green, 0)}${T(20, 31, 'What we do', 16, '#fff', 700)}
    ${['Consultation', 'Your options', 'Documents', 'Lender contact'].map((l, i) => `${tickDot(32, 84 + i * 50, 12)}${T(54, 89 + i * 50, l, 14, C.ink, 600)}`).join('')}`) +
  card(300, 126, 230, 250, `${R(0, 0, 230, 48, C.navy2, 14)}${R(0, 34, 230, 14, C.navy2, 0)}${T(20, 31, 'What we don’t', 16, '#fff', 700)}
    ${['Lend money', 'Guarantee results', 'Promise a waiver', 'Advise default'].map((l, i) => `${crossDot(32, 84 + i * 50, 12)}${T(54, 89 + i * 50, l, 14, C.ink, 600)}`).join('')}`) +
  `<g filter="url(#sh)"><circle cx="280" cy="88" r="40" fill="${C.paper}"/></g>${shield(280, 92, 1.9, 'url(#gGreen)')}`
);

// Homepage FAQ illustration
S['faq-questions'] = () => svg(560, 420, 'Questions answered in plain language',
  'Illustration: question bubbles about settlement and recovery calls, answered by a reply bubble with a tick, beside a phone and an open guide.',
  blob(150, 120, 130, C.greenXL) + blob(430, 320, 110, C.goldXL) +
  `<g filter="url(#sh)">${R(40, 60, 250, 86, C.paper, 18)}<path d="M80 146 l-6 26 l30 -26 Z" fill="${C.paper}"/></g>${iconCircle(84, 103, 24, C.goldXL, T(84, 112, '?', 26, C.goldD, 700, 'middle'))}${R(122, 88, 140, 9, C.navy3, 4.5)}${R(122, 106, 100, 8, C.line, 4)}` +
  `<g filter="url(#sh)">${R(150, 180, 250, 86, C.paper, 18)}<path d="M360 266 l6 26 l-30 -26 Z" fill="${C.paper}"/></g>${iconCircle(194, 223, 24, C.goldXL, T(194, 232, '?', 26, C.goldD, 700, 'middle'))}${R(232, 208, 140, 9, C.navy3, 4.5)}${R(232, 226, 110, 8, C.line, 4)}` +
  `<g filter="url(#sh)">${R(60, 300, 290, 96, 'url(#gNavy)', 18)}</g>${iconCircle(104, 348, 22, C.green, tick(94, 349, 1.2, '#fff'))}${R(140, 330, 170, 8, '#C9D6E3', 4)}${R(140, 346, 150, 8, '#8FA6BC', 4)}${R(140, 362, 110, 8, '#8FA6BC', 4)}` +
  phone(420, 90, 1.3, `${R(8, 20, 52, 18, C.greenXL, 6)}${R(8, 46, 40, 6, C.line, 3)}${R(8, 58, 48, 6, C.line, 3)}${tickDot(34, 96, 11)}`)
);

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
let n = 0;
for (const [name, make] of Object.entries(S)) {
  if (only.length && !only.includes(name)) continue;
  fs.writeFileSync(path.join(OUT, name + '.svg'), make()); n++;
}
console.log(`Wrote ${n} scene illustrations to assets/illustrations/`);
