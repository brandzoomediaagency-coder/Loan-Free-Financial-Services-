#!/usr/bin/env node
// Original scene illustrations (Phase 3): homepage hero, "How we help" scenes, service
// illustrations and the calculator illustration. Flat editorial style in the brand palette,
// built from one shared vocabulary of objects so every image matches. No people, no logos,
// no readable personal data, no official seals.
// Run: node tools/scenes.mjs [name...]   -> assets/illustrations/<name>.svg
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/illustrations');
const C = {
  navy: '#0B2035', navy2: '#15334B', navy3: '#1F4566', navy4: '#2C5A80', ink: '#1F2937',
  green: '#167B68', green2: '#1F9A82', greenL: '#CDE9E1', greenXL: '#E9F4F1',
  gold: '#D6AE58', goldD: '#B58B33', goldL: '#F4E6C3', goldXL: '#FBF5E7',
  paper: '#FFFFFF', line: '#D9E1EA', line2: '#E8EDF3', bg: '#F2F5F9', bg2: '#EEF2F6',
  wood: '#E8D9C0', woodD: '#D9C5A3', leaf: '#2F8F6B', leaf2: '#3FA77E', pot: '#C9A27A', red: '#C2553F',
};
const FONT = "Inter, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

const defs = `<defs>
<filter id="sh" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="6" stdDeviation="8" flood-color="#0B2035" flood-opacity=".16"/></filter>
<filter id="sh2" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="#0B2035" flood-opacity=".14"/></filter>
<linearGradient id="gNavy" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F4566"/><stop offset="1" stop-color="#0B2035"/></linearGradient>
<linearGradient id="gGreen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1F9A82"/><stop offset="1" stop-color="#127060"/></linearGradient>
<linearGradient id="gGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#E7C77F"/><stop offset="1" stop-color="#C79A3A"/></linearGradient>
<linearGradient id="gDesk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EADCC4"/><stop offset="1" stop-color="#DCC7A6"/></linearGradient>
<linearGradient id="gScreen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#F3F7FA"/></linearGradient>
<radialGradient id="gGlow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#1F9A82" stop-opacity=".35"/><stop offset="1" stop-color="#1F9A82" stop-opacity="0"/></radialGradient>
</defs>`;

