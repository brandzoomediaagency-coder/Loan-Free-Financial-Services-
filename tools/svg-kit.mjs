// Shared drawing vocabulary for the site's original illustrations (flat editorial
// style in the brand palette). Used by tools/scenes.mjs and tools/guide-images.mjs.
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


export { C, FONT, esc, defs, R, T, lines, tick, tickDot, paper, laptop, calculator, phone, mug, plant, folder, binder, envelope, building, card, iconCircle, shield, bars, blob, dashPath, flag, rupeeCircle, svg };
