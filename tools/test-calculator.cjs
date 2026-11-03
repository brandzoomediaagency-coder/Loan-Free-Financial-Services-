#!/usr/bin/env node
// Unit tests for the Loan Settlement & Legal Fee Calculator (src/js/calculator.js).
// Run: node tools/test-calculator.cjs
'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const C = require(path.join(__dirname, '..', 'src', 'js', 'calculator.js'));

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok  ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}
const L = 100000, CR = 10000000; // ₹1 lakh, ₹1 crore

console.log('configuration');
test('SETTLEMENT_SCENARIO_PERCENT is 30 and is the single source', () => {
  assert.equal(C.CONFIG.SETTLEMENT_SCENARIO_PERCENT, 30);
  assert.equal(C.SETTLEMENT_SCENARIO_PERCENT, 30);
});
test('fee tiers: 1% / 0.75% / 0.50% in one config object', () => {
  assert.deepEqual(C.CONFIG.FEE_TIERS.map((t) => t.bps), [100, 75, 50]);
  assert.equal(C.FEE_TIERS, C.CONFIG.FEE_TIERS);
});
test('only unsecured loan types are offered, in the agreed order', () => {
  assert.deepEqual(C.LOAN_TYPES.map((t) => t.label), ['Credit Card Outstanding', 'Personal Loan', 'Business Loan (unsecured)', 'Education Loan (unsecured)', 'Consumer Durable Loan', 'Overdraft / Cash Credit (unsecured)', 'Other unsecured loan']);
});
test('no secured loan type is offered (home, vehicle, property, gold)', () => {
  const labels = C.LOAN_TYPES.map((t) => t.label).join(' | ');
  assert.ok(!/\b(home|vehicle|car|two-wheeler|property|gold|mortgage)\b/i.test(labels), labels);
  assert.deepEqual(C.normaliseLoanTypes(['home', 'vehicle', 'property', 'gold']), []);
});
test('no maximum of ₹1 crore (limit is a typing-error guard of ₹1,000 crore)', () => assert.equal(C.MAX_AMOUNT, 1e10));

console.log('illustrative settlement scenario (30%)');
const settle = (n) => C.settlementScenario(n).amount;
test('₹10,00,000 -> ₹3,00,000', () => assert.equal(settle(10 * L), 3 * L));
test('₹25,00,000 -> ₹7,50,000', () => assert.equal(settle(25 * L), 7.5 * L));
test('₹1,00,00,000 -> ₹30,00,000', () => assert.equal(settle(CR), 30 * L));
test('₹1,50,00,000 -> ₹45,00,000', () => assert.equal(settle(1.5 * CR), 45 * L));
test('rounded to the nearest rupee (₹10,00,001 -> ₹3,00,000)', () => { assert.equal(settle(1000001), 300000); assert.equal(C.settlementScenario(1000001).exact, 300000.3); });
test('reports the reference percentage', () => { const s = C.settlementScenario(10 * L); assert.equal(s.percent, 30); assert.equal(s.percentLabel, '30%'); });

console.log('legal / professional fee (flat-rate tiers on the entire amount)');
const fee = (n) => C.legalFee(n);
test('₹10,00,000 -> 1% -> ₹10,000 (boundary is inclusive)', () => { const f = fee(10 * L); assert.equal(f.percentLabel, '1%'); assert.equal(f.amount, 10000); });
test('₹10,00,001 -> 0.75% (just above ₹10 lakh)', () => { const f = fee(1000001); assert.equal(f.percentLabel, '0.75%'); assert.equal(f.amount, 7500); });
test('₹10,00,000.01 -> 0.75% (paise above the boundary)', () => assert.equal(fee(1000000.01).bps, 75));
test('₹25,00,000 -> 0.75% -> ₹18,750', () => { const f = fee(25 * L); assert.equal(f.percentLabel, '0.75%'); assert.equal(f.amount, 18750); });
test('₹99,99,999 -> 0.75% (just below ₹1 crore)', () => { const f = fee(9999999); assert.equal(f.percentLabel, '0.75%'); assert.equal(f.exact, 74999.9925); assert.equal(f.amount, 75000); });
test('₹1,00,00,000 -> 0.50% -> ₹50,000 (boundary belongs to the top tier)', () => { const f = fee(CR); assert.equal(f.percentLabel, '0.50%'); assert.equal(f.amount, 50000); });
test('₹1,50,00,000 -> 0.50% -> ₹75,000', () => { const f = fee(1.5 * CR); assert.equal(f.percentLabel, '0.50%'); assert.equal(f.amount, 75000); });
test('small amounts use 1% (₹1 -> ₹0.01, shown as ₹0)', () => { const f = fee(1); assert.equal(f.bps, 100); assert.equal(f.exact, 0.01); });
test('rate applies to the whole amount, not as slabs', () => {
  // A marginal slab would give 10,000 + 0.75% of 15 lakh = 21,250; the agreed rule gives 18,750.
  assert.equal(fee(25 * L).amount, 18750);
  assert.notEqual(fee(25 * L).amount, 21250);
});
test('documented threshold effect: fee falls just above each boundary', () => {
  assert.ok(fee(1000001).amount < fee(10 * L).amount);
  assert.ok(fee(CR).amount < fee(9999999).amount);
});
test('tier labels and ids', () => {
  assert.equal(C.feeTier(10 * L).id, 'tier-1');
  assert.equal(C.feeTier(10 * L + 1).id, 'tier-2');
  assert.equal(C.feeTier(CR - 1).id, 'tier-2');
  assert.equal(C.feeTier(CR).id, 'tier-3');
  assert.equal(C.feeTier(1e10).id, 'tier-3');
});