// ---------------------------------------------------------------- primitives
const R = (x, y, w, h, fill, rx = 10, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" ${extra}/>`;
const T = (x, y, s, size = 14, fill = C.navy, weight = 600, anchor = 'start') => `<text x="${x}" y="${y}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${esc(s)}</text>`;
const lines = (x, y, w, n, gap = 12, color = C.line, last = .6) => Array.from({ length: n }, (_, i) =>
  `<rect x="${x}" y="${y + i * gap}" width="${i === n - 1 ? w * last : w}" height="5" rx="2.5" fill="${color}"/>`).join('');
const tick = (x, y, s = 1, color = C.green) => `<path d="M${x} ${y} l${5 * s} ${5 * s} l${9 * s} -${10 * s}" fill="none" stroke="${color}" stroke-width="${3 * Math.max(s, .8)}" stroke-linecap="round" stroke-linejoin="round"/>`;
const tickDot = (cx, cy, r = 11, bg = C.greenXL, fg = C.green) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"/>` + tick(cx - r * .42, cy, r / 11, fg);

function paper(x, y, w, h, { n = 6, fold = true, accent = null, rot = 0, shadow = 'sh2' } = {}) {
  const f = fold ? `<path d="M${x + w - 18} ${y} L${x + w} ${y + 18} L${x + w - 18} ${y + 18} Z" fill="${C.line2}"/>` : '';
  const a = accent ? R(x + 16, y + 18, w * .38, 8, accent, 4) : '';
  return `<g transform="rotate(${rot} ${x + w / 2} ${y + h / 2})" filter="url(#${shadow})">
    <path d="M${x + 6} ${y} H${x + w - 18} L${x + w} ${y + 18} V${y + h - 6} Q${x + w} ${y + h} ${x + w - 6} ${y + h} H${x + 6} Q${x} ${y + h} ${x} ${y + h - 6} V${y + 6} Q${x} ${y} ${x + 6} ${y} Z" fill="${C.paper}"/>
    ${f}${a}${lines(x + 16, y + (accent ? 40 : 22), w - 34, n)}</g>`;
}
function laptop(x, y, w, screenInner = '') {
  const h = w * .62;
  return `<g filter="url(#sh)">
    ${R(x, y, w, h, C.navy2, 12)}${R(x + 8, y + 8, w - 16, h - 16, 'url(#gScreen)', 6)}
    <path d="M${x - w * .08} ${y + h} H${x + w * 1.08} L${x + w * 1.02} ${y + h + 14} H${x - w * .02} Z" fill="#C9D3DE"/>
    ${R(x + w * .42, y + h, w * .16, 4, '#AFBBC8', 2)}</g>
    <g transform="translate(${x + 8} ${y + 8})">${screenInner}</g>`;
}
function calculator(x, y, s = 1) {
  const keys = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) keys.push(R(x + 10 * s + c * 20 * s, y + 46 * s + r * 17 * s, 15 * s, 11 * s, r === 3 && c === 2 ? C.gold : C.navy3, 3 * s));
  return `<g filter="url(#sh2)">${R(x, y, 76 * s, 120 * s, 'url(#gNavy)', 10 * s)}${R(x + 9 * s, y + 10 * s, 58 * s, 26 * s, C.greenL, 5 * s)}
    ${R(x + 30 * s, y + 20 * s, 30 * s, 6 * s, C.green, 3 * s)}${keys.join('')}</g>`;
}
function phone(x, y, s = 1, inner = '') {
  return `<g filter="url(#sh2)">${R(x, y, 64 * s, 120 * s, C.navy, 12 * s)}${R(x + 5 * s, y + 9 * s, 54 * s, 102 * s, C.paper, 7 * s)}
    ${R(x + 24 * s, y + 3.5 * s, 16 * s, 3 * s, C.navy3, 1.5 * s)}</g><g transform="translate(${x + 5 * s} ${y + 9 * s})">${inner}</g>`;
}
function mug(x, y) {
  return `<g filter="url(#sh2)"><path d="M${x} ${y} h34 v30 a8 8 0 0 1 -8 8 h-18 a8 8 0 0 1 -8 -8 Z" fill="${C.paper}"/>
    <path d="M${x + 34} ${y + 7} a9 9 0 0 1 0 18" fill="none" stroke="${C.paper}" stroke-width="5"/>${R(x + 4, y + 10, 26, 6, C.greenL, 3)}</g>`;
}
function plant(x, y, s = 1) {
  const L = (cx, cy, rx, ry, rot, f) => `<ellipse cx="${x + cx * s}" cy="${y + cy * s}" rx="${rx * s}" ry="${ry * s}" fill="${f}" transform="rotate(${rot} ${x + cx * s} ${y + cy * s})"/>`;
  return `<g>${L(30, 18, 9, 24, -28, C.leaf)}${L(48, 14, 9, 26, 22, C.leaf2)}${L(20, 40, 8, 20, -62, C.leaf2)}${L(58, 38, 8, 20, 58, C.leaf)}${L(39, 8, 7, 22, 2, C.leaf)}
    <path d="M${x + 18 * s} ${y + 56 * s} h${44 * s} l${-5 * s} ${36 * s} h${-34 * s} Z" fill="${C.pot}"/>${R(x + 15 * s, y + 52 * s, 50 * s, 9 * s, '#B88E66', 3 * s)}</g>`;
}
function folder(x, y, w, h, color = C.gold, tab = C.goldD) {
  return `<g filter="url(#sh2)"><path d="M${x} ${y + 10} q0 -10 10 -10 h${w * .3} l10 12 h${w * .7 - 20} q10 0 10 10 v${h - 22} q0 10 -10 10 h${-w + 20} q-10 0 -10 -10 Z" fill="${tab}"/>
    ${R(x, y + 18, w, h - 18, color, 10)}</g>`;
}
function binder(x, y, w, h) {
  return `<g filter="url(#sh2)">${R(x, y, w, h, 'url(#gNavy)', 10)}${R(x + 10, y + 10, 10, h - 20, C.navy3, 5)}
    ${R(x + w * .4, y + h * .3, w * .44, h * .22, C.paper, 6)}${R(x + w * .46, y + h * .37, w * .3, 5, C.line, 2.5)}${R(x + w * .46, y + h * .44, w * .2, 5, C.line, 2.5)}</g>`;
}
function envelope(x, y, w, h, seal = C.gold) {
  return `<g filter="url(#sh2)">${R(x, y, w, h, C.paper, 8)}<path d="M${x + 4} ${y + 6} L${x + w / 2} ${y + h * .55} L${x + w - 4} ${y + 6}" fill="none" stroke="${C.line}" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="${x + w / 2}" cy="${y + h * .55}" r="${h * .14}" fill="${seal}"/></g>`;
}
function building(x, y, w, color = C.navy2) {
  const cols = Array.from({ length: 4 }, (_, i) => R(x + w * .14 + i * w * .2, y + w * .42, w * .1, w * .42, color, 2)).join('');
  return `<g filter="url(#sh2)"><path d="M${x} ${y + w * .38} L${x + w / 2} ${y + w * .08} L${x + w} ${y + w * .38} Z" fill="${color}"/>${R(x + w * .04, y + w * .36, w * .92, w * .07, color, 2)}${cols}${R(x, y + w * .84, w, w * .1, color, 3)}</g>`;
}
function card(x, y, w, h, inner = '', fill = C.paper) { return `<g filter="url(#sh)">${R(x, y, w, h, fill, 14)}</g><g transform="translate(${x} ${y})">${inner}</g>`; }
const iconCircle = (cx, cy, r, fill, inner) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"/>${inner}`;
const shield = (cx, cy, s = 1, fill = C.green) => `<path d="M${cx} ${cy - 16 * s} l${13 * s} ${5 * s} v${9 * s} c0 ${9 * s} ${-6 * s} ${15 * s} ${-13 * s} ${18 * s} c${-7 * s} ${-3 * s} ${-13 * s} ${-9 * s} ${-13 * s} ${-18 * s} v${-9 * s} Z" fill="${fill}"/>` + tick(cx - 6 * s, cy, s * .75, '#fff');
const bars = (x, y, vals, w = 14, gap = 8, maxH = 60, colors = [C.green, C.green2, C.gold]) => vals.map((v, i) =>
  R(x + i * (w + gap), y + maxH - v * maxH, w, v * maxH, colors[i % colors.length], 4)).join('');
