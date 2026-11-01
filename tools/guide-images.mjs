#!/usr/bin/env node
// Original, topic-specific images for every guide (blog post and Hindi guide).
// Each guide gets its own flat editorial scene in the brand palette, built from the
// shared vocabulary in tools/svg-kit.mjs, so the picture shows what the guide is
// about (a recovery call outside permitted hours, a settlement letter, a credit
// report, a court notice...). No people, no logos, no seals, no readable personal data.
//
// Writes assets/thumbs/<slug>-1200.webp (1200x800, article hero + share image) and
// assets/thumbs/<slug>.webp (600x400, resource-card thumbnail), plus assets/og/blog-<slug>.jpg
// (1200x630 share card) for any guide that does not have one yet.
// Run: node tools/guide-images.mjs [slug...]     (needs Playwright + Python Pillow)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import {
  C, R, T, lines, tick, tickDot, paper, laptop, calculator, phone, mug, plant, folder, binder, envelope,
  building, card, iconCircle, shield, bars, blob, dashPath, flag, rupeeCircle, svg,
} from './svg-kit.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/thumbs');
const W = 600, H = 400;

// ---------------------------------------------------------------- extra objects
const BG = {
  rights: ['#E6F3EF', '#F6FBF9'], settlement: ['#FAF2E0', '#FFFCF5'], credit: ['#ECEEFA', '#F8F9FE'],
  legal: ['#F3ECE1', '#FCFAF6'], apps: ['#E6F0F8', '#F7FAFD'], default: ['#F9ECE8', '#FEFAF8'], calm: ['#E8F2EE', '#FAFCFB'],
};
const backdrop = (cat) => {
  const [a, b] = BG[cat] || BG.rights;
  return `<defs><linearGradient id="bgG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${b}"/><stop offset="1" stop-color="${a}"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#bgG)"/>`;
};
const desk = (y = 330) => `<path d="M0 ${y} H${W} V${H} H0 Z" fill="url(#gDesk)"/><rect x="0" y="${y}" width="${W}" height="6" fill="${C.woodD}"/>`;
const floorShadow = (cx, cy, rx, ry = 8) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#0B2035" opacity=".08"/>`;

function clock(cx, cy, r, h = 8, m = 0, ring = C.navy) {
  const ang = (deg) => (deg - 90) * Math.PI / 180;
  const ha = ang((h % 12) * 30 + m * .5), ma = ang(m * 6);
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = ang(i * 30); return `<line x1="${cx + Math.cos(a) * r * .78}" y1="${cy + Math.sin(a) * r * .78}" x2="${cx + Math.cos(a) * r * .9}" y2="${cy + Math.sin(a) * r * .9}" stroke="${C.line}" stroke-width="${r * .06}" stroke-linecap="round"/>`; }).join('');
  return `<g filter="url(#sh2)"><circle cx="${cx}" cy="${cy}" r="${r + r * .12}" fill="${C.paper}"/></g><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${ring}" stroke-width="${r * .1}"/>${ticks}
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(ha) * r * .5}" y2="${cy + Math.sin(ha) * r * .5}" stroke="${C.navy}" stroke-width="${r * .11}" stroke-linecap="round"/>
    <line x1="${cx}" y1="${cy}" x2="${cx + Math.cos(ma) * r * .72}" y2="${cy + Math.sin(ma) * r * .72}" stroke="${C.gold}" stroke-width="${r * .08}" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="${r * .08}" fill="${C.navy}"/>`;
}
function gavel(x, y, s = 1) {
  return `<g filter="url(#sh2)" transform="translate(${x} ${y}) scale(${s}) rotate(-35)">
    ${R(-6, 0, 12, 110, C.woodD, 6)}${R(-40, -22, 80, 34, '#8A5A35', 10)}${R(-46, -24, 12, 38, '#6E4528', 5)}${R(34, -24, 12, 38, '#6E4528', 5)}</g>
    ${R(x - 10 * s, y + 92 * s, 90 * s, 16 * s, '#6E4528', 6 * s)}${R(x + 4 * s, y + 80 * s, 62 * s, 14 * s, '#8A5A35', 6 * s)}`;
}
function scales(cx, cy, s = 1, tilt = 0) {
  const a = tilt * Math.PI / 180, dx = Math.cos(a) * 70 * s, dy = Math.sin(a) * 70 * s;
  const pan = (px, py) => `<path d="M${px} ${py} l${-24 * s} ${44 * s} M${px} ${py} l${24 * s} ${44 * s}" stroke="${C.goldD}" stroke-width="${2 * s}"/><path d="M${px - 30 * s} ${py + 44 * s} a${30 * s} ${12 * s} 0 0 0 ${60 * s} 0 Z" fill="url(#gGold)"/>`;
  return `<g filter="url(#sh2)">${R(cx - 5 * s, cy - 10 * s, 10 * s, 120 * s, C.navy2, 4 * s)}${R(cx - 36 * s, cy + 104 * s, 72 * s, 14 * s, C.navy, 6 * s)}
    <line x1="${cx - dx}" y1="${cy - dy}" x2="${cx + dx}" y2="${cy + dy}" stroke="${C.navy}" stroke-width="${7 * s}" stroke-linecap="round"/>
    <circle cx="${cx}" cy="${cy - 12 * s}" r="${9 * s}" fill="${C.gold}"/>${pan(cx - dx, cy - dy)}${pan(cx + dx, cy + dy)}</g>`;
}
function gauge(cx, cy, r, val = .7, label = '') {
  const arc = (from, to, color) => {
    const p = (t) => [cx - Math.cos(t * Math.PI) * r, cy - Math.sin(t * Math.PI) * r];
    const [x1, y1] = p(from), [x2, y2] = p(to);
    return `<path d="M${x1} ${y1} A${r} ${r} 0 0 1 ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="${r * .2}" stroke-linecap="butt"/>`;
  };
  const t = val * Math.PI;
  return arc(0, .33, '#E07A5F') + arc(.34, .66, C.gold) + arc(.67, 1, C.green2) +
    `<line x1="${cx}" y1="${cy}" x2="${cx - Math.cos(t) * r * .78}" y2="${cy - Math.sin(t) * r * .78}" stroke="${C.navy}" stroke-width="${r * .07}" stroke-linecap="round"/><circle cx="${cx}" cy="${cy}" r="${r * .1}" fill="${C.navy}"/>` +
    (label ? T(cx, cy + r * .42, label, r * .26, C.navy, 700, 'middle') : '');
}
function cal(x, y, w, h, marks = [], { head = C.navy2, title = '', markColor = C.goldL, markText = C.goldD, start = 1 } = {}) {
  const cols = 5, rows = 3, cw = (w - 24) / cols, rh = (h - 58) / rows;
  const cells = Array.from({ length: cols * rows }, (_, i) => {
    const cx = x + 12 + cw * (i % cols) + cw / 2, cy = y + 52 + rh * Math.floor(i / cols) + rh / 2;
    const n = String(start + i);
    return marks.includes(i) ? `<circle cx="${cx}" cy="${cy}" r="${Math.min(cw, rh) * .4}" fill="${markColor}"/>${T(cx, cy + 4, n, 11, markText, 700, 'middle')}` : T(cx, cy + 4, n, 11, '#8795A3', 500, 'middle');
  }).join('');
  return `<g filter="url(#sh)">${R(x, y, w, h, C.paper, 14)}</g>${R(x, y, w, 38, head, 14)}${R(x, y + 24, w, 14, head, 0)}
    ${R(x + 26, y - 8, 8, 20, C.navy3, 4)}${R(x + w - 34, y - 8, 8, 20, C.navy3, 4)}${title ? T(x + 16, y + 26, title, 13, '#fff', 700) : ''}${cells}`;
}
function house(x, y, w, body = C.paper, roof = C.green) {
  const h = w * .8;
  return `<g filter="url(#sh)"><path d="M${x - w * .08} ${y + h * .42} L${x + w / 2} ${y} L${x + w * 1.08} ${y + h * .42} Z" fill="${roof}"/>
    ${R(x, y + h * .38, w, h * .62, body, 6)}${R(x + w * .4, y + h * .62, w * .2, h * .38, C.navy2, 4)}
    ${R(x + w * .1, y + h * .52, w * .2, h * .18, C.greenXL, 3)}${R(x + w * .7, y + h * .52, w * .2, h * .18, C.greenXL, 3)}</g>`;
}
const warn = (cx, cy, s = 1, fill = '#E0A33A') => `<g filter="url(#sh2)"><path d="M${cx} ${cy - 30 * s} L${cx + 34 * s} ${cy + 28 * s} H${cx - 34 * s} Z" fill="${fill}" stroke="${fill}" stroke-width="${8 * s}" stroke-linejoin="round"/></g>
  ${R(cx - 3.5 * s, cy - 12 * s, 7 * s, 24 * s, '#fff', 3.5 * s)}<circle cx="${cx}" cy="${cy + 20 * s}" r="${4.2 * s}" fill="#fff"/>`;