console.log('calculate(): results, empty and invalid input');
test('valid amount returns both figures separately (never combined)', () => {
  const r = C.calculate(10 * L, ['personal']);
  assert.equal(r.ok, true);
  assert.equal(r.results.settlement.amount, 3 * L);
  assert.equal(r.results.fee.amount, 10000);
  assert.ok(!('total' in r.results) && !('payable' in r.results) && !('savings' in r.results));
});
test('empty input -> "required", no results', () => { const r = C.calculate(null, []); assert.equal(r.error, 'required'); assert.equal(r.results, null); });
test('zero -> error, no results (no misleading ₹0)', () => { const r = C.calculate(0, []); assert.equal(r.error, 'zero'); assert.equal(r.results, null); });
test('negative -> error, no results', () => { const r = C.calculate(-5000, []); assert.equal(r.error, 'negative'); assert.equal(r.results, null); });
test('NaN / non-number -> invalid', () => { assert.equal(C.calculate(NaN, []).error, 'invalid'); assert.equal(C.calculate('1000', []).error, 'invalid'); });
test('very large amounts: ₹500 crore works exactly', () => {
  const r = C.calculate(5e9, []).results;
  assert.equal(r.settlement.amount, 1.5e9); assert.equal(r.fee.amount, 2.5e7); assert.equal(r.fee.percentLabel, '0.50%');
});
test('above ₹1,000 crore -> too large', () => assert.equal(C.calculate(1e10 + 1, []).error, 'too-large'));
test('each error has a friendly message', () => { for (const k of ['required', 'invalid', 'negative', 'zero', 'too-large']) assert.ok(C.MESSAGES[k].length > 10, k); });

console.log('parseAmount');
test('plain digits', () => assert.equal(C.parseAmount('1000000').value, 1000000));
test('Indian grouping', () => assert.equal(C.parseAmount('10,00,000').value, 1000000));
test('rupee sign and spaces', () => assert.equal(C.parseAmount(' ₹ 25,00,000 ').value, 2500000));
test('Rs / INR prefix', () => { assert.equal(C.parseAmount('Rs. 5000').value, 5000); assert.equal(C.parseAmount('INR 5000').value, 5000); });
test('decimals kept to paise', () => assert.equal(C.parseAmount('1500.556').value, 1500.56));
test('₹1 crore and above accepted', () => { assert.equal(C.parseAmount('1,00,00,000').value, CR); assert.equal(C.parseAmount('15,00,00,000').value, 15 * CR); });
test('empty is empty, not zero', () => { const p = C.parseAmount('   '); assert.equal(p.empty, true); assert.equal(p.value, null); });
test('negative rejected', () => assert.equal(C.parseAmount('-500').error, 'negative'));
test('text rejected', () => assert.equal(C.parseAmount('ten lakh').error, 'invalid'));
test('mixed text rejected', () => assert.equal(C.parseAmount('12abc').error, 'invalid'));
test('zero rejected', () => assert.equal(C.parseAmount('0').error, 'zero'));
test('too large rejected', () => assert.equal(C.parseAmount('99999999999').error, 'too-large'));