const blob = (cx, cy, r, fill, op = 1) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="${op}"/>`;
const dashPath = (d, color = C.gold, w = 3) => `<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-dasharray="2 9"/>`;
const flag = (x, y, color = C.gold) => `<path d="M${x} ${y} v-46" stroke="${C.navy}" stroke-width="3.5" stroke-linecap="round"/><path d="M${x + 1.5} ${y - 46} h26 l-7 9 l7 9 h-26 Z" fill="${color}"/><circle cx="${x}" cy="${y}" r="5" fill="${C.navy}"/>`;
const rupeeCircle = (cx, cy, r = 16) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.goldXL}" stroke="${C.gold}" stroke-width="2"/>${T(cx, cy + r * .36, '₹', r * 1.05, C.goldD, 700, 'middle')}`;

function svg(w, h, title, desc, body, bg = null) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-labelledby="t d" font-family="${FONT}">
<title id="t">${esc(title)}</title><desc id="d">${esc(desc)}</desc>${defs}
${bg ? R(0, 0, w, h, bg, 24) : ''}${body}
</svg>\n`;
}

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

// Calculator illustration
S['calculator-planning'] = () => svg(560, 420, 'Planning a hypothetical scenario against your monthly budget',
  'Illustration: a budget card balancing income against expenses, a savings progress bar building month by month, a calendar and a calculator. It shows planning, not a guaranteed reduction.',
  blob(440, 100, 120, C.greenXL) + blob(120, 330, 110, C.goldXL) +
  card(40, 50, 250, 170, `${T(20, 32, 'Monthly budget', 15, C.navy, 700)}
    ${T(20, 64, 'Income', 12, '#556070', 500)}${R(100, 55, 130, 12, C.green, 6)}
    ${T(20, 92, 'Essentials', 12, '#556070', 500)}${R(100, 83, 82, 12, C.navy3, 6)}
    ${T(20, 120, 'Other EMIs', 12, '#556070', 500)}${R(100, 111, 34, 12, C.navy4, 6)}
    ${T(20, 148, 'Buffer', 12, '#556070', 500)}${R(100, 139, 18, 12, C.gold, 6)}`) +
  card(110, 240, 300, 120, `${T(20, 32, 'Building the amount', 14, C.navy, 700)}${R(20, 50, 260, 16, C.bg2, 8)}${R(20, 50, 150, 16, 'url(#gGreen)', 8)}
    ${Array.from({ length: 6 }, (_, i) => `<circle cx="${30 + i * 48}" cy="${90}" r="7" fill="${i < 3 ? C.green : C.line}"/>`).join('')}`) +
  calculator(330, 70, 1.05) + card(430, 210, 100, 100, `${R(0, 0, 100, 28, C.navy2, 14)}${R(0, 16, 100, 12, C.navy2, 0)}${T(50, 72, '?', 34, C.goldD, 700, 'middle')}`)
);

fs.mkdirSync(OUT, { recursive: true });
const only = process.argv.slice(2);
let n = 0;
for (const [name, make] of Object.entries(S)) {
  if (only.length && !only.includes(name)) continue;
  fs.writeFileSync(path.join(OUT, name + '.svg'), make()); n++;
}
console.log(`Wrote ${n} scene illustrations to assets/illustrations/`);