const crossDot = (cx, cy, r = 11, bg = '#FBECE8', fg = C.red) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${bg}"/><path d="M${cx - r * .38} ${cy - r * .38} L${cx + r * .38} ${cy + r * .38} M${cx + r * .38} ${cy - r * .38} L${cx - r * .38} ${cy + r * .38}" stroke="${fg}" stroke-width="${2.6 * r / 11}" stroke-linecap="round"/>`;
const magnifier = (cx, cy, r = 40) => `<g filter="url(#sh2)"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff" fill-opacity=".5" stroke="${C.navy}" stroke-width="${r * .2}"/><path d="M${cx + r * .72} ${cy + r * .72} L${cx + r * 1.7} ${cy + r * 1.7}" stroke="${C.navy}" stroke-width="${r * .32}" stroke-linecap="round"/></g>`;
const bubble = (x, y, w, h, fill = C.paper, tail = 'left', inner = '') => `<g filter="url(#sh)">${R(x, y, w, h, fill, 16)}<path d="${tail === 'left' ? `M${x + 26} ${y + h - 2} l-8 22 l26 -22 Z` : `M${x + w - 26} ${y + h - 2} l8 22 l-26 -22 Z`}" fill="${fill}"/></g><g transform="translate(${x} ${y})">${inner}</g>`;
const ringWaves = (cx, cy, color = C.red) => [14, 26, 38].map((r, i) => `<path d="M${cx + r} ${cy - r * .8} a${r} ${r} 0 0 1 0 ${r * 1.6}" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="${1 - i * .25}"/>`).join('');
const pen = (x, y, rot = 35, len = 120) => `<g transform="rotate(${rot} ${x} ${y})" filter="url(#sh2)">${R(x, y, len, 11, C.navy, 5.5)}${R(x + len * .72, y, len * .12, 11, C.gold, 0)}<path d="M${x + len} ${y} l16 5.5 l-16 5.5 Z" fill="${C.goldD}"/></g>`;
const lock = (cx, cy, s = 1, body = C.navy2) => `<g filter="url(#sh2)"><path d="M${cx - 16 * s} ${cy} v${-12 * s} a${16 * s} ${16 * s} 0 0 1 ${32 * s} 0 v${12 * s}" fill="none" stroke="${C.navy3}" stroke-width="${7 * s}"/>${R(cx - 26 * s, cy - 2 * s, 52 * s, 42 * s, body, 9 * s)}<circle cx="${cx}" cy="${cy + 16 * s}" r="${6 * s}" fill="${C.gold}"/></g>`;
const stamp = (cx, cy, r, color = C.green, label = '') => `<g transform="rotate(-14 ${cx} ${cy})" opacity=".92"><circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color}" stroke-width="${r * .1}"/><circle cx="${cx}" cy="${cy}" r="${r * .78}" fill="none" stroke="${color}" stroke-width="${r * .04}"/>${label ? T(cx, cy + r * .1, label, r * .27, color, 800, 'middle') : tick(cx - r * .3, cy, r / 22, color)}</g>`;
const progress = (x, y, w, val, fill = 'url(#gGreen)', h = 14) => R(x, y, w, h, C.bg2, h / 2) + R(x, y, Math.max(h, w * val), h, fill, h / 2);
const coinStack = (x, y, n = 4, r = 22) => Array.from({ length: n }, (_, i) => `<ellipse cx="${x}" cy="${y - i * 9}" rx="${r}" ry="${r * .38}" fill="${i === n - 1 ? C.gold : C.goldD}" stroke="${C.goldL}" stroke-width="1.5"/>`).join('') + T(x, y - (n - 1) * 9 + 5, '₹', r * .6, '#fff', 800, 'middle');
const chip = (x, y, w, label, fill, color) => R(x, y, w, 24, fill, 12) + T(x + w / 2, y + 16.5, label, 11.5, color, 700, 'middle');
const rows = (x, y, items, gap = 34) => items.map(([kind, label], i) => `${kind === 'ok' ? tickDot(x + 12, y + i * gap, 11) : kind === 'no' ? crossDot(x + 12, y + i * gap, 11) : `<circle cx="${x + 12}" cy="${y + i * gap}" r="11" fill="${C.goldXL}"/>${T(x + 12, y + i * gap + 4, '!', 13, C.goldD, 800, 'middle')}`}${T(x + 32, y + i * gap + 5, label, 13, C.ink, 600)}`).join('');
const pill = (cx, cy, s = 1) => `<g transform="rotate(-30 ${cx} ${cy})" filter="url(#sh2)">${R(cx - 22 * s, cy - 9 * s, 44 * s, 18 * s, '#fff', 9 * s)}${R(cx, cy - 9 * s, 22 * s, 18 * s, C.green2, 0)}<path d="M${cx + 13 * s} ${cy - 9 * s} a9 9 0 0 1 0 ${18 * s} h-13 v-${18 * s} Z" fill="${C.green2}"/></g>`;
const spectacles = (cx, cy, s = 1) => `<g fill="none" stroke="${C.navy}" stroke-width="${4 * s}"><circle cx="${cx - 22 * s}" cy="${cy}" r="${16 * s}"/><circle cx="${cx + 22 * s}" cy="${cy}" r="${16 * s}"/><path d="M${cx - 6 * s} ${cy - 2 * s} q${6 * s} ${-6 * s} ${12 * s} 0"/></g>`;
const gradCap = (cx, cy, s = 1) => `<g filter="url(#sh2)"><path d="M${cx} ${cy - 30 * s} L${cx + 70 * s} ${cy} L${cx} ${cy + 30 * s} L${cx - 70 * s} ${cy} Z" fill="${C.navy}"/><path d="M${cx - 40 * s} ${cy + 14 * s} v${26 * s} q${40 * s} ${24 * s} ${80 * s} 0 v${-26 * s} L${cx} ${cy + 30 * s} Z" fill="${C.navy2}"/>
  <path d="M${cx + 52 * s} ${cy + 6 * s} v${40 * s}" stroke="${C.gold}" stroke-width="${4 * s}"/><circle cx="${cx + 52 * s}" cy="${cy + 50 * s}" r="${7 * s}" fill="${C.gold}"/></g>`;