console.log('loan types');
test('multiple selections kept in list order', () => assert.deepEqual(C.normaliseLoanTypes(['education', 'credit-card', 'personal']), ['credit-card', 'personal', 'education']));
test('duplicates and unknown ids removed', () => assert.deepEqual(C.normaliseLoanTypes(['personal', 'personal', 'crypto']), ['personal']));
test('removing a type removes it from the results', () => {
  const before = C.calculate(10 * L, ['personal', 'credit-card']).loanTypes;
  const after = C.calculate(10 * L, before.filter((t) => t !== 'personal')).loanTypes;
  assert.deepEqual(before, ['credit-card', 'personal']); assert.deepEqual(after, ['credit-card']);
});
test('no types selected is allowed', () => assert.deepEqual(C.calculate(10 * L, []).loanTypes, []));
test('labels for display', () => assert.deepEqual(C.loanTypeLabels(['other', 'business']), ['Business Loan (unsecured)', 'Other unsecured loan']));
test('a secured id passed directly is ignored', () => assert.deepEqual(C.calculate(10 * L, ['personal', 'home']).loanTypes, ['personal']));
test('loan type never changes the figures', () => {
  const a = C.calculate(25 * L, []).results, b = C.calculate(25 * L, C.LOAN_TYPES.map((t) => t.id)).results;
  assert.deepEqual(a, b);
});

console.log('formatting');
test('Indian rupee grouping', () => { assert.equal(C.formatINR(1000000), '₹10,00,000'); assert.equal(C.formatINR(10000000), '₹1,00,00,000'); assert.equal(C.formatINR(18750), '₹18,750'); });
test('paise shown only when present', () => { assert.equal(C.formatINR(1500.5), '₹1,500.50'); assert.equal(C.formatINR(300000), '₹3,00,000'); });
test('percent labels', () => { assert.equal(C.formatPercent(1), '1%'); assert.equal(C.formatPercent(0.75), '0.75%'); assert.equal(C.formatPercent(0.5), '0.50%'); assert.equal(C.formatPercent(30), '30%'); });
test('groupIndian on long digit strings', () => { assert.equal(C.groupIndian('1000000000'), '1,00,00,00,000'); assert.equal(C.groupIndian('999'), '999'); });
test('live input formatting', () => {
  assert.equal(C.formatAmountInput('1000000'), '10,00,000');
  assert.equal(C.formatAmountInput('10,00,0000'), '1,00,00,000');
  assert.equal(C.formatAmountInput('₹2500000'), '25,00,000');
  assert.equal(C.formatAmountInput('0012'), '12');
  assert.equal(C.formatAmountInput('1500.567'), '1,500.56');
  assert.equal(C.formatAmountInput('1500.'), '1,500.');
  assert.equal(C.formatAmountInput(''), '');
});
test('live formatting leaves invalid text alone (null)', () => { assert.equal(C.formatAmountInput('-500'), null); assert.equal(C.formatAmountInput('abc'), null); });

console.log('page copy is generated from the same configuration');
const tplCheck = require('node:child_process').spawnSync(process.execPath, ['--input-type=module', '-e', `
  import { expandCalcTokens } from ${JSON.stringify('file://' + path.join(__dirname, '..', 'src', 'templates.mjs'))};
  console.log(JSON.stringify([expandCalcTokens('<!-- lf:calc-percent -->'), expandCalcTokens('<!-- lf:calc-fee-example 2500000 -->'), expandCalcTokens('<!-- lf:calc-fee-summary -->')]));
`], { encoding: 'utf8' });
test('tokens: percent, example and summary', () => {
  const [pct, ex, sum] = JSON.parse(tplCheck.stdout);
  assert.equal(pct, '30%');
  assert.equal(ex, '₹25,00,000 × 0.75% = ₹18,750');
  assert.match(sum, /^1% \(up to and including ₹10,00,000\), 0\.75% .* and 0\.50% \(₹1,00,00,000 and above\)$/);
});

console.log('privacy (static checks on the source)');
const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'js', 'calculator.js'), 'utf8');
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
test('no storage APIs', () => assert.ok(!/localStorage|sessionStorage|document\.cookie|indexedDB/.test(code)));
test('no network APIs', () => assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket|new Image\(/.test(code)));
test('no URL writes', () => assert.ok(!/history\.(push|replace)State|location\.(href|search|hash)\s*=|location\.assign|location\.replace/.test(code)));
test('no console logging', () => assert.ok(!/console\./.test(code)));
test('no Meta Pixel or dataLayer calls', () => assert.ok(!/fbq\(|dataLayer/.test(code)));
test('no WhatsApp links built from values', () => assert.ok(!/wa\.me|whatsapp/i.test(code)));
test('analytics: one existing event, no parameters', () => {
  const calls = code.match(/gtag\(([^)]*)\)/g) || [];
  assert.equal(calls.length, 1);
  assert.equal(calls[0], "gtag('event', 'calculator_used')");
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
