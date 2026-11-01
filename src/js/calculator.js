/* Loan Settlement Scenario Calculator — an educational budgeting tool.
 *
 * It does NOT predict what a lender will accept. The visitor enters every amount,
 * including any hypothetical settlement amount; nothing is suggested or prefilled.
 *
 * Privacy: everything is calculated in the browser. Values are never sent to a
 * server, analytics or advertising, never written to localStorage/sessionStorage,
 * cookies or the URL, never logged, and never attached to WhatsApp messages.
 *
 * The same file is loaded by the page (classic script) and by tools/test-calculator.cjs.
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

    var MAX_AMOUNT = 1e10; // ₹1,000 crore: anything larger is almost certainly a typing error
    var FIELDS = ['outstanding', 'income', 'expenses', 'commitments', 'buffer', 'savings', 'hypothetical'];
    var REQUIRED = { outstanding: true, income: true, expenses: true };

    /* ------------------------------------------------------------ parsing */
    // Accepts "1,50,000", "150000", "₹ 1.5 lakh" is NOT accepted (words), "1500.50" is.
    function parseAmount(raw) {
        var s = String(raw == null ? '' : raw).trim();
        if (s === '') return { value: null, empty: true };
        s = s.replace(/^(₹|rs\.?|inr)\s*/i, '').replace(/[\s,]/g, '');
        if (s.charAt(0) === '-' && /^-\d*\.?\d+$/.test(s)) return { value: null, error: 'Amounts cannot be negative.' };
        if (!/^\d*\.?\d+$/.test(s) && !/^\d+\.$/.test(s)) return { value: null, error: 'Please enter an amount using digits only, for example 150000.' };
        var n = Number(s);
        if (!isFinite(n)) return { value: null, error: 'Please enter a valid amount.' };
        if (n > MAX_AMOUNT) return { value: null, error: 'That amount looks too large. Please check it.' };
        return { value: Math.round(n * 100) / 100 };
    }

    /* ------------------------------------------------------------ calculation */
    // inputs: numbers (or null when empty). Returns { errors, notes, results }.
    function calculate(inputs) {
        var errors = {};
        var notes = [];
        var v = {};
        FIELDS.forEach(function (k) {
            var x = inputs[k];
            if (x == null || x === '') {
                if (REQUIRED[k]) errors[k] = 'This amount is needed.';
                v[k] = null;
            } else if (typeof x !== 'number' || !isFinite(x)) {
                errors[k] = 'Please enter a valid amount.';
                v[k] = null;
            } else if (x < 0) {
                errors[k] = 'Amounts cannot be negative.';
                v[k] = null;
            } else {
                v[k] = x;
            }
        });
        if (v.outstanding === 0) errors.outstanding = 'Enter the amount currently outstanding on the loan.';

        var base = !errors.outstanding && !errors.income && !errors.expenses;
        var results = null;
        if (base) {
            var commitments = v.commitments || 0;
            var buffer = v.buffer || 0;
            var savings = v.savings || 0;
            var rawCapacity = v.income - v.expenses - commitments - buffer;
            var capacity = Math.max(0, round2(rawCapacity));
            if (v.income === 0) notes.push({ type: 'info', key: 'zero-income', text: 'With no monthly income entered, the calculator cannot show any monthly capacity.' });
            else if (v.expenses > v.income) notes.push({ type: 'info', key: 'expenses-exceed', text: 'Your essential expenses are higher than your income, so this budget shows no monthly capacity.' });
            if (rawCapacity <= 0 && v.income > 0 && v.expenses <= v.income) notes.push({ type: 'info', key: 'zero-capacity', text: 'After expenses, other commitments and your safety buffer, the budget you entered does not currently show money available each month.' });

            results = {
                outstanding: v.outstanding,
                capacity: capacity,
                savings: savings,
                hypothetical: null,
                remaining: null,
                months: null,
                difference: null,
                progress: null,
                scenario: false,
            };

            var h = v.hypothetical;
            if (h != null && !errors.hypothetical) {
                if (h === 0) {
                    errors.hypothetical = 'Leave this empty, or enter an amount greater than zero.';
                } else if (h > v.outstanding) {
                    errors.hypothetical = 'This is more than the outstanding amount you entered. Please check both figures.';
                } else {
                    var remaining = Math.max(0, round2(h - savings));
                    results.hypothetical = h;
                    results.remaining = remaining;
                    results.difference = round2(v.outstanding - h);
                    results.progress = Math.min(1, savings / h);
                    results.scenario = true;
                    if (remaining === 0) {
                        results.months = 0;
                        notes.push({ type: 'info', key: 'savings-cover', text: 'The savings you entered already cover the amount in your scenario.' });
                    } else if (capacity > 0) {
                        results.months = Math.ceil(remaining / capacity);
                        if (results.months > 120) notes.push({ type: 'info', key: 'long', text: 'At this monthly capacity it would take more than 10 years to build the amount in your scenario.' });
                    } else {
                        results.months = null;
                    }
                }
            }
        }
        return { errors: errors, notes: notes, results: results };
    }

    function round2(n) { return Math.round(n * 100) / 100; }

    /* ------------------------------------------------------------ formatting */
    function formatINR(n) {
        if (n == null || !isFinite(n)) return '—';
        var whole = Math.abs(n % 1) < 0.005;
        try {
            return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }).format(n);
        } catch (e) {
            return '₹' + String(Math.round(n));
        }
    }
    function formatGrouped(n) {
        try { return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(n); } catch (e) { return String(n); }
    }
    function formatMonths(m) {
        if (m == null) return '—';
        if (m === 0) return 'Already covered';
        if (m > 120) return 'More than 10 years';
        var y = Math.floor(m / 12), r = m % 12;
        var parts = [];
        if (y) parts.push(y + (y === 1 ? ' year' : ' years'));
        if (r) parts.push(r + (r === 1 ? ' month' : ' months'));
        return m + (m === 1 ? ' month' : ' months') + (y ? ' (' + parts.join(' ') + ')' : '');
    }

    /* ------------------------------------------------------------ sliders */
    // Sliders move in 1,000 steps. Budget sliders use a cubic scale so small amounts get fine control
    // and large ones are still reachable; the hypothetical slider is linear from 0 to the outstanding amount.
    // Values snap to round figures; the very end of the scale returns the maximum exactly.
    var SLIDER_STEPS = 1000;
    function roundStep(v) { return v < 1e4 ? 100 : v < 1e5 ? 500 : v < 1e6 ? 1000 : v < 1e7 ? 10000 : 100000; }
    function sliderToValue(pos, max, linear) {
        if (!(max > 0)) return 0;
        var p = Math.max(0, Math.min(SLIDER_STEPS, Math.round(pos)));
        if (p === SLIDER_STEPS) return max;
        var t = p / SLIDER_STEPS;
        var raw = linear ? t * max : max * t * t * t;
        var step = linear ? (max < 1e5 ? 100 : max < 1e7 ? 1000 : 10000) : roundStep(raw);
        return Math.min(max, Math.round(raw / step) * step);
    }
    function valueToSlider(value, max, linear) {
        if (!(max > 0) || !(value > 0)) return 0;
        var r = Math.min(1, value / max);
        return Math.round((linear ? r : Math.cbrt(r)) * SLIDER_STEPS);
    }

    /* ------------------------------------------------------------ browser binding */
    function mount(doc) {
        var form = doc.querySelector('[data-lf-calc]');
        if (!form || form.getAttribute('data-ready')) return;
        form.setAttribute('data-ready', '1');
        var out = doc.querySelector('[data-lf-calc-results]');
        var tracked = false;
        var $ = function (sel, r) { return (r || doc).querySelector(sel); };

        function readAll() {
            var inputs = {}, parseErrors = {}, any = false;
            FIELDS.forEach(function (k) {
                var el = form.elements[k];
                if (!el) return;
                var p = parseAmount(el.value);
                if (!p.empty) any = true;
                if (p.error) parseErrors[k] = p.error;
                inputs[k] = p.value;
            });
            return { inputs: inputs, parseErrors: parseErrors, any: any };
        }

        function showFieldErrors(errs, touchedOnly) {
            FIELDS.forEach(function (k) {
                var el = form.elements[k];
                if (!el) return;
                var msgEl = doc.getElementById('err-' + k);
                var show = errs[k] && (!touchedOnly || el.getAttribute('data-touched'));
                el.setAttribute('aria-invalid', show ? 'true' : 'false');
                if (msgEl) { msgEl.textContent = show ? errs[k] : ''; msgEl.hidden = !show; }
            });
        }

        function set(key, text) {
            var el = out && out.querySelector('[data-r="' + key + '"]');
            if (el) el.textContent = text;
            // The form carries a short copy of the summary for small screens, where the results panel is further down.
            if (key === 'summary') { var mini = form.querySelector('[data-r="summary-mini"]'); if (mini) mini.textContent = text; }
        }

        function render(touchedOnly) {
            var read = readAll();
            var calc = calculate(read.inputs);
            var errs = {};
            Object.keys(calc.errors).forEach(function (k) { errs[k] = calc.errors[k]; });
            Object.keys(read.parseErrors).forEach(function (k) { errs[k] = read.parseErrors[k]; });
            showFieldErrors(errs, touchedOnly);
            if (!out) return;
            var r = calc.results;
            out.classList.toggle('is-empty', !r);
            out.classList.toggle('has-scenario', !!(r && r.scenario));
            var notesEl = $('[data-r="notes"]', out);
            if (notesEl) {
                notesEl.innerHTML = '';
                calc.notes.forEach(function (n) {
                    var li = doc.createElement('li');
                    li.textContent = n.text;
                    notesEl.appendChild(li);
                });
                notesEl.hidden = !calc.notes.length;
            }
            if (!r) {
                ['outstanding', 'capacity', 'hypothetical', 'savings', 'remaining', 'months', 'difference'].forEach(function (k) { set(k, '—'); });
                setProgress(0);
                set('summary', read.any ? 'Enter the outstanding amount, your monthly income and essential expenses to see your snapshot.' : 'Your results will appear here as you type.');
                return;
            }
            set('outstanding', formatINR(r.outstanding));
            set('capacity', formatINR(r.capacity) + ' / month');
            set('savings', formatINR(r.savings));
            set('hypothetical', r.scenario ? formatINR(r.hypothetical) : 'Not entered');
            set('remaining', r.scenario ? formatINR(r.remaining) : '—');
            set('months', r.scenario ? (r.months == null ? 'Not possible with this budget' : formatMonths(r.months)) : '—');
            set('difference', r.scenario ? formatINR(r.difference) : '—');
            setProgress(r.scenario ? r.progress : 0);
            set('progress-label', r.scenario ? Math.round(r.progress * 100) + '% of your scenario amount is covered by savings you entered' : 'Enter a hypothetical amount to see this');
            set('summary', r.scenario
                ? (r.months == null
                    ? 'In your scenario you would still need ' + formatINR(r.remaining) + ', but this budget shows no monthly capacity to build it.'
                    : r.months === 0 ? 'Your savings already cover the amount in your scenario.'
                        : 'At ' + formatINR(r.capacity) + ' a month, building ' + formatINR(r.remaining) + ' would take about ' + formatMonths(r.months) + ' in this illustration.')
                : 'Your estimated monthly capacity is ' + formatINR(r.capacity) + '. Add a hypothetical amount to explore a scenario.');
            if (!tracked && typeof window !== 'undefined' && typeof window.gtag === 'function') {
                // One aggregate event per page view. No amounts, results or personal data.
                tracked = true;
                window.gtag('event', 'calculator_used');
            }
        }

        function setProgress(p) {
            var bar = out && out.querySelector('[data-r="progress"]');
            if (bar) {
                bar.style.width = Math.round(Math.max(0, Math.min(1, p)) * 100) + '%';
                var track = bar.parentNode;
                if (track) track.setAttribute('aria-valuenow', String(Math.round(p * 100)));
            }
        }

        // Sliders: each [data-range-for] range mirrors one text field. Ranges have no name, so they are never
        // part of form data; the text field stays the source of truth.
        var ranges = Array.prototype.slice.call(form.querySelectorAll('[data-range-for]'));
        function rangeMax(range) {
            var m = range.getAttribute('data-max');
            if (m === 'outstanding') { var o = parseAmount(form.elements.outstanding.value); return o.error || o.empty ? 0 : o.value; }
            return Number(m);
        }
        function syncRange(range) {
            var field = form.elements[range.getAttribute('data-range-for')];
            var max = rangeMax(range);
            var linear = range.hasAttribute('data-linear');
            if (range.getAttribute('data-max') === 'outstanding') {
                range.disabled = !(max > 0);
                range.parentNode.classList.toggle('is-disabled', range.disabled);
                var note = range.closest('.calc-field').querySelector('.calc-hint-slider');
                if (note) note.hidden = !range.disabled;
            }
            var p = parseAmount(field.value);
            var unset = p.empty || !!p.error;
            range.value = String(unset ? 0 : valueToSlider(p.value, max, linear));
            range.setAttribute('aria-valuetext', unset ? 'Not set' : formatINR(p.value));
            range.parentNode.classList.toggle('is-unset', unset);
            range.style.setProperty('--fill', (Number(range.value) / SLIDER_STEPS * 100) + '%');
        }
        function syncRanges() { ranges.forEach(syncRange); }
        ranges.forEach(function (range) {
            range.addEventListener('input', function () {
                var name = range.getAttribute('data-range-for');
                var field = form.elements[name];
                var v = sliderToValue(Number(range.value), rangeMax(range), range.hasAttribute('data-linear'));
                // A hypothetical amount of zero means "not entered", so the slider's start clears the field.
                field.value = name === 'hypothetical' && v === 0 ? '' : formatGrouped(v);
                field.setAttribute('data-touched', '1');
                range.setAttribute('aria-valuetext', field.value ? formatINR(v) : 'Not set');
                range.parentNode.classList.toggle('is-unset', !field.value);
                range.style.setProperty('--fill', (Number(range.value) / SLIDER_STEPS * 100) + '%');
                if (name === 'outstanding') ranges.forEach(function (r) { if (r !== range) syncRange(r); });
                render(true);
            });
        });

        var timer;
        form.addEventListener('input', function (e) {
            if (e.target && e.target.type === 'range') return;
            if (e.target && e.target.name) e.target.setAttribute('data-touched', '1');
            syncRanges();
            clearTimeout(timer);
            timer = setTimeout(function () { render(true); }, 150);
        });
        form.addEventListener('focusout', function (e) {
            var el = e.target;
            if (!el || FIELDS.indexOf(el.name) < 0) return;
            el.setAttribute('data-touched', '1');
            var p = parseAmount(el.value);
            if (!p.empty && !p.error) el.value = formatGrouped(p.value);
            syncRanges();
            render(true);
        });
        form.addEventListener('submit', function (e) {
            // Never navigate or put values in the URL.
            e.preventDefault();
            FIELDS.forEach(function (k) { if (form.elements[k]) form.elements[k].setAttribute('data-touched', '1'); });
            render(false);
            var first = form.querySelector('[aria-invalid="true"]');
            if (first) first.focus();
            else if (out) out.focus();
        });
        form.addEventListener('reset', function () {
            setTimeout(function () {
                FIELDS.forEach(function (k) { if (form.elements[k]) form.elements[k].removeAttribute('data-touched'); });
                syncRanges();
                render(true);
                if (form.elements.outstanding) form.elements.outstanding.focus();
            }, 0);
        });
        syncRanges();
        render(true);
    }

    return { parseAmount: parseAmount, calculate: calculate, formatINR: formatINR, formatMonths: formatMonths, sliderToValue: sliderToValue, valueToSlider: valueToSlider, SLIDER_STEPS: SLIDER_STEPS, mount: mount, FIELDS: FIELDS, MAX_AMOUNT: MAX_AMOUNT };
});