const sparkle = (cx, cy, r = 10, fill = C.gold) => `<path d="M${cx} ${cy - r} Q${cx + r * .15} ${cy - r * .15} ${cx + r} ${cy} Q${cx + r * .15} ${cy + r * .15} ${cx} ${cy + r} Q${cx - r * .15} ${cy + r * .15} ${cx - r} ${cy} Q${cx - r * .15} ${cy - r * .15} ${cx} ${cy - r} Z" fill="${fill}"/>`;
const ccard = (x, y, w, fill = 'url(#gNavy)', rot = 0, stripe = C.navy3) => `<g filter="url(#sh)" transform="rotate(${rot} ${x + w / 2} ${y + w * .31})">${R(x, y, w, w * .62, fill, w * .07)}${R(x + w * .1, y + w * .18, w * .18, w * .13, C.gold, 5)}${R(x + w * .1, y + w * .44, w * .62, w * .045, stripe, 4)}</g>`;
const sun = (cx, cy, r = 26) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${C.gold}"/>` + Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `<line x1="${cx + Math.cos(a) * r * 1.3}" y1="${cy + Math.sin(a) * r * 1.3}" x2="${cx + Math.cos(a) * r * 1.65}" y2="${cy + Math.sin(a) * r * 1.65}" stroke="${C.gold}" stroke-width="5" stroke-linecap="round"/>`; }).join('');
const cloud = (x, y, s = 1, fill = '#C9D3DE') => `<g fill="${fill}"><circle cx="${x}" cy="${y}" r="${22 * s}"/><circle cx="${x + 26 * s}" cy="${y - 12 * s}" r="${28 * s}"/><circle cx="${x + 56 * s}" cy="${y}" r="${22 * s}"/>${R(x, y - 2 * s, 56 * s, 24 * s, fill, 0)}</g>`;
const statusRow = (x, y, w, label, fg, bg) => `${R(x, y, w, 40, '#F8FAFC', 10)}${R(x + 10, y + 11, 64, 7, C.line, 3.5)}${R(x + 10, y + 24, 42, 6, C.line2, 3)}${R(x + w - 98, y + 9, 88, 22, bg, 11)}${T(x + w - 54, y + 24.5, label, 11, fg, 700, 'middle')}`;

const scene = (cat, title, desc, body) => svg(W, H, title, desc, backdrop(cat) + body);

