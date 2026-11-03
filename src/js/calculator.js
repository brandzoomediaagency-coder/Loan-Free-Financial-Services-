/* Loan Settlement & Legal Fee Calculator.
 *
 * The visitor enters one amount (total outstanding across their loans) and, optionally, the loan
 * types that apply. The calculator shows two SEPARATE figures:
 *   1. an illustrative settlement scenario at a single reference percentage (CONFIG below) —
 *      not a lender offer, prediction or guarantee;
 *   2. the professional fee under the business's stated fee structure (CONFIG below).
 * They are never added together into one payable amount.
 *
 * Every business number lives in CONFIG. src/templates.mjs reads the same object when the site is
 * built, so the page text, fee table and FAQ always match the arithmetic here.
 *
 * Privacy: everything is calculated in the browser. Amounts and loan types are never sent to a
 * server, analytics or advertising, never written to localStorage/sessionStorage, cookies or the
 * URL, never logged, and never attached to WhatsApp messages.
 *
 * The same file is loaded by the page (classic script), by the build (src/templates.mjs) and by
 * tools/test-calculator.cjs.
 */
(function (root, factory) {
    var api = factory();
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.LFCalc = api;
    if (typeof document !== 'undefined') {
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { api.mount(document); });
        else api.mount(document);
    }
})(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    /* ------------------------------------------------------------ business configuration
     * Change these values only on written instruction from the business, then rebuild and run
     * node tools/test-calculator.cjs (the tests pin the agreed examples).
     */
    var CONFIG = {
        // Illustrative settlement scenario: a single reference percentage supplied by the business.
        // It is not a minimum, an average or a prediction. If a verified range is supplied later,
        // replace this with that range and update the page copy.
        SETTLEMENT_SCENARIO_PERCENT: 30,

        // Professional fee: FLAT-RATE tiers. The rate of the tier the TOTAL falls in applies to the
        // ENTIRE amount (this is not a progressive / marginal slab). Rates are in basis points
        // (100 = 1%) so the arithmetic stays exact. Tiers are checked in order; `max` is the upper
        // bound of the tier and `maxInclusive` says whether an amount exactly equal to it belongs here.
        FEE_TIERS: [
            { id: 'tier-1', bps: 100, max: 1000000, maxInclusive: true, label: 'Up to and including ₹10,00,000' },
            { id: 'tier-2', bps: 75, max: 10000000, maxInclusive: false, label: 'Above ₹10,00,000 and below ₹1,00,00,000' },
            { id: 'tier-3', bps: 50, max: Infinity, maxInclusive: false, label: '₹1,00,00,000 and above' }
        ],

        // Guard against typing errors only (₹1,000 crore). It is not a business limit.
        MAX_AMOUNT: 1e10,

        // Loan categories offered in the multi-select. Settlement services cover UNSECURED loans only,
        // so secured loans (home, vehicle, loan against property, gold) are deliberately not offered.
        // Categories that can be either secured or unsecured are labelled "(unsecured)". Selecting a
        // category never implies that an account qualifies for settlement.
        LOAN_TYPES: [
            { id: 'credit-card', label: 'Credit Card Outstanding' },
            { id: 'personal', label: 'Personal Loan' },
            { id: 'business', label: 'Business Loan (unsecured)' },
            { id: 'education', label: 'Education Loan (unsecured)' },
            { id: 'consumer-durable', label: 'Consumer Durable Loan' },
            { id: 'overdraft', label: 'Overdraft / Cash Credit (unsecured)' },
            { id: 'other', label: 'Other unsecured loan' }
        ]
    };

    var MESSAGES = {
        required: 'Please enter your total outstanding loan amount.',
        invalid: 'Please enter the amount in numbers only, for example 10,00,000.',
        negative: 'The amount cannot be negative.',
        zero: 'Please enter an amount greater than zero.',
        'too-large': 'That amount looks too large. Please check it.'
    };

    /* ------------------------------------------------------------ parsing and validation */
    var PREFIX = /^(₹|rs\.?|inr)\s*/i;

    // Accepts "1000000", "10,00,000", "₹ 10,00,000", "Rs. 1000000" and decimals ("1500.50").
    // Returns { value } or { empty: true } or { error: key, message }.
    function parseAmount(raw) {
        var s = String(raw == null ? '' : raw).trim();
        if (s === '') return { value: null, empty: true };
        s = s.replace(PREFIX, '').replace(/[\s,]/g, '');
        if (/^-\d*\.?\d+$/.test(s) || /^-\d+\.?$/.test(s)) return fail('negative');
        if (!/^\d*\.?\d+$/.test(s) && !/^\d+\.$/.test(s)) return fail('invalid');
        var n = Number(s);
        if (!isFinite(n)) return fail('invalid');
        var v = Math.round(n * 100) / 100;
        var err = validateAmount(v);
        return err ? fail(err) : { value: v };
    }
    function fail(key) { return { value: null, error: key, message: MESSAGES[key] }; }

    // Returns null when valid, otherwise an error key.
    function validateAmount(amount) {
        if (amount == null || amount === '') return 'required';
        if (typeof amount !== 'number' || !isFinite(amount)) return 'invalid';
        if (amount < 0) return 'negative';
        if (amount === 0) return 'zero';
        if (amount > CONFIG.MAX_AMOUNT) return 'too-large';
        return null;
    }

    /* ------------------------------------------------------------ calculations */
    // Amounts are handled in paise (integers) so that results are exact before display rounding.
    function toPaise(amount) { return Math.round(amount * 100); }

    // Illustrative settlement amount = total outstanding × SETTLEMENT_SCENARIO_PERCENT / 100,
    // rounded to the nearest rupee.
    function settlementScenario(amount) {
        var pct = CONFIG.SETTLEMENT_SCENARIO_PERCENT;
        var exact = toPaise(amount) * pct / 10000; // rupees
        return { percent: pct, percentLabel: formatPercent(pct), exact: exact, amount: Math.round(exact) };
    }

    // The tier whose rate applies to the whole amount.
    function feeTier(amount) {
        var tiers = CONFIG.FEE_TIERS;
        for (var i = 0; i < tiers.length; i++) {
            var t = tiers[i];
            if (amount < t.max || (t.maxInclusive && amount === t.max)) return t;
        }
        return tiers[tiers.length - 1];
    }

    // Professional fee = total outstanding × the tier rate, applied to the ENTIRE amount,
    // rounded to the nearest rupee. Taxes or other charges are NOT added.
    function legalFee(amount) {
        var tier = feeTier(amount);
        var exact = toPaise(amount) * tier.bps / 1000000; // paise × bps / (100 × 10,000) = rupees
        return { tier: tier, bps: tier.bps, percent: tier.bps / 100, percentLabel: formatPercent(tier.bps / 100), exact: exact, amount: Math.round(exact) };
    }

    // Keeps only known loan types, without duplicates, in the order they are listed.
    function normaliseLoanTypes(ids) {
        var wanted = {};
        (ids || []).forEach(function (id) { wanted[id] = true; });
        return CONFIG.LOAN_TYPES.filter(function (t) { return wanted[t.id]; }).map(function (t) { return t.id; });
    }
    function loanTypeLabels(ids) {
        return normaliseLoanTypes(ids).map(function (id) { return typeById(id).label; });
    }
    function typeById(id) {
        for (var i = 0; i < CONFIG.LOAN_TYPES.length; i++) if (CONFIG.LOAN_TYPES[i].id === id) return CONFIG.LOAN_TYPES[i];
        return null;
    }

    // amount: a number (or null when empty). loanTypes: array of ids.
    // The settlement scenario and the fee are returned separately and never combined.
    function calculate(amount, loanTypes) {
        var types = normaliseLoanTypes(loanTypes);
        var err = validateAmount(amount);
        var out = { ok: !err, error: err, message: err ? MESSAGES[err] : '', loanTypes: types, results: null };
        if (!err) out.results = { outstanding: amount, settlement: settlementScenario(amount), fee: legalFee(amount) };
        return out;
    }

    /* ------------------------------------------------------------ formatting */
    // ₹ with Indian digit grouping. Whole rupees unless the amount has paise.
    function formatINR(n) {
        if (n == null || !isFinite(n)) return '—';
        var whole = Math.abs(n % 1) < 0.005;
        try {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
        } catch (e) {
            return '₹' + groupIndian(String(Math.round(n)));
        }
    }
    // 1 -> "1%", 0.75 -> "0.75%", 0.5 -> "0.50%", 30 -> "30%".
    function formatPercent(p) {
        return (p % 1 === 0 ? String(p) : p.toFixed(2)) + '%';
    }
    // "1000000" -> "10,00,000" (works on digit strings of any length, no rounding).
    function groupIndian(digits) {
        if (digits.length <= 3) return digits;
        var last3 = digits.slice(-3);
        var rest = digits.slice(0, -3);
        return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
    }

    // Live formatting for the amount box. Returns the regrouped text, or null when the text contains
    // characters that are not part of an amount (the box is then left as typed and an error shown).
    function formatAmountInput(raw) {
        var s = String(raw == null ? '' : raw);
        var m = s.replace(/^\s+/, '').replace(PREFIX, '').match(/^([\d,\s]*)(\.(\d*))?\s*$/);
        if (!m) return null;
        var intDigits = m[1].replace(/\D/g, '').replace(/^0+(?=\d)/, '');
        var hasDot = m[2] != null;
        if (!intDigits && !hasDot) return '';
        if (!intDigits) intDigits = '0';
        return groupIndian(intDigits) + (hasDot ? '.' + m[3].slice(0, 2) : '');
    }

    /* ------------------------------------------------------------ browser binding */
    function mount(doc) {
        var rootEl = doc.querySelector('[data-lf-calc]');
        if (!rootEl || rootEl.getAttribute('data-ready')) return;
        rootEl.setAttribute('data-ready', '1');

        var $ = function (sel, r) { return (r || rootEl).querySelector(sel); };
        var $$ = function (sel, r) { return Array.prototype.slice.call((r || rootEl).querySelectorAll(sel)); };
        var form = $('[data-calc-form]');
        var input = $('[data-calc-amount]');
        var errEl = $('[data-calc-amount-error]');
        var out = $('[data-calc-results]');
        var live = $('[data-r="live"]');
        var ms = $('[data-lf-ms]');
        var msBtn = $('[data-ms-toggle]', ms);
        var msPanel = $('[data-ms-panel]', ms);
        var msValue = $('[data-ms-value]', ms);
        var boxes = $$('input[type=checkbox][data-loan-type]', ms);
        var chips = $('[data-r="chips"]');
        var chipTpl = $('template[data-chip-template]');
        var tracked = false;
        var liveTimer;
        var showRequired = false;

        function set(key, text) {
            $$('[data-r="' + key + '"]').forEach(function (el) { el.textContent = text; });
        }
        function selected() {
            return boxes.filter(function (b) { return b.checked; }).map(function (b) { return b.value; });
        }

        /* ---- amount box */
        // Regroup digits as the visitor types, keeping the caret beside the same digit.
        function reformat() {
            var raw = input.value;
            var next = formatAmountInput(raw);
            if (next == null || next === raw) return;
            var caret = input.selectionStart == null ? raw.length : input.selectionStart;
            var right = (raw.slice(caret).match(/[\d.]/g) || []).length;
            input.value = next;
            if (doc.activeElement !== input || typeof input.setSelectionRange !== 'function') return;
            var pos = next.length;
            if (right > 0) {
                var seen = 0;
                for (var i = next.length - 1; i >= 0; i--) {
                    if (/[\d.]/.test(next.charAt(i)) && ++seen === right) { pos = i; break; }
                }
                if (seen < right) pos = 0;
            }
            while (pos > 0 && next.charAt(pos - 1) === ',') pos--;
            input.setSelectionRange(pos, pos);
        }

        /* ---- loan type multi-select */
        function isOpen() { return !msPanel.hidden; }
        function setOpen(open, focusEl) {
            msPanel.hidden = !open;
            msBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
            ms.classList.toggle('is-open', open);
            if (open && typeof msPanel.scrollIntoView === 'function') {
                // Keep the whole list on screen (CSS scroll-margin leaves room for the mobile call bar).
                msPanel.scrollIntoView({ block: 'nearest' });
            }
            if (focusEl) focusEl.focus();
        }
        msBtn.addEventListener('click', function (e) {
            var open = !isOpen();
            // Opened from the keyboard (detail 0): move focus to the first option.
            setOpen(open, open && e.detail === 0 ? boxes[0] : null);
        });
        doc.addEventListener('click', function (e) {
            if (isOpen() && !ms.contains(e.target)) setOpen(false);
        });
        ms.addEventListener('focusout', function (e) {
            if (isOpen() && e.relatedTarget && !ms.contains(e.relatedTarget)) setOpen(false);
        });
        ms.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && isOpen()) {
                e.preventDefault();
                e.stopPropagation();
                setOpen(false, msBtn);
                return;
            }
            var i = boxes.indexOf(doc.activeElement);
            if (i < 0) return;
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                e.preventDefault();
                boxes[(i + (e.key === 'ArrowDown' ? 1 : boxes.length - 1)) % boxes.length].focus();
            }
        });
        $('[data-ms-all]', ms).addEventListener('click', function () { boxes.forEach(function (b) { b.checked = true; }); update(); });
        $('[data-ms-clear]', ms).addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); update(); });
        $('[data-ms-done]', ms).addEventListener('click', function () { setOpen(false, msBtn); });
        boxes.forEach(function (b) { b.addEventListener('change', update); });

        // Selected types are shown as removable chips under the dropdown.
        if (chips) chips.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-remove]');
            if (!btn) return;
            var id = btn.getAttribute('data-remove');
            var all = $$('[data-remove]', chips);
            var at = all.indexOf(btn);
            boxes.forEach(function (b) { if (b.value === id) b.checked = false; });
            update();
            var rest = $$('[data-remove]', chips);
            (rest[Math.min(at, rest.length - 1)] || msBtn).focus();
        });

        function renderSelection(types) {
            var labels = loanTypeLabels(types);
            msValue.textContent = !labels.length ? 'Select loan types'
                : labels.length === 1 ? labels[0]
                    : labels.length === CONFIG.LOAN_TYPES.length ? 'All loan types selected'
                        : labels.length + ' loan types selected';
            ms.classList.toggle('has-value', labels.length > 0);
            boxes.forEach(function (b) { b.closest('.calc-ms-opt').classList.toggle('is-checked', b.checked); });
            if (chips && chipTpl) {
                chips.innerHTML = '';
                types.forEach(function (id, n) {
                    var li = chipTpl.content.firstElementChild.cloneNode(true);
                    li.querySelector('span').textContent = labels[n];
                    var x = li.querySelector('button');
                    x.setAttribute('data-remove', id);
                    x.setAttribute('aria-label', 'Remove ' + labels[n]);
                    chips.appendChild(li);
                });
                chips.hidden = !types.length;
            }
            // Results card 1: the selected types (no remove buttons).
            var list = $('[data-r="types"]', out);
            if (list) {
                list.innerHTML = '';
                labels.forEach(function (l) { var li = doc.createElement('li'); li.textContent = l; list.appendChild(li); });
                list.hidden = !labels.length;
            }
            var none = $('[data-r="types-none"]', out);
            if (none) none.hidden = labels.length > 0;
        }

        /* ---- results */
        function update() {
            var parsed = parseAmount(input.value);
            var types = selected();
            var calc = calculate(parsed.empty ? null : parsed.error ? NaN : parsed.value, types);
            var errKey = parsed.error || (calc.error === 'required' ? (showRequired ? 'required' : null) : calc.error);
            errEl.textContent = errKey ? MESSAGES[errKey] : '';
            errEl.hidden = !errKey;
            input.setAttribute('aria-invalid', errKey ? 'true' : 'false');
            renderSelection(types);

            var r = calc.results;
            out.classList.toggle('is-empty', !r);
            $$('[data-tier]', out).forEach(function (row) {
                var on = !!r && row.getAttribute('data-tier') === r.fee.tier.id;
                row.classList.toggle('is-active', on);
                if (on) row.setAttribute('aria-current', 'true'); else row.removeAttribute('aria-current');
            });
            if (!r) {
                ['outstanding', 'settlement', 'fee', 'fee-percent'].forEach(function (k) { set(k, '—'); });
                set('status', parsed.empty ? 'Enter your total outstanding loan amount to see your results.' : 'Please correct the amount above to see your results.');
                set('settlement-text', 'Shown as ' + formatPercent(CONFIG.SETTLEMENT_SCENARIO_PERCENT) + ' of your total outstanding, for illustration only.');
                set('fee-calc', 'The rate depends on your total outstanding amount.');
                set('fee-tier', '');
                announce(parsed.empty ? '' : MESSAGES[errKey || calc.error] || '');
                return;
            }
            var s = r.settlement, f = r.fee;
            set('status', 'Based on a total outstanding of ' + formatINR(r.outstanding) + '. Results update as you type.');
            set('outstanding', formatINR(r.outstanding));
            set('settlement', formatINR(s.amount));
            set('settlement-text', 'At a ' + s.percentLabel + ' illustrative scenario, the amount would be approximately ' + formatINR(s.amount) + '.');
            set('fee-percent', f.percentLabel);
            set('fee', formatINR(f.amount));
            set('fee-calc', formatINR(r.outstanding) + ' × ' + f.percentLabel + ' = ' + formatINR(f.amount));
            set('fee-tier', 'Your total falls in the tier “' + f.tier.label + '”, so ' + f.percentLabel + ' applies to the entire amount.');
            announce('Illustrative settlement scenario at ' + s.percentLabel + ': ' + formatINR(s.amount) + '. Our applicable professional fee at ' + f.percentLabel + ': ' + formatINR(f.amount) + '.');
            if (!tracked && typeof window !== 'undefined' && typeof window.gtag === 'function') {
                // One aggregate event per page view. No amounts, loan types, results or personal data.
                tracked = true;
                window.gtag('event', 'calculator_used');
            }
        }
        // Screen readers hear a short summary once typing pauses, not on every keystroke.
        function announce(text) {
            if (!live) return;
            clearTimeout(liveTimer);
            liveTimer = setTimeout(function () { live.textContent = text; }, 700);
        }

        input.addEventListener('input', function () {
            reformat();
            if (input.value.trim() === '') showRequired = false;
            update();
        });
        input.addEventListener('focusout', function () {
            var p = parseAmount(input.value);
            if (!p.empty && !p.error) {
                var next = formatAmountInput(input.value);
                if (next != null) input.value = next.replace(/\.$/, '');
            }
            update();
        });
        form.addEventListener('submit', function (e) {
            // Never navigate or put values in the URL.
            e.preventDefault();
            showRequired = true;
            update();
            if (input.getAttribute('aria-invalid') === 'true') { input.focus(); return; }
            if (typeof out.scrollIntoView === 'function') out.scrollIntoView({ block: 'start', behavior: 'smooth' });
            out.focus({ preventScroll: true });
        });
        update();
    }

    return {
        CONFIG: CONFIG,
        SETTLEMENT_SCENARIO_PERCENT: CONFIG.SETTLEMENT_SCENARIO_PERCENT,
        FEE_TIERS: CONFIG.FEE_TIERS,
        LOAN_TYPES: CONFIG.LOAN_TYPES,
        MAX_AMOUNT: CONFIG.MAX_AMOUNT,
        MESSAGES: MESSAGES,
        parseAmount: parseAmount,
        validateAmount: validateAmount,
        settlementScenario: settlementScenario,
        feeTier: feeTier,
        legalFee: legalFee,
        calculate: calculate,
        normaliseLoanTypes: normaliseLoanTypes,
        loanTypeLabels: loanTypeLabels,
        formatINR: formatINR,
        formatPercent: formatPercent,
        groupIndian: groupIndian,
        formatAmountInput: formatAmountInput,
        mount: mount
    };
});
