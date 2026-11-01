#!/usr/bin/env node
// Unit tests for the Loan Settlement Scenario Calculator (src/js/calculator.js).
// Run: node tools/test-calculator.cjs
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const C = require(path.join(__dirname, '..', 'src', 'js', 'calculator.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}
const base = { outstanding: 500000, income: 60000, expenses: 30000, commitments: 10000, buffer: 5000, savings: 50000, hypothetical: null };
const run = (o) => C.calculate(Object.assign({}, base, o));

console.log('parseAmount');
test('plain digits', () => assert.equal(C.parseAmount('150000').value, 150000));
test('Indian grouping with commas', () => assert.equal(C.parseAmount('1,50,000').value, 150000));
test('rupee sign and spaces', () => assert.equal(C.parseAmount(' ₹ 2,00,000 ').value, 200000));
test('Rs prefix', () => assert.equal(C.parseAmount('Rs. 5000').value, 5000));
test('decimals kept to paise', () => assert.equal(C.parseAmount('1500.556').value, 1500.56));
test('empty is empty, not zero', () => { const p = C.parseAmount(''); assert.equal(p.empty, true); assert.equal(p.value, null); });
test('negative rejected', () => assert.match(C.parseAmount('-500').error, /negative/));
test('text rejected', () => assert.match(C.parseAmount('five lakh').error, /digits/));
test('mixed text rejected', () => assert.ok(C.parseAmount('12abc').error));
test('very large rejected', () => assert.match(C.parseAmount('99999999999').error, /too large/));
test('limit itself accepted', () => assert.equal(C.parseAmount(String(C.MAX_AMOUNT)).value, C.MAX_AMOUNT));

console.log('monthly capacity');
test('capacity = income - expenses - commitments - buffer', () => assert.equal(run({}).results.capacity, 15000));
test('optional fields empty count as zero', () => assert.equal(run({ commitments: null, buffer: null, savings: null }).results.capacity, 30000));
test('negative capacity shown as zero with note', () => {
  const r = run({ expenses: 50000 });
  assert.equal(r.results.capacity, 0);
  assert.ok(r.notes.some((n) => n.key === 'zero-capacity'));
});
test('exactly zero capacity', () => assert.equal(run({ expenses: 45000 }).results.capacity, 0));
test('expenses greater than income: zero capacity + explanation', () => {
  const r = run({ expenses: 70000 });
  assert.equal(r.results.capacity, 0);
  assert.ok(r.notes.some((n) => n.key === 'expenses-exceed'));
});
test('zero income: zero capacity + explanation', () => {
  const r = run({ income: 0 });
  assert.equal(r.results.capacity, 0);
  assert.ok(r.notes.some((n) => n.key === 'zero-income'));
});

console.log('required fields and invalid input');
test('missing outstanding -> error, no results', () => { const r = run({ outstanding: null }); assert.ok(r.errors.outstanding); assert.equal(r.results, null); });
test('zero outstanding -> error', () => assert.ok(run({ outstanding: 0 }).errors.outstanding));
test('missing income -> error', () => assert.ok(run({ income: null }).errors.income));
test('missing expenses -> error', () => assert.ok(run({ expenses: null }).errors.expenses));
test('negative number passed directly -> error', () => assert.ok(run({ buffer: -1 }).errors.buffer));
test('NaN passed directly -> error', () => assert.ok(run({ savings: NaN }).errors.savings));

console.log('hypothetical scenario');
test('no hypothetical -> affordability snapshot only', () => {
  const r = run({}).results;
  assert.equal(r.scenario, false); assert.equal(r.difference, null); assert.equal(r.months, null); assert.equal(r.hypothetical, null);
});
test('remaining = hypothetical - savings', () => assert.equal(run({ hypothetical: 200000 }).results.remaining, 150000));
test('months = ceil(remaining / capacity)', () => assert.equal(run({ hypothetical: 200000 }).results.months, 10));
test('months rounds up', () => assert.equal(run({ hypothetical: 200001 }).results.months, 11));
test('difference = outstanding - hypothetical', () => assert.equal(run({ hypothetical: 200000 }).results.difference, 300000));
test('progress = savings / hypothetical', () => assert.equal(run({ hypothetical: 200000 }).results.progress, 0.25));
test('hypothetical equal to outstanding is allowed (difference 0)', () => {
  const r = run({ hypothetical: 500000 }); assert.equal(r.results.scenario, true); assert.equal(r.results.difference, 0);
});
test('hypothetical above outstanding -> error, no difference shown', () => {
  const r = run({ hypothetical: 600000 });
  assert.ok(r.errors.hypothetical); assert.equal(r.results.scenario, false); assert.equal(r.results.difference, null);
});
test('hypothetical of zero -> error', () => assert.ok(run({ hypothetical: 0 }).errors.hypothetical));
test('savings greater than hypothetical -> nothing left to build', () => {
  const r = run({ hypothetical: 40000 });
  assert.equal(r.results.remaining, 0); assert.equal(r.results.months, 0); assert.equal(r.results.progress, 1);
  assert.ok(r.notes.some((n) => n.key === 'savings-cover'));
});
test('zero capacity with amount still to build -> months not calculated', () => {
  const r = run({ expenses: 60000, hypothetical: 200000 });
  assert.equal(r.results.capacity, 0); assert.equal(r.results.months, null); assert.equal(r.results.remaining, 150000);
});
test('very long timeline flagged', () => {
  const r = run({ income: 46000, hypothetical: 500000, savings: 0 });
  assert.equal(r.results.capacity, 1000); assert.equal(r.results.months, 500);
  assert.ok(r.notes.some((n) => n.key === 'long'));
});
test('large but valid amounts do not overflow', () => {
  const r = C.calculate({ outstanding: 9e9, income: 5e8, expenses: 1e8, commitments: 0, buffer: 0, savings: 1e9, hypothetical: 5e9 });
  assert.equal(r.results.remaining, 4e9); assert.equal(r.results.months, 10); assert.equal(r.results.difference, 4e9);
});
test('decimal amounts handled to paise', () => {
  const r = C.calculate({ outstanding: 100000.5, income: 50000.25, expenses: 20000.1, commitments: 0, buffer: 0, savings: 0, hypothetical: 30000.15 });
  assert.equal(r.results.capacity, 30000.15); assert.equal(r.results.months, 1); assert.equal(r.results.difference, 70000.35);
});
test('never suggests an amount: hypothetical stays null unless entered', () => {
  const r = run({ hypothetical: null }).results;
  assert.equal(r.hypothetical, null);
  assert.ok(!('suggested' in r));
});

console.log('formatting');
test('Indian rupee grouping', () => assert.equal(C.formatINR(1234567), '₹12,34,567'));
test('paise shown only when present', () => assert.equal(C.formatINR(1500.5), '₹1,500.50'));
test('months wording', () => { assert.equal(C.formatMonths(1), '1 month'); assert.equal(C.formatMonths(14), '14 months (1 year 2 months)'); assert.equal(C.formatMonths(0), 'Already covered'); assert.equal(C.formatMonths(500), 'More than 10 years'); });

console.log('sliders');
const S = C.SLIDER_STEPS;
test('start of the scale is zero', () => { assert.equal(C.sliderToValue(0, 1e7), 0); assert.equal(C.sliderToValue(0, 345678, true), 0); });
test('end of the scale is exactly the maximum', () => { assert.equal(C.sliderToValue(S, 1e7), 1e7); assert.equal(C.sliderToValue(S, 345678, true), 345678); });
test('positions outside the range are clamped', () => { assert.equal(C.sliderToValue(-50, 5e5), 0); assert.equal(C.sliderToValue(S + 50, 5e5), 5e5); });
test('values never decrease as the slider moves right', () => {
  for (const [max, lin] of [[1e7, false], [5e5, false], [1e5, false], [345678, true], [52000, true]]) {
    let prev = -1;
    for (let pos = 0; pos <= S; pos++) { const v = C.sliderToValue(pos, max, lin); assert.ok(v >= prev, `${max} at ${pos}`); assert.ok(v <= max); prev = v; }
  }
});
test('budget scale gives fine control at small amounts', () => {
  assert.ok(C.sliderToValue(250, 1e7) < 2e5, 'a quarter of the way is under 2 lakh');
  assert.ok(C.sliderToValue(500, 5e5) < 1e5, 'half way on income is under 1 lakh');
});
test('values snap to round figures', () => { for (let pos = 1; pos < S; pos += 37) assert.equal(C.sliderToValue(pos, 1e7) % 100, 0); });
test('hypothetical slider is linear in the outstanding amount, never above it', () => {
  assert.equal(C.sliderToValue(500, 400000, true), 200000);
  for (let pos = 0; pos <= S; pos += 25) assert.ok(C.sliderToValue(pos, 345678, true) <= 345678);
});
test('typed values map back to a nearby slider position', () => {
  for (const [v, max, lin] of [[150000, 1e7, false], [45000, 5e5, false], [120000, 400000, true]]) {
    const back = C.sliderToValue(C.valueToSlider(v, max, lin), max, lin);
    assert.ok(Math.abs(back - v) / v < 0.03, `${v} -> ${back}`);
  }
});
test('typed values above the slider range sit at the end of the slider', () => assert.equal(C.valueToSlider(5e7, 1e7), S));
test('empty or zero values sit at the start', () => { assert.equal(C.valueToSlider(null, 1e7), 0); assert.equal(C.valueToSlider(0, 1e7), 0); });
test('no maximum yet (outstanding not entered) gives zero', () => { assert.equal(C.sliderToValue(600, 0, true), 0); assert.equal(C.valueToSlider(1000, 0, true), 0); });

console.log('privacy (static checks on the source)');
const src = require('node:fs').readFileSync(path.join(__dirname, '..', 'src', 'js', 'calculator.js'), 'utf8');
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
test('no storage APIs', () => assert.ok(!/localStorage|sessionStorage|document\.cookie|indexedDB/.test(code)));
test('no network APIs', () => assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|new Image\(/.test(code)));
test('no URL writes', () => assert.ok(!/history\.(push|replace)State|location\.(href|search|hash)\s*=/.test(code)));
test('no console logging', () => assert.ok(!/console\./.test(code)));
test('no Meta Pixel calls', () => assert.ok(!/fbq\(/.test(code)));
test('analytics event carries no parameters', () => {
  const calls = code.match(/gtag\(([^)]*)\)/g) || [];
  assert.equal(calls.length, 1);
  assert.equal(calls[0], "gtag('event', 'calculator_used')");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