// ---------------------------------------------------------------- scenes, one per guide
const S = {
  // ---- borrower rights / recovery
  'recovery-agent-calling-hours-india-rbi': () => scene('rights', 'Recovery calls only between 8 a.m. and 7 p.m.',
    'Illustration: a wall clock showing nine at night next to a ringing phone with a blocked-call sign, and a card marking the permitted window of 8 a.m. to 7 p.m.',
    blob(140, 120, 120, 'url(#gGlow)') + clock(150, 160, 78, 9, 5) +
    phone(300, 92, 1.75, `${T(27, 30, '21:05', 12, C.navy, 700, 'middle')}${iconCircle(27, 70, 18, '#FBECE8', `<path d="M18 61 L36 79 M36 61 L18 79" stroke="${C.red}" stroke-width="4" stroke-linecap="round"/>`)}${R(8, 104, 38, 6, C.line, 3)}`) + ringWaves(420, 150) +
    card(402, 240, 170, 110, `${T(16, 30, 'Permitted', 13, C.navy, 700)}${R(16, 44, 138, 26, C.greenXL, 13)}${T(85, 62, '8 am – 7 pm', 13, C.green, 700, 'middle')}${tickDot(28, 90, 10)}${R(46, 86, 90, 7, C.line, 3.5)}`) +
    floorShadow(150, 268, 70)),

  'how-to-file-rbi-complaint-recovery-harassment': () => scene('rights', 'Filing a complaint step by step',
    'Illustration: a laptop showing an online complaint form with a submit button, a written complaint letter, a phone and a three-step escalation path from lender to ombudsman.',
    laptop(170, 70, 260, `${T(16, 28, 'Complaint', 14, C.navy, 700)}${R(16, 40, 210, 18, C.bg, 6)}${R(16, 64, 210, 18, C.bg, 6)}${R(16, 88, 210, 30, C.bg, 6)}${R(150, 128, 76, 22, C.green, 11)}${T(188, 143, 'Submit', 11, '#fff', 700, 'middle')}`) +
    desk(300) + paper(40, 200, 120, 150, { n: 7, accent: C.green, rot: -6 }) + pen(60, 330, -12, 110) + mug(500, 262) +
    [['Lender', C.navy3], ['30 days', C.goldD], ['Ombudsman', C.green]].map(([l, c], i) => `${i ? dashPath(`M${190 + (i - 1) * 140 + 92} 352 H${190 + i * 140 - 6}`, C.gold, 3) : ''}${R(190 + i * 140, 338, 92, 28, C.paper, 14, 'filter="url(#sh2)"')}${T(236 + i * 140, 357, l, 11.5, c, 700, 'middle')}`).join('')),

  'stop-recovery-agent-harassment-legal-guide': () => scene('rights', 'Protection from unlawful recovery',
    'Illustration: a large green shield with a tick in front of a phone with an incoming call, and a checklist card of evidence: call log, screenshots, written complaint.',
    blob(200, 200, 150, 'url(#gGlow)') + `<g filter="url(#sh)">${shield(200, 200, 6, 'url(#gGreen)')}</g>` +
    phone(330, 70, 1.4, `${T(27, 30, 'Incoming', 9, C.navy, 700, 'middle')}${iconCircle(27, 66, 16, '#FBECE8', `<path d="M20 60 q7 14 14 12" stroke="${C.red}" stroke-width="4" fill="none" stroke-linecap="round"/>`)}${R(8, 96, 38, 6, C.line, 3)}`) + ringWaves(426, 120) +
    card(392, 232, 180, 128, `${T(16, 28, 'Keep a record', 13, C.navy, 700)}${rows(14, 52, [['ok', 'Call log'], ['ok', 'Screenshots'], ['ok', 'Complaint']], 26)}`)),

  'how-to-stop-loan-harassment-india': () => scene('rights', 'Stopping loan harassment the lawful way',
    'Illustration: a phone with a muted ringer and a block sign, a written complaint in an envelope and a shield badge, on a calm desk.',
    desk(310) + phone(80, 120, 1.6, `${iconCircle(27, 40, 18, C.greenXL, `<path d="M18 40 h18" stroke="${C.green}" stroke-width="4" stroke-linecap="round"/>`)}${T(27, 78, 'Blocked', 9, C.navy, 700, 'middle')}${R(8, 92, 38, 6, C.line, 3)}`) +
    envelope(230, 210, 170, 110, C.green) + paper(250, 110, 130, 130, { n: 6, accent: C.navy3, fold: false }) +
    card(420, 90, 150, 150, `${iconCircle(75, 62, 40, C.greenXL, shield(75, 66, 1.9, C.green))}${T(75, 128, 'Your rights', 13, C.navy, 700, 'middle')}`) + plant(470, 236, .9)),

  'fair-debt-collection-practices-india': () => scene('rights', 'Fair debt collection practices',
    'Illustration: balanced scales beside a card listing what recovery agents may and may not do — identify themselves, call in permitted hours; no threats, no calls to relatives.',
    scales(160, 120, 1, 0) + floorShadow(160, 248, 60) +
    card(300, 60, 270, 280, `${T(20, 34, 'Recovery conduct', 15, C.navy, 700)}${R(20, 48, 230, 1.5, C.line2, 1)}${rows(20, 78, [['ok', 'Identify themselves'], ['ok', 'Call 8 am – 7 pm'], ['ok', 'Give written notice'], ['no', 'Threats or abuse'], ['no', 'Shaming relatives'], ['no', 'Night visits']], 38)}`)),

  'rbi-guidelines-2024-borrower-rights': () => scene('rights', 'Borrower rights under RBI rules',
    'Illustration: a rule book with a bookmark, a shield with a tick and cards showing key rights: transparency, privacy and grievance redressal.',
    blob(170, 200, 140, 'url(#gGlow)') + binder(70, 90, 170, 230) + `<g filter="url(#sh)">${shield(155, 300, 2.4, 'url(#gGreen)')}</g>` +
    card(280, 60, 290, 76, `${iconCircle(38, 38, 22, C.greenXL, tick(28, 38, 1, C.green))}${T(72, 34, 'Clear terms', 14, C.navy, 700)}${R(72, 46, 160, 6, C.line, 3)}`) +
    card(300, 156, 270, 76, `${iconCircle(38, 38, 22, C.goldXL, lock(38, 32, .45, C.goldD))}${T(72, 34, 'Privacy of data', 14, C.navy, 700)}${R(72, 46, 150, 6, C.line, 3)}`) +
    card(280, 252, 290, 76, `${iconCircle(38, 38, 22, '#EAF3FA', `<path d="M28 32 h20 M28 40 h14" stroke="${C.navy3}" stroke-width="4" stroke-linecap="round"/>`)}${T(72, 34, 'Grievance redressal', 14, C.navy, 700)}${R(72, 46, 150, 6, C.line, 3)}`)),

  'rbi-recovery-agent-rules-2027': () => scene('rights', 'New recovery rules from 1 January 2027',
    'Illustration: a calendar marked 1 January 2027, a rule book and a notification card telling the borrower the recovery agency details one day before a visit.',
    cal(50, 80, 220, 220, [0], { title: 'January 2027', markColor: C.green, markText: '#fff' }) +
    binder(300, 170, 130, 170) + phone(450, 70, 1.5, `${R(6, 18, 42, 26, C.greenXL, 6)}${R(10, 24, 30, 5, C.green, 2.5)}${R(10, 33, 22, 5, C.green2, 2.5)}${R(8, 58, 38, 6, C.line, 3)}${R(8, 70, 30, 6, C.line, 3)}${tickDot(27, 100, 11)}`) +
    `<g filter="url(#sh)">${shield(520, 310, 1.6, 'url(#gGreen)')}</g>`),

  'loan-settlement-scams-how-to-spot': () => scene('rights', 'Spotting loan settlement scams',
    'Illustration: a magnifying glass over a too-good-to-be-true offer card promising a guaranteed waiver, marked with a warning sign and crosses, beside a shield.',
    card(60, 70, 260, 260, `${T(20, 36, '“Guaranteed”', 18, C.navy, 700)}${T(20, 60, 'offer', 14, '#556070', 600)}${rows(20, 98, [['no', 'Pay 90% less, sure'], ['no', 'Upfront fee to agent'], ['no', 'Share your OTP'], ['no', 'Pay to personal UPI']], 40)}`) +
    magnifier(330, 170, 52) + warn(470, 110, 1.5) + `<g filter="url(#sh)">${shield(480, 290, 2.6, 'url(#gGreen)')}</g>`),

  'what-happens-to-loan-after-borrower-death-india': () => scene('rights', 'What happens to a loan after the borrower dies',
    'Illustration: a family home, a folder of estate papers, a loan insurance policy with a shield and a calm marigold plant, showing that dues are settled from the estate and insurance.',
    desk(320) + house(60, 120, 180) + folder(270, 190, 150, 120, C.gold, C.goldD) + paper(285, 160, 110, 70, { n: 3, accent: C.navy3, fold: false }) +
    card(440, 80, 130, 150, `${iconCircle(65, 58, 36, C.greenXL, shield(65, 62, 1.7, C.green))}${T(65, 120, 'Insurance', 13, C.navy, 700, 'middle')}`) +
    `<g>${[0, 1, 2, 3, 4, 5].map((i) => `<circle cx="${490 + Math.cos(i) * 14}" cy="${268 + Math.sin(i) * 10}" r="11" fill="${i % 2 ? '#E8A33A' : '#F2B84B'}"/>`).join('')}<circle cx="490" cy="268" r="7" fill="${C.goldD}"/></g>${R(476, 286, 28, 36, C.pot, 4)}`),

  // ---- settlement
  'debt-settlement-india-beginners-guide': () => scene('settlement', 'How debt settlement works',
    'Illustration: a four-step path from hardship to proposal, negotiation and settlement letter, ending at a flag, with a calculator and documents on a desk.',
    dashPath('M60 300 C140 250 180 300 250 240 S380 160 460 150 S530 100 548 92', C.gold, 3.5) + flag(548, 96) +
    [['1', 60, 300], ['2', 250, 240], ['3', 400, 168]].map(([n, x, y]) => `<g filter="url(#sh2)"><circle cx="${x}" cy="${y}" r="22" fill="${C.paper}"/></g>${T(x, y + 6, n, 16, C.green, 800, 'middle')}`).join('') +
    card(60, 60, 200, 120, `${T(18, 30, 'Settlement', 14, C.navy, 700)}${rows(18, 58, [['ok', 'Hardship proof'], ['ok', 'Written offer']], 30)}`) +
    paper(300, 270, 130, 100, { n: 4, accent: C.green, rot: -4 }) + calculator(470, 250, .9)),

  'loan-settlement-letter-checklist': () => scene('settlement', 'Checking a loan settlement letter',
    'Illustration: a settlement letter on the lender’s letterhead with a checklist of what it must state — amount, due dates, full and final settlement, credit reporting — a pen and a no-dues stamp.',
    card(60, 40, 270, 330, `${R(0, 0, 270, 50, C.navy2, 14)}${R(0, 36, 270, 14, C.navy2, 0)}${R(18, 18, 90, 12, '#fff', 6)}${rows(20, 84, [['ok', 'Account & amount'], ['ok', 'Payment dates'], ['ok', 'Full & final wording'], ['ok', 'Credit report status'], ['ok', 'Documents returned']], 44)}${R(20, 300, 120, 6, C.line, 3)}`) +
    stamp(470, 120, 62, C.green, 'NO DUES') + pen(380, 270, -25, 150) + envelope(420, 300, 150, 80)),

  'credit-card-debt-cycle-how-to-break-free': () => scene('settlement', 'Breaking the credit card debt cycle',
    'Illustration: two credit cards caught in a circular arrow of minimum payments, beside a statement where the balance trends down after a plan.',
    `<g fill="none" stroke="${C.red}" stroke-width="8" stroke-linecap="round" opacity=".55"><path d="M80 200 a110 110 0 0 1 200 -60"/><path d="M290 220 a110 110 0 0 1 -200 60"/></g><path d="M282 130 l6 24 l-22 -6 Z" fill="${C.red}" opacity=".55"/><path d="M88 290 l-6 -24 l22 6 Z" fill="${C.red}" opacity=".55"/>` +
    ccard(110, 150, 150, 'url(#gNavy)', -10) + ccard(140, 180, 150, 'url(#gGreen)', 8, '#127060') +
    card(340, 70, 230, 260, `${T(18, 32, 'Balance', 15, C.navy, 700)}${R(18, 44, 194, 1.5, C.line2, 1)}${bars(26, 64, [.95, .85, .7, .52, .35, .2], 22, 10, 120, [C.navy3, C.navy3, C.green2, C.green2, C.green, C.green])}${T(18, 228, 'With a plan', 12, C.green, 700)}`)),

  'debt-consolidation-vs-debt-settlement-india': () => scene('settlement', 'Consolidation or settlement?',
    'Illustration: several statement cards merging into one loan on the left, and a settlement letter with a tick on the right, separated by a fork in the path.',
    [0, 1, 2].map((i) => `<g filter="url(#sh2)">${R(50 + i * 16, 70 + i * 40, 150, 56, C.paper, 10)}${R(66 + i * 16, 88 + i * 40, 70, 7, C.line, 3.5)}${R(66 + i * 16, 102 + i * 40, 100, 6, C.line2, 3)}</g>`).join('') +
    dashPath('M210 200 C250 200 260 250 300 260', C.navy3, 3) + card(250, 250, 150, 100, `${T(16, 30, 'One loan', 14, C.navy, 700)}${R(16, 46, 110, 8, C.green, 4)}${R(16, 62, 80, 6, C.line, 3)}`) +
    `<path d="M300 40 V380" stroke="${C.line}" stroke-width="3" stroke-dasharray="6 8"/>` +
    paper(420, 60, 150, 190, { n: 7, accent: C.gold }) + `<g filter="url(#sh2)">${iconCircle(545, 240, 28, C.green, tick(531, 241, 1.4, '#fff'))}</g>` + chip(430, 300, 130, 'Settlement', C.goldXL, C.goldD)),

  'business-loan-settlement-strategies-msme': () => scene('settlement', 'Business loan options for MSMEs',
    'Illustration: a small shopfront with an awning, a cash-flow chart that dips and recovers, and a revised repayment schedule.',
    `<g filter="url(#sh)">${R(50, 150, 230, 200, C.paper, 12)}<path d="M38 156 H292 L276 104 H54 Z" fill="${C.green}"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${54 + i * 37} 156 h37 v16 a18.5 18.5 0 0 1 -37 0 Z" fill="${i % 2 ? '#fff' : C.goldL}"/>`).join('')}
     ${R(80, 220, 70, 130, C.navy2, 6)}${R(170, 220, 86, 60, C.greenXL, 6)}</g>` +
    card(320, 50, 250, 150, `${T(18, 30, 'Cash flow', 14, C.navy, 700)}${bars(22, 50, [.7, .55, .3, .25, .45, .7, .85], 20, 10, 80, [C.green, C.green2, C.red, C.red, C.gold, C.green2, C.green])}`) +
    card(320, 220, 250, 130, `${T(18, 30, 'Revised schedule', 14, C.navy, 700)}${lines(18, 48, 210, 4, 16)}`)),

  'debt-relief-seniors-pensioners-india': () => scene('settlement', 'Debt relief options for senior citizens',
    'Illustration: a pension passbook, reading glasses, a cup of tea and a simple monthly budget card protecting essential expenses.',
    desk(300) + `<g filter="url(#sh)" transform="rotate(-6 160 220)">${R(70, 130, 180, 230, C.navy2, 12)}${R(90, 160, 140, 24, C.goldL, 6)}${R(90, 200, 120, 7, C.navy3, 3.5)}${R(90, 216, 90, 7, C.navy3, 3.5)}</g>` +
    spectacles(160, 330, 1.2) + mug(290, 260) +
    card(360, 60, 210, 230, `${T(18, 32, 'Monthly budget', 14, C.navy, 700)}${T(18, 66, 'Pension', 12, '#556070', 600)}${R(100, 57, 90, 12, C.green, 6)}${T(18, 98, 'Medicine', 12, '#556070', 600)}${R(100, 89, 50, 12, C.navy3, 6)}${T(18, 130, 'Household', 12, '#556070', 600)}${R(100, 121, 40, 12, C.navy4, 6)}${T(18, 162, 'Loan', 12, '#556070', 600)}${R(100, 153, 20, 12, C.gold, 6)}${tickDot(30, 198, 11)}${T(48, 203, 'Essentials first', 12, C.green, 700)}`) + pill(330, 350, .9)),

  'student-loan-debt-relief-options-india': () => scene('settlement', 'Education loan repayment options',
    'Illustration: a graduation cap above a stack of books, an education loan statement and a calendar showing the repayment holiday ending.',
    gradCap(170, 110, 1.3) + [0, 1, 2].map((i) => `<g filter="url(#sh2)">${R(80 + i * 6, 230 - i * 30, 190 - i * 12, 28, [C.green, C.navy3, C.gold][i], 6)}</g>`).join('') + floorShadow(175, 262, 100) +
    paper(320, 70, 130, 170, { n: 7, accent: C.navy3, rot: -4 }) + cal(430, 160, 150, 190, [7, 12], { title: 'Repay' })),

  // ---- credit report
  'how-to-remove-loan-settlement-status-cibil': () => scene('credit', 'Settled vs Closed on your credit report',
    'Illustration: a credit report with account status labels Settled and Closed, an arrow showing a settled account updated to closed after paying the balance, and a magnifying glass.',
    card(60, 50, 300, 300, `${T(20, 34, 'Credit report', 15, C.navy, 700)}${R(20, 48, 260, 1.5, C.line2, 1)}${statusRow(20, 66, 260, 'Settled', C.goldD, C.goldXL)}${statusRow(20, 120, 260, 'Closed', C.green, C.greenXL)}${statusRow(20, 174, 260, 'Current', C.navy3, '#EAF3FA')}${R(20, 236, 200, 6, C.line, 3)}${R(20, 250, 150, 6, C.line2, 3)}`) +
    `<path d="M380 150 C430 150 440 200 470 210" fill="none" stroke="${C.green}" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 10"/>` + magnifier(470, 230, 46)),

  'improve-cibil-score-after-debt-settlement': () => scene('credit', 'Rebuilding your credit score',
    'Illustration: a score gauge whose needle moves from the low band toward the healthy band, a rising chart and a calendar of on-time payments.',
    card(50, 60, 260, 200, `${gauge(130, 140, 90, .72, '')}${T(130, 182, 'Rebuilding', 14, C.green, 700, 'middle')}`) +
    card(330, 60, 240, 150, `${T(18, 30, 'Score trend', 14, C.navy, 700)}<path d="M20 120 L60 112 L100 100 L140 82 L180 62 L210 44" fill="none" stroke="${C.green}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="210" cy="44" r="7" fill="${C.green}"/>`) +
    cal(330, 230, 240, 140, [0, 1, 2, 3, 4, 5, 6, 7, 8], { title: 'On-time EMIs', markColor: C.greenXL, markText: C.green }) +
    `<g filter="url(#sh2)">${ccard(70, 280, 120, 'url(#gGreen)', -6, '#127060')}</g>`),

  // ---- legal
  'how-to-respond-bank-legal-notice': () => scene('legal', 'Responding to a bank’s legal notice',
    'Illustration: an opened envelope with a legal notice, a written reply with a pen and a calendar with the reply deadline circled.',
    envelope(50, 190, 200, 130) + paper(78, 70, 150, 170, { n: 7, accent: C.red, fold: false }) +
    paper(280, 80, 160, 230, { n: 10, accent: C.green, rot: 3 }) + pen(330, 300, -20, 140) +
    cal(450, 60, 130, 150, [11], { head: C.red, title: 'Reply by', markColor: '#FBECE8', markText: C.red })),

  'section-138-ni-act-defenses-remedies': () => scene('legal', 'Cheque bounce under Section 138',
    'Illustration: a cheque marked “returned”, a timeline of 30, 15 and 15 days, and a court building with a gavel.',
    `<g filter="url(#sh)" transform="rotate(-5 200 140)">${R(50, 70, 300, 140, C.paper, 12)}${R(70, 92, 120, 10, C.navy3, 5)}${R(70, 130, 220, 6, C.line, 3)}${R(70, 150, 180, 6, C.line, 3)}${R(250, 172, 80, 22, C.greenXL, 6)}</g>` + stamp(290, 120, 44, C.red, 'RETURNED') +
    [['30', 'days'], ['15', 'days'], ['15', 'days']].map(([n, d], i) => `${i ? dashPath(`M${60 + (i - 1) * 110 + 80} 290 H${60 + i * 110}`, C.gold, 3) : ''}<g filter="url(#sh2)">${R(60 + i * 110, 262, 80, 56, C.paper, 12)}</g>${T(100 + i * 110, 290, n, 20, C.navy, 800, 'middle')}${T(100 + i * 110, 308, d, 11, '#556070', 600, 'middle')}`).join('') +
    building(420, 60, 150) + gavel(440, 260, .6)),

  'arbitration-loan-recovery-process': () => scene('legal', 'Arbitration in loan recovery',
    'Illustration: a single arbitrator’s table with scales, documents from both sides and an award document with a seal.',
    paper(40, 110, 130, 170, { n: 7, accent: C.navy3, rot: -6 }) + paper(430, 110, 130, 170, { n: 7, accent: C.gold, rot: 6 }) +
    scales(300, 90, 1.1, -6) + `<path d="M150 330 H450" stroke="${C.navy2}" stroke-width="14" stroke-linecap="round"/>` + floorShadow(300, 345, 160) +
    card(230, 260, 140, 60, `${T(18, 26, 'Award', 13, C.navy, 700)}${R(18, 36, 70, 6, C.line, 3)}<circle cx="114" cy="30" r="14" fill="${C.gold}"/>`)),

  'litigation-vs-settlement-risk-analysis': () => scene('legal', 'Litigation or settlement: weighing the risk',
    'Illustration: a balance with a court building on one side and a settlement letter on the other, with hourglass and cost cards beneath.',
    scales(300, 90, 1.25, 8) + `<g transform="translate(176 46) scale(.5)">${building(0, 0, 140)}</g>` + paper(395, 70, 70, 80, { n: 3, accent: C.green, fold: false, rot: 4 }) +
    card(50, 270, 200, 90, `${T(18, 30, 'Time & cost', 13, C.navy, 700)}${bars(18, 40, [.9, .7, .8], 22, 10, 40, [C.red, C.red, C.red])}`) +
    card(350, 270, 200, 90, `${T(18, 30, 'Negotiated', 13, C.navy, 700)}${tickDot(30, 62, 11)}${R(50, 58, 110, 7, C.line, 3.5)}`)),

  'role-debt-resolution-lawyer-india': () => scene('legal', 'When a lawyer helps in debt resolution',
    'Illustration: a lawyer’s desk with a case file, law books, a gavel and a meeting card for a consultation.',
    desk(300) + [0, 1, 2, 3].map((i) => R(60 + i * 30, 120 + (i % 2) * 14, 26, 180 - (i % 2) * 14, [C.navy2, C.green, '#8A5A35', C.navy3][i], 4, 'filter="url(#sh2)"')).join('') +
    folder(220, 200, 170, 110, C.gold, C.goldD) + gavel(430, 230, .7) +
    card(410, 60, 160, 120, `${T(16, 30, 'Consultation', 13, C.navy, 700)}${iconCircle(30, 66, 14, C.greenXL, tick(22, 66, .8, C.green))}${R(52, 62, 90, 7, C.line, 3.5)}${R(16, 94, 110, 6, C.line2, 3)}`)),

  'lok-adalat-loan-settlement-india': () => scene('legal', 'Settling a loan dispute at Lok Adalat',
    'Illustration: a court building with two conversation bubbles meeting in agreement, a scales icon and a settlement award with a tick.',
    building(50, 50, 200) + floorShadow(150, 252, 110) +
    bubble(280, 60, 150, 70, C.paper, 'left', `${R(18, 22, 90, 8, C.navy3, 4)}${R(18, 38, 110, 7, C.line, 3.5)}`) +
    bubble(410, 150, 160, 70, C.greenXL, 'right', `${R(18, 22, 90, 8, C.green, 4)}${R(18, 38, 120, 7, '#BFDCD3', 3.5)}`) +
    paper(300, 250, 150, 120, { n: 4, accent: C.green }) + `<g filter="url(#sh2)">${iconCircle(450, 340, 28, C.green, tick(436, 341, 1.4, '#fff'))}</g>`),

  'sarfaesi-notice-13-2-borrower-options': () => scene('legal', 'A SARFAESI demand notice and your options',
    'Illustration: a home with a notice envelope, a calendar counting sixty days and a written representation being sent to the bank.',
    house(50, 110, 200) + envelope(170, 230, 130, 84, C.red) +
    cal(320, 50, 250, 160, [0, 14], { title: '60 days', markColor: '#FBECE8', markText: C.red }) +
    paper(340, 230, 120, 130, { n: 5, accent: C.green, rot: -3 }) + `<path d="M470 300 h60" stroke="${C.green}" stroke-width="5" stroke-linecap="round"/><path d="M528 290 l14 10 l-14 10 Z" fill="${C.green}"/>` +
    `<g transform="translate(500 206) scale(.42)">${building(0, 0, 160)}</g>`),

  // ---- loan apps / fintech
  'digital-lending-apps-rbi-regulations': () => scene('apps', 'Digital lending apps and RBI rules',
    'Illustration: a phone showing a loan app with a key fact statement, a lock protecting contacts and photos, and a tick for a regulated lender.',
    phone(220, 40, 2.6, `<g transform="scale(2.6)">${T(27, 16, 'Loan app', 6.5, C.navy, 700, 'middle')}${R(5, 24, 44, 34, C.greenXL, 5)}${R(9, 30, 24, 3.5, C.green, 1.75)}${R(9, 37, 32, 3, '#BFDCD3', 1.5)}${R(9, 43, 28, 3, '#BFDCD3', 1.5)}${R(5, 66, 44, 7, C.bg, 3.5)}${R(5, 76, 44, 7, C.bg, 3.5)}${R(5, 88, 44, 10, C.green, 5)}${T(27, 95, 'Key facts', 5, '#fff', 700, 'middle')}</g>`) +
    card(50, 80, 150, 140, `${lock(75, 56, 1.1)}${T(75, 120, 'No contacts', 12, C.navy, 700, 'middle')}`) +
    card(410, 60, 160, 100, `${iconCircle(34, 50, 20, C.greenXL, tick(25, 50, .9, C.green))}${T(62, 46, 'Regulated', 13, C.navy, 700)}${R(62, 58, 80, 6, C.line, 3)}`) +
    card(410, 190, 160, 140, `${T(16, 28, 'Key facts', 13, C.navy, 700)}${lines(16, 44, 128, 5, 16)}`)),

  'future-debt-resolution-fintech-india': () => scene('apps', 'Technology in debt resolution',
    'Illustration: a laptop dashboard with charts and a secure online settlement portal, connected nodes and a phone with a confirmation tick.',
    laptop(150, 60, 300, `${T(16, 28, 'Resolution portal', 14, C.navy, 700)}${R(16, 40, 120, 70, C.bg, 8)}${bars(26, 50, [.4, .6, .8, .55], 16, 10, 50)}${R(148, 40, 120, 30, C.greenXL, 8)}${R(158, 52, 70, 6, C.green, 3)}${R(148, 80, 120, 30, C.bg, 8)}${R(158, 92, 60, 6, C.line, 3)}${R(16, 122, 252, 26, C.bg, 8)}`) +
    desk(320) + [[60, 90], [90, 160], [40, 230], [530, 100], [560, 190]].map(([x, y], i, a) => `${i && i !== 3 ? `<line x1="${a[i - 1][0]}" y1="${a[i - 1][1]}" x2="${x}" y2="${y}" stroke="${C.navy3}" stroke-width="2" opacity=".4"/>` : ''}<circle cx="${x}" cy="${y}" r="10" fill="${i % 2 ? C.green2 : C.gold}"/>`).join('') +
    sparkle(520, 250, 14) + phone(470, 210, 1, `${tickDot(27, 50, 14)}`)),

  // ---- missed EMIs / budgeting
  'what-to-do-when-you-cannot-pay-emi': () => scene('default', 'When you cannot pay an EMI',
    'Illustration: a calendar with a missed EMI date, a budget card, a phone to call the lender early and a plan card with next steps.',
    cal(50, 60, 220, 200, [4], { head: C.navy2, title: 'EMI due', markColor: '#FBECE8', markText: C.red }) +
    phone(300, 90, 1.3, `${iconCircle(27, 40, 16, C.greenXL, `<path d="M20 34 q2 14 14 14" stroke="${C.green}" stroke-width="4" fill="none" stroke-linecap="round"/>`)}${T(27, 78, 'Lender', 9, C.navy, 700, 'middle')}`) +
    card(400, 60, 170, 260, `${T(16, 30, 'Next steps', 14, C.navy, 700)}${rows(16, 64, [['ok', 'Tell lender'], ['ok', 'List budget'], ['ok', 'Ask options'], ['ok', 'Get it written']], 44)}`) + calculator(120, 280, .7)),

  'personal-loan-default-consequences-india': () => scene('default', 'What happens when a personal loan goes unpaid',
    'Illustration: a timeline of missed payments from reminder to overdue to notice, with a credit score gauge dropping and a warning sign.',
    [['Reminder', C.navy3, '#EAF3FA'], ['Overdue', C.goldD, C.goldXL], ['Notice', C.red, '#FBECE8']].map(([l, f, b], i) => `${i ? dashPath(`M${50 + (i - 1) * 180 + 150} 110 H${50 + i * 180}`, C.gold, 3) : ''}<g filter="url(#sh2)">${R(50 + i * 180, 80, 150, 60, C.paper, 14)}</g>${R(64 + i * 180, 98, 122, 24, b, 12)}${T(125 + i * 180, 115, l, 12, f, 700, 'middle')}`).join('') +
    card(70, 180, 240, 180, `${gauge(120, 120, 80, .2, '')}${T(120, 160, 'Score falls', 13, C.red, 700, 'middle')}`) + warn(440, 250, 1.6) + paper(490, 210, 80, 110, { n: 4, accent: C.red, rot: 6 })),

  'bank-loan-npa-what-happens-after-90-days': () => scene('default', 'When a loan becomes an NPA after 90 days',
    'Illustration: a progress track marked 30, 60 and 90 days moving from amber to red, with a bank building and an account card flagged as non-performing.',
    building(410, 50, 160) + card(50, 60, 330, 150, `${T(20, 34, 'Days overdue', 15, C.navy, 700)}${R(20, 60, 290, 16, C.bg2, 8)}${R(20, 60, 96, 16, C.gold, 8)}${R(110, 60, 96, 16, '#E08A3A', 0)}${R(200, 60, 110, 16, C.red, 8)}${['30', '60', '90'].map((n, i) => T(116 + i * 96, 104, n, 14, i === 2 ? C.red : C.navy, 800, 'middle')).join('')}${T(20, 134, 'SMA-0 · SMA-1 · SMA-2 · NPA', 12, '#556070', 600)}`) +
    card(50, 240, 330, 120, `${T(20, 34, 'Account status', 14, C.navy, 700)}${statusRow(20, 52, 290, 'NPA', C.red, '#FBECE8')}`) + warn(490, 300, 1.2, C.red)),

  'psychological-toll-debt-stress-management': () => scene('calm', 'Looking after yourself under debt stress',
    'Illustration: a cloud giving way to sunshine above a calm desk with a cup of tea, a plant, a notebook with a short daily plan and a phone set to quiet hours.',
    sun(470, 90, 30) + cloud(330, 100, 1.2) + desk(300) + mug(380, 260) + plant(470, 216, 1.1) +
    `<g filter="url(#sh)">${R(80, 150, 230, 200, C.paper, 12)}</g>${R(80, 150, 16, 200, C.green, 8)}${T(112, 182, 'Today', 15, C.navy, 700)}${rows(112, 214, [['ok', 'Short walk'], ['ok', 'One call'], ['ok', 'Talk to family']], 36)}` +
    phone(260, 236, .75, `${iconCircle(27, 46, 14, C.greenXL, `<path d="M22 46 h10" stroke="${C.green}" stroke-width="3" stroke-linecap="round"/>`)}`)),

  'how-to-request-emi-restructuring-from-bank': () => scene('default', 'Asking your bank to restructure EMIs',
    'Illustration: a written request letter, a schedule card where tall EMI bars become shorter and spread over more months, and a calendar showing the extended tenure.',
    paper(50, 60, 170, 250, { n: 11, accent: C.green, rot: -3 }) + pen(90, 310, -10, 130) +
    card(250, 60, 320, 160, `${T(18, 30, 'Before', 12, '#556070', 700)}${bars(18, 40, [.95, .95, .95], 26, 10, 90, [C.red, C.red, C.red])}${`<path d="M130 90 h30" stroke="${C.gold}" stroke-width="4" stroke-linecap="round"/><path d="M158 82 l12 8 l-12 8 Z" fill="${C.gold}"/>`}${T(180, 30, 'After', 12, '#556070', 700)}${bars(180, 40, [.55, .55, .55, .55], 18, 8, 90, [C.green, C.green, C.green, C.green])}`) +
    cal(250, 240, 320, 130, [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], { title: 'Longer tenure', markColor: C.greenXL, markText: C.green })),

  // ---- Hindi guides (no Latin labels)
  'hi-loan-nahi-bhara-to-kya-hoga': () => scene('default', 'लोन न भरने पर क्या होता है',
    'Illustration: a calendar with missed EMI dates, a reminder phone, a falling credit score gauge and a warning sign.',
    cal(50, 60, 220, 210, [2, 7, 12], { head: C.navy2, markColor: '#FBECE8', markText: C.red }) +
    card(300, 60, 260, 170, `${gauge(130, 120, 84, .22, '')}`) + warn(380, 300, 1.4) + phone(470, 250, .9, `${ringWaves(48, 40)}`)),
  'hi-loan-settlement-kaise-kare': () => scene('settlement', 'लोन सेटलमेंट कैसे करें',
    'Illustration: a path of steps from documents to a negotiated settlement letter with a tick, with a calculator.',
    dashPath('M60 320 C150 270 190 300 260 240 S400 160 470 150 S530 100 548 92', C.gold, 3.5) + flag(548, 96) +
    paper(60, 70, 150, 190, { n: 8, accent: C.navy3, rot: -5 }) + paper(280, 190, 140, 160, { n: 6, accent: C.green, rot: 3 }) +
    `<g filter="url(#sh2)">${iconCircle(410, 200, 28, C.green, tick(396, 201, 1.4, '#fff'))}</g>` + calculator(470, 230, .9)),
  'hi-lok-adalat-loan-settlement': () => scene('legal', 'लोक अदालत में लोन सेटलमेंट',
    'Illustration: a court building, two conversation bubbles in agreement, and a settlement award with a tick.',
    building(50, 60, 200) + bubble(290, 60, 140, 66, C.paper, 'left', `${R(18, 22, 90, 8, C.navy3, 4)}${R(18, 38, 100, 7, C.line, 3.5)}`) +
    bubble(420, 150, 150, 66, C.greenXL, 'right', `${R(18, 22, 90, 8, C.green, 4)}${R(18, 38, 110, 7, '#BFDCD3', 3.5)}`) +
    scales(200, 270, .6) + paper(320, 250, 140, 120, { n: 4, accent: C.green }) + `<g filter="url(#sh2)">${iconCircle(460, 340, 26, C.green, tick(447, 341, 1.3, '#fff'))}</g>`),
  'hi-recovery-agent-se-kaise-bache': () => scene('rights', 'रिकवरी एजेंट से कैसे बचें',
    'Illustration: a shield with a tick, a clock showing permitted hours, and a phone with an incoming call.',
    blob(200, 200, 150, 'url(#gGlow)') + `<g filter="url(#sh)">${shield(190, 200, 6, 'url(#gGreen)')}</g>` + clock(450, 110, 60, 8, 0) +
    phone(380, 200, 1.2, `${iconCircle(27, 50, 16, '#FBECE8', `<path d="M20 44 q7 14 14 12" stroke="${C.red}" stroke-width="4" fill="none" stroke-linecap="round"/>`)}`) + ringWaves(460, 260)),
};

