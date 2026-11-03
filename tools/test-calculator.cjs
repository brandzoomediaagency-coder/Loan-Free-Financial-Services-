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
test('pricing policy: ₹2 lakh standard threshold, fixed ₹2,000 below it, 8 payment months, 12 service months', () => {
  assert.equal(C.CONFIG.MIN_STANDARD_OUTSTANDING, 200000);
  assert.equal(C.CONFIG.BELOW_MINIMUM_MONTHLY_FEE, 2000);
  assert.equal(C.CONFIG.PAYMENT_MONTHS, 8);
  assert.equal(C.CONFIG.SERVICE_MONTHS, 12);
});
test('tiers are contiguous and do not overlap (min of each = max of the previous)', () => {
  const t = C.CONFIG.FEE_TIERS;
  assert.equal(t[0].min, C.CONFIG.MIN_STANDARD_OUTSTANDING);
  for (let i = 1; i < t.length; i++) assert.equal(t[i].min, t[i - 1].max, t[i].id);
  assert.deepEqual(t.map((x) => x.maxInclusive), [true, false, false]); // ₹10 lakh belongs to 1%; ₹1 crore to 0.50%
  assert.equal(t[t.length - 1].max, Infinity);
});
test('fee schedule lists four bands, starting with the fixed band', () => {
  assert.deepEqual(C.FEE_SCHEDULE.map((t) => t.id), ['tier-0', 'tier-1', 'tier-2', 'tier-3']);
  assert.deepEqual(C.FEE_SCHEDULE.map((t) => t.label), ['Below ₹2,00,000', '₹2,00,000 to ₹10,00,000 inclusive', 'Above ₹10,00,000 and below ₹1,00,00,000', '₹1,00,00,000 and above']);
  assert.equal(C.FEE_SCHEDULE[0].fixed, true);
  assert.equal(C.FEE_SCHEDULE[0].monthlyFee, 2000);
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

console.log('professional fee: the seven agreed examples (monthly fee × 8, 12 months of service)');
const est = (n) => C.feeEstimate(n);
const INR = C.formatINR;
// [outstanding, tier id, rate label, monthly fee, total fee] — from the business brief.
const EXAMPLES = [
  [1.5 * L, 'tier-0', 'Fixed ₹2,000/month', 2000, 16000],
  [2 * L, 'tier-1', '1%/month', 2000, 16000],
  [5 * L, 'tier-1', '1%/month', 5000, 40000],
  [10 * L, 'tier-1', '1%/month', 10000, 80000],
  [25 * L, 'tier-2', '0.75%/month', 18750, 150000],
  [CR, 'tier-3', '0.50%/month', 50000, 400000],
  [1.5 * CR, 'tier-3', '0.50%/month', 75000, 600000],
];
for (const [n, id, rateLabel, monthly, total] of EXAMPLES) {
  test(`${INR(n)} -> ${rateLabel}, ${INR(monthly)}/month × 8 = ${INR(total)}, 12 months of service`, () => {
    const f = est(n);
    assert.equal(f.tier.id, id);
    assert.equal(f.rateLabel, rateLabel);
    assert.equal(f.monthlyFee, monthly);
    assert.equal(f.paymentMonths, 8);
    assert.equal(f.totalFee, total);
    assert.equal(f.totalFee, f.monthlyFee * 8);
    assert.equal(f.serviceMonths, 12);
    assert.equal(f.outstanding, n);
  });
}
test('INR formatting of the examples', () => {
  assert.deepEqual(EXAMPLES.map(([n, , , m, t]) => [INR(n), INR(m), INR(t)]), [
    ['₹1,50,000', '₹2,000', '₹16,000'], ['₹2,00,000', '₹2,000', '₹16,000'], ['₹5,00,000', '₹5,000', '₹40,000'], ['₹10,00,000', '₹10,000', '₹80,000'],
    ['₹25,00,000', '₹18,750', '₹1,50,000'], ['₹1,00,00,000', '₹50,000', '₹4,00,000'], ['₹1,50,00,000', '₹75,000', '₹6,00,000'],
  ]);
});

console.log('professional fee: boundaries');
// [outstanding, tier id, bps (null = fixed), monthly fee, total fee]
const BOUNDARIES = [
  [1, 'tier-0', null, 2000, 16000],
  [199999, 'tier-0', null, 2000, 16000],
  [200000, 'tier-1', 100, 2000, 16000],
  [500000, 'tier-1', 100, 5000, 40000],
  [1000000, 'tier-1', 100, 10000, 80000],
  [1000001, 'tier-2', 75, 7500, 60000],         // 7,500.0075 -> 7,500
  [9999999, 'tier-2', 75, 75000, 600000],       // 74,999.9925 -> 75,000
  [10000000, 'tier-3', 50, 50000, 400000],
  [15000000, 'tier-3', 50, 75000, 600000],
];
for (const [n, id, bps, monthly, total] of BOUNDARIES) {
  test(`${INR(n)} -> ${bps == null ? 'fixed ₹2,000' : C.formatPercent(bps / 100)} -> ${INR(monthly)}/month, ${INR(total)} over 8 months`, () => {
    const f = est(n);
    assert.equal(f.tier.id, id);
    assert.equal(f.bps, bps);
    assert.equal(f.fixed, bps == null);
    assert.equal(f.monthlyFee, monthly);
    assert.equal(f.totalFee, total);
    assert.equal(f.serviceMonths, 12);
    assert.equal(f.belowStandard, n < 200000);
  });
}
test('₹0 -> no fee result', () => { assert.equal(est(0), null); assert.equal(C.calculate(0, []).results, null); });
test('empty, negative and invalid amounts -> no fee result', () => {
  for (const v of [null, undefined, '', -1, -200000, NaN, Infinity, '1000000']) assert.equal(est(v), null, String(v));
});
test('₹10,00,000.01 -> 0.75% (paise above the boundary)', () => assert.equal(est(1000000.01).bps, 75));
test('₹1,99,999.99 -> still the fixed fee', () => { const f = est(199999.99); assert.equal(f.fixed, true); assert.equal(f.monthlyFee, 2000); });
test('below ₹2 lakh the fee is fixed, not a percentage (₹1 and ₹1,99,999 pay the same)', () => {
  assert.equal(est(1).monthlyFee, est(199999).monthlyFee);
  assert.equal(est(1).percentLabel, null);
  assert.equal(est(50000).rateLabel, 'Fixed ₹2,000/month');
});
test('below ₹2 lakh is flagged for the application message (never an error)', () => {
  const r = C.calculate(1.5 * L, []);
  assert.equal(r.ok, true); assert.equal(r.error, null); assert.equal(r.results.fee.belowStandard, true);
  assert.equal(C.calculate(2 * L, []).results.fee.belowStandard, false);
});
test('the rate applies to the whole amount, not as slabs', () => {
  // A marginal slab would give 10,000 + 0.75% of 15 lakh = 21,250 a month; the agreed rule gives 18,750.
  assert.equal(est(25 * L).monthlyFee, 18750);
  assert.notEqual(est(25 * L).monthlyFee, 21250);
});
test('₹99,99,999: ₹74,999.9925 a month is shown as ₹75,000; total ₹6,00,000', () => {
  const f = est(9999999);
  assert.equal(f.monthlyExact, 74999.9925);
  assert.equal(f.monthlyFee, 75000);
  assert.equal(f.totalFee, 600000);
});
test('the total uses the ROUNDED monthly fee (₹2,00,040: ₹2,000.40 -> ₹2,000 × 8 = ₹16,000, not ₹16,003)', () => {
  const f = est(200040);
  assert.equal(f.monthlyExact, 2000.4);
  assert.equal(f.monthlyFee, 2000);
  assert.equal(f.totalFee, 16000);
  assert.notEqual(f.totalFee, Math.round(f.monthlyExact * 8));
});
test('paise: ₹2,00,050.50 -> 1% = ₹2,000.505 -> ₹2,001 a month, ₹16,008 total', () => { const f = est(200050.5); assert.equal(f.monthlyFee, 2001); assert.equal(f.totalFee, 16008); });
test('there are 8 payments, not 12: total = monthly × 8, never × 12', () => {
  for (const [n] of EXAMPLES) { const f = est(n); assert.notEqual(f.totalFee, f.monthlyFee * 12); assert.equal(f.totalFee / f.monthlyFee, 8); }
});
test('documented threshold effect: the fee falls just above ₹10 lakh and at ₹1 crore', () => {
  assert.equal(est(10 * L).totalFee - est(1000001).totalFee, 20000);   // ₹80,000 -> ₹60,000
  assert.equal(est(9999999).totalFee - est(CR).totalFee, 200000);     // ₹6,00,000 -> ₹4,00,000
  assert.equal(est(1333266).monthlyFee, 9999);                        // ₹10,00,001 – ₹13,33,266 pay less a month than ₹10 lakh
  assert.equal(est(1333267).monthlyFee, 10000);                       // first rupee amount above ₹10 lakh back to ₹10,000 a month
  assert.equal(est(14999899).monthlyFee, 74999);                      // ₹1 crore – ₹1,49,99,899 pay less a month than ₹99,99,999
  assert.equal(est(14999900).monthlyFee, 75000);
});
test('large amounts: ₹500 crore -> 0.50% = ₹2,50,00,000 a month, ₹20,00,00,000 in total', () => {
  const f = est(5e9); assert.equal(f.monthlyFee, 2.5e7); assert.equal(f.totalFee, 2e8); assert.equal(INR(f.monthlyFee), '₹2,50,00,000'); assert.equal(INR(f.totalFee), '₹20,00,00,000');
});
test('largest accepted amount (₹1,000 crore) stays exact', () => { const f = est(1e10); assert.equal(f.monthlyFee, 5e7); assert.equal(f.totalFee, 4e8); });
test('tier ids', () => {
  assert.equal(C.feeTier(1).id, 'tier-0');
  assert.equal(C.feeTier(2 * L).id, 'tier-1');
  assert.equal(C.feeTier(10 * L).id, 'tier-1');
  assert.equal(C.feeTier(10 * L + 1).id, 'tier-2');
  assert.equal(C.feeTier(CR - 1).id, 'tier-2');
  assert.equal(C.feeTier(CR).id, 'tier-3');
  assert.equal(C.feeTier(1e10).id, 'tier-3');
});
test('monthlyFee() matches feeEstimate()', () => { const m = C.monthlyFee(25 * L); assert.equal(m.amount, 18750); assert.equal(m.percentLabel, '0.75%'); });

console.log('calculate(): results, empty and invalid input');
test('valid amount returns the settlement scenario and the fee separately (never combined)', () => {
  const r = C.calculate(10 * L, ['personal']);
  assert.equal(r.ok, true);
  assert.equal(r.results.settlement.amount, 3 * L);
  assert.equal(r.results.fee.monthlyFee, 10000);
  assert.equal(r.results.fee.totalFee, 80000);
  assert.deepEqual(Object.keys(r.results), ['outstanding', 'settlement', 'fee']);
  assert.ok(!('total' in r.results) && !('payable' in r.results) && !('savings' in r.results));
  // The fee is never mixed into the settlement amount.
  assert.equal(r.results.settlement.amount, C.settlementScenario(10 * L).amount);
});
test('the settlement scenario is unchanged by the fee policy (30% of the total, for every example)', () => {
  for (const [n] of EXAMPLES) assert.equal(C.calculate(n, []).results.settlement.amount, Math.round(n * 0.3));
});
test('empty input -> "required", no results', () => { const r = C.calculate(null, []); assert.equal(r.error, 'required'); assert.equal(r.results, null); });
test('zero -> error, no results (no misleading ₹0)', () => { const r = C.calculate(0, []); assert.equal(r.error, 'zero'); assert.equal(r.results, null); });
test('negative -> error, no results', () => { const r = C.calculate(-5000, []); assert.equal(r.error, 'negative'); assert.equal(r.results, null); });
test('NaN / non-number -> invalid', () => { assert.equal(C.calculate(NaN, []).error, 'invalid'); assert.equal(C.calculate('1000', []).error, 'invalid'); });
test('very large amounts: ₹500 crore works exactly', () => {
  const r = C.calculate(5e9, []).results;
  assert.equal(r.settlement.amount, 1.5e9); assert.equal(r.fee.monthlyFee, 2.5e7); assert.equal(r.fee.percentLabel, '0.50%');
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
test('short lakh / crore labels for prose', () => {
  assert.deepEqual([2 * L, 10 * L, 25 * L, CR, 1.5 * CR, 99999].map(C.formatShortINR), ['₹2 lakh', '₹10 lakh', '₹25 lakh', '₹1 crore', '₹1.5 crore', '₹99,999']);
});
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
  import { expandCalcTokens, calculator, calculatorPromo } from ${JSON.stringify('file://' + path.join(__dirname, '..', 'src', 'templates.mjs'))};
  const t = (s) => expandCalcTokens(s);
  console.log(JSON.stringify({
    pct: t('<!-- lf:calc-percent -->'),
    ex: t('<!-- lf:calc-fee-example 2500000 -->'),
    exFixed: t('<!-- lf:calc-fee-example 150000 -->'),
    sum: t('<!-- lf:calc-fee-summary -->'),
    answer: t('<!-- lf:calc-fee-answer -->'),
    values: t('<!-- lf:calc-value payment-months -->|<!-- lf:calc-value service-months -->|<!-- lf:calc-value min-standard -->|<!-- lf:calc-value min-standard-short -->|<!-- lf:calc-value below-fee -->|<!-- lf:calc-value below-total -->'),
    feeExamples: t('<!-- lf:calc-fee-examples 150000 1000000 -->'),
    settleExamples: t('<!-- lf:calc-settlement-examples 1000000 -->'),
    widget: calculator({ h: 2 }),
    promo: calculatorPromo(),
  }));
`], { encoding: 'utf8' });
const T = JSON.parse(tplCheck.stdout || '{}');
const plain = (h) => h.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
test('tokens: percent, fee example and summary', () => {
  assert.equal(T.pct, '30%');
  assert.equal(T.ex, '₹25,00,000 × 0.75% = ₹18,750 per month, and ₹18,750 × 8 months = ₹1,50,000 in total');
  assert.equal(T.exFixed, '₹1,50,000 is below ₹2,00,000, so the fee is a fixed ₹2,000 per month, and ₹2,000 × 8 months = ₹16,000 in total');
  assert.equal(T.sum, 'a fixed ₹2,000 per month (below ₹2,00,000), 1% per month (₹2,00,000 to ₹10,00,000 inclusive), 0.75% per month (above ₹10,00,000 and below ₹1,00,00,000) and 0.50% per month (₹1,00,00,000 and above)');
});
test('direct answer matches the approved wording exactly', () => {
  assert.equal(T.answer, 'Loan Free Financial Services calculates its professional fee using the total outstanding loan amount. For outstanding amounts below ₹2 lakh, the fixed fee is ₹2,000 per month. From ₹2 lakh to ₹10 lakh, the monthly fee is 1%; above ₹10 lakh and below ₹1 crore, it is 0.75%; and at ₹1 crore or above, it is 0.50%. The applicable monthly fee is payable for 8 months, while services are provided for 12 months.');
});
test('value tokens', () => assert.equal(T.values, '8|12|₹2,00,000|₹2 lakh|₹2,000|₹16,000'));
test('fee examples table: monthly fee, payment plan, total and service period', () => {
  const x = plain(T.feeExamples);
  assert.match(x, /₹1,50,000 Fixed fee ₹2,000 ₹2,000 × 8 months ₹16,000 12 months/);
  assert.match(x, /₹10,00,000 1% ₹10,000 ₹10,000 × 8 months ₹80,000 12 months/);
});
test('settlement examples table is separate and unchanged (30%)', () => assert.match(plain(T.settleExamples), /₹10,00,000 ₹3,00,000/));
test('widget: fee estimate section, four bands, 8-month plan and 12-month coverage', () => {
  const w = T.widget;
  assert.match(w, /Your Loan Free Service Fee Estimate/);
  for (const id of ['tier-0', 'tier-1', 'tier-2', 'tier-3']) assert.ok(w.includes(`data-tier="${id}"`), id);
  assert.match(plain(w), /Pay the applicable monthly fee for 8 months\./);
  assert.match(plain(w), /12 months of service/);
  assert.match(plain(w), /Payment duration 8 months Service duration 12 months/);
  assert.match(plain(w), /Receive service coverage for 12 months while paying the applicable professional fee for only 8 months\./);
  assert.match(plain(w), /Why Do We Charge for 8 Months and Provide 12 Months of Service\?/);
});
test('widget: below-₹2-lakh application message (hidden until needed)', () => {
  assert.match(T.widget, /data-r="below-note" hidden/);
  assert.match(plain(T.widget), /Your outstanding amount is below our standard ₹2 lakh service threshold\. You can still submit an application for consideration\. Our fixed professional fee for this category is ₹2,000 per month for 8 months, with service coverage for 12 months\./);
});
test('widget: CTA and fee disclaimer', () => {
  const w = plain(T.widget);
  assert.match(w, /Discuss Your Loan Settlement Options/);
  assert.match(w, /Speak with our team to understand the service process, applicable fees and options for your loan account\./);
  assert.match(w, /Get a Free Consultation/);
  assert.match(w, /Talk to Us on WhatsApp/);
  assert.match(w, /Fee Estimate Disclaimer: The professional fee shown is an estimate based on the total outstanding loan amount and the fee structure provided by Loan Free Financial Services\. The applicable monthly fee is payable for 8 months, while the service period is 12 months\./);
  assert.match(w, /Important Disclaimer: This calculator is for educational and illustrative purposes only\./); // existing disclaimer kept
});
test('copy never promises 12 instalments, a free service or a guaranteed settlement', () => {
  const all = plain(T.widget + T.answer + T.promo + T.feeExamples);
  // "Loan Free" is the business name, so "Loan Free Service Fee" is not a claim of a free service.
  const bad = /12 (monthly )?(payments|instalments|installments|EMIs)|× 12 months|(?<!Loan )free (service|months?)\b|guaranteed saving/i;
  assert.ok(!bad.test(all), String(all.match(bad)));
  // Guarantees appear only in negated form (the existing disclaimer says "not a guaranteed settlement offer").
  assert.match(all, /This fee does not guarantee loan settlement, lender acceptance, a particular waiver amount or a specific timeline\./);
  for (const m of all.matchAll(/guarantee[ds]?\b/gi)) assert.match(all.slice(Math.max(0, m.index - 50), m.index), /\b(not|no)\b/i, all.slice(m.index - 40, m.index + 30));
});
const pageSrc = fs.readFileSync(path.join(__dirname, '..', 'src', 'pages', 'settlement-calculator.html'), 'utf8');
test('page: literal figures in metadata and questions match the configuration', () => {
  const P = C.CONFIG.PAYMENT_MONTHS, S = C.CONFIG.SERVICE_MONTHS;
  assert.ok(pageSrc.includes(`${P}-month payment plan and ${S}-month service coverage`), 'meta description');
  assert.ok(pageSrc.includes(`Why do I pay for ${P} months but receive ${S} months of service?`), 'FAQ question');
  assert.ok(pageSrc.includes(`below ${C.formatShortINR(C.CONFIG.MIN_STANDARD_OUTSTANDING)}?`), 'FAQ questions on the threshold');
  assert.ok(!pageSrc.includes('lf:calc-examples'), 'old combined examples token removed');
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