// ---------------------------------------------------------------- render
const only = process.argv.slice(2);
const names = Object.keys(S).filter((n) => !only.length || only.includes(n));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'lf-guide-img-'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const fontCss = ['inter-var-latin.woff2'].map((f) => `@font-face{font-family:Inter;src:url(data:font/woff2;base64,${fs.readFileSync(path.join(ROOT, 'assets/fonts', f)).toString('base64')})}`).join('');
for (const name of names) {
  await page.setContent(`<!doctype html><html><head><style>${fontCss}*{margin:0}body{width:${W}px;height:${H}px;overflow:hidden}</style></head><body>${S[name]()}</body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(TMP, name + '.png'), clip: { x: 0, y: 0, width: W, height: H } });
}
await browser.close();
// PNG -> WebP at 1200x800 (hero/share) and 600x400 (card thumbnail).
execFileSync('python3', ['-c', `
import sys, os
from PIL import Image
tmp, out, og_dir = sys.argv[1], sys.argv[2], sys.argv[3]
for n in sys.argv[4:]:
    im = Image.open(os.path.join(tmp, n + '.png')).convert('RGB')
    im.resize((1200, 800), Image.LANCZOS).save(os.path.join(out, n + '-1200.webp'), 'WEBP', quality=82, method=6)
    im.resize((600, 400), Image.LANCZOS).save(os.path.join(out, n + '.webp'), 'WEBP', quality=80, method=6)
    # Share card for guides that do not have one yet (1200x630): the scene centred on its own backdrop colour.
    og = os.path.join(og_dir, ('' if n.startswith('hi-') else 'blog-') + n + '.jpg')
    if not os.path.exists(og) and not os.path.exists(os.path.join(og_dir, n + '.jpg')):
        sc = im.resize((945, 630), Image.LANCZOS)
        card = Image.new('RGB', (1200, 630))
        card.paste(sc.crop((0, 0, 1, 630)).resize((128, 630)), (0, 0))
        card.paste(sc.crop((944, 0, 945, 630)).resize((127, 630)), (1073, 0))
        card.paste(sc, (128, 0))
        card.save(og, 'JPEG', quality=84, optimize=True, progressive=True)
`, TMP, OUT, path.join(ROOT, 'assets/og'), ...names], { stdio: 'inherit' });
fs.rmSync(TMP, { recursive: true, force: true });
console.log(`Wrote ${names.length} guide images to assets/thumbs/`);
