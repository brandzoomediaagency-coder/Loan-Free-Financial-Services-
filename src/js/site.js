/* Loan Free Financial Services — site behaviour (Phase 2).
 * Loaded with `defer` on every page. No dependencies.
 *
 * Privacy rule for tracking: events carry only non-identifying context
 * (which button, which form, whether the lead was saved). Names, phone
 * numbers, amounts, loan types and messages are never sent to Google
 * Analytics or Meta.
 */
(function () {
    'use strict';

    var CONSENT_KEY = 'lf_consent';
    var store = {
        get: function (k, session) { try { return (session ? sessionStorage : localStorage).getItem(k); } catch (e) { return null; } },
        set: function (k, v, session) { try { (session ? sessionStorage : localStorage).setItem(k, v); } catch (e) { /* storage blocked */ } }
    };
    var $ = function (sel, root) { return (root || document).querySelector(sel); };
    var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

    /* ------------------------------------------------------------ tracking */
    function track(name, params) {
        params = params || {};
        if (typeof window.gtag === 'function') window.gtag('event', name, params);
    }
    function trackMeta(name) {
        // Standard events only, with no parameters (see privacy rule above).
        if (typeof window.fbq === 'function') window.fbq('track', name);
    }
    function locationOf(el) {
        var host = el.closest('[data-lf-loc]');
        if (host) return host.getAttribute('data-lf-loc');
        if (el.closest('.hero-premium, .hero-page')) return 'hero';
        return 'content';
    }

    document.addEventListener('click', function (e) {
        var a = e.target.closest('a[href]');
        if (!a) return;
        var href = a.getAttribute('href');
        if (/^https:\/\/wa\.me\//.test(href)) {
            track('whatsapp_click', { link_location: locationOf(a) });
            trackMeta('Contact');
        } else if (/^tel:/.test(href)) {
            track('phone_call_click', { link_location: locationOf(a) });
            trackMeta('Contact');
        }
    });

    /* ------------------------------------------------------------ consent */
    var pixelLoaded = false;
    function loadMetaPixel() {
        var id = document.documentElement.getAttribute('data-meta-pixel');
        if (pixelLoaded || !id) return;
        pixelLoaded = true;
        /* eslint-disable */
        !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
        /* eslint-enable */
        // Turn off automatic button-click and page-metadata collection.
        window.fbq('set', 'autoConfig', false, id);
        window.fbq('init', id);
        window.fbq('track', 'PageView');
    }
    function applyConsent(choice, initial) {
        var granted = choice === 'all' ? 'granted' : 'denied';
        if (!initial && typeof window.gtag === 'function') {
            window.gtag('consent', 'update', { analytics_storage: granted, ad_storage: granted, ad_user_data: granted, ad_personalization: granted });
        }
        if (choice === 'all') loadMetaPixel();
    }
    var banner = $('#lf-consent');
    var saved = store.get(CONSENT_KEY);
    if (saved) applyConsent(saved, true);
    else if (banner) banner.hidden = false;
    $$('[data-consent]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var choice = btn.getAttribute('data-consent');
            store.set(CONSENT_KEY, choice);
            applyConsent(choice, false);
            if (banner) banner.hidden = true;
        });
    });
    $$('[data-lf-consent-open]').forEach(function (btn) {
        btn.addEventListener('click', function () { if (banner) { banner.hidden = false; $('button', banner).focus(); } });
    });

    /* ------------------------------------------------------------ navigation */
    var toggle = $('.mobile-toggle');
    var panel = $('#primary-menu');
    var mobileNav = window.matchMedia('(max-width: 1199px)');
    var setIcon = function (btn, id) { var u = $('use', btn); if (u) u.setAttribute('href', u.getAttribute('href').replace(/#.*$/, '#' + id)); };
    var subToggles = $$('.sub-toggle');
    var setSub = function (btn, open) {
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        btn.closest('.has-sub').classList.toggle('is-open', open);
    };
    var closeSubs = function (except) { subToggles.forEach(function (b) { if (b !== except) setSub(b, false); }); };
    var setMenu = function (open) {
        if (!toggle || !panel) return;
        panel.classList.toggle('is-open', open);
        document.body.classList.toggle('nav-open', open);
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', toggle.getAttribute(open ? 'data-label-close' : 'data-label-open'));
        setIcon(toggle, open ? 'x' : 'menu');
        if (!open) closeSubs();
    };
    if (toggle && panel) {
        toggle.addEventListener('click', function () { setMenu(!panel.classList.contains('is-open')); });
        $$('a', panel).forEach(function (l) { l.addEventListener('click', function () { setMenu(false); }); });
        mobileNav.addEventListener('change', function () { setMenu(false); });
    }
    // Sub-menus (Services, Resources): a disclosure button next to each top-level link.
    subToggles.forEach(function (btn) {
        var menu = document.getElementById(btn.getAttribute('aria-controls'));
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            var open = btn.getAttribute('aria-expanded') !== 'true';
            if (open && !mobileNav.matches) closeSubs(btn);
            setSub(btn, open);
        });
        if (menu) menu.addEventListener('focusout', function (e) {
            if (!mobileNav.matches && !btn.closest('.has-sub').contains(e.relatedTarget)) setSub(btn, false);
        });
    });
    document.addEventListener('click', function (e) { if (!mobileNav.matches && !e.target.closest('.has-sub')) closeSubs(); });
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape') return;
        // Mobile: one Escape closes the whole drawer. Desktop: it closes the open dropdown.
        if (panel && panel.classList.contains('is-open')) { setMenu(false); toggle.focus(); return; }
        var openBtn = subToggles.filter(function (b) { return b.getAttribute('aria-expanded') === 'true'; })[0];
        if (openBtn) { setSub(openBtn, false); openBtn.focus(); }
    });

    /* ------------------------------------------------------------ "On this page" rail */
    var tocBox = $('[data-doc-toc]');
    if (tocBox) {
        var tocBtn = $('.doc-toc-toggle', tocBox);
        var setToc = function (open) { tocBox.classList.toggle('is-open', open); tocBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); };
        tocBtn.addEventListener('click', function () { setToc(!tocBox.classList.contains('is-open')); });
        $$('ol a', tocBox).forEach(function (a) { a.addEventListener('click', function () { setToc(false); }); });
        if ('IntersectionObserver' in window) {
            var tocLinks = {};
            $$('ol a', tocBox).forEach(function (a) { tocLinks[a.getAttribute('href').slice(1)] = a; });
            var spy = new IntersectionObserver(function (entries) {
                entries.forEach(function (en) {
                    if (!en.isIntersecting) return;
                    Object.keys(tocLinks).forEach(function (k) { tocLinks[k].classList.toggle('is-current', k === en.target.id); });
                });
            }, { rootMargin: '-20% 0px -70% 0px' });
            Object.keys(tocLinks).forEach(function (id) { var h = document.getElementById(id); if (h) spy.observe(h); });
        }
    }

    /* ------------------------------------------------------------ accordions */
    $$('.accordion-header').forEach(function (header, i) {
        var panel = header.nextElementSibling;
        if (!panel) return;
        var id = panel.id || 'acc-panel-' + i;
        panel.id = id;
        header.setAttribute('aria-controls', id);
        header.setAttribute('aria-expanded', header.classList.contains('active') ? 'true' : 'false');
        header.addEventListener('click', function () {
            var open = header.getAttribute('aria-expanded') !== 'true';
            header.classList.toggle('active', open);
            panel.classList.toggle('active', open);
            header.setAttribute('aria-expanded', open ? 'true' : 'false');
        });
    });

    /* ------------------------------------------------------------ reveal on scroll */
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var reveals = $$('.reveal');
    if (reveals.length) {
        if (reduceMotion || !('IntersectionObserver' in window)) {
            reveals.forEach(function (el) { el.classList.add('is-visible'); });
        } else {
            var io = new IntersectionObserver(function (entries, obs) {
                entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-visible'); obs.unobserve(en.target); } });
            }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
            reveals.forEach(function (el) { io.observe(el); });
        }
    }

    /* ------------------------------------------------------------ testimonials marquee */
    $$('.marquee-wrapper').forEach(function (wrap) {
        // Clone cards for a seamless loop; clones are hidden from assistive tech.
        if (!reduceMotion) {
            $$('.marquee-track', wrap).forEach(function (track) {
                Array.prototype.slice.call(track.children).forEach(function (card) {
                    var c = card.cloneNode(true);
                    c.setAttribute('aria-hidden', 'true');
                    track.appendChild(c);
                });
            });
        }
        var btn = wrap.parentNode.querySelector('.marquee-toggle');
        if (!btn) return;
        btn.addEventListener('click', function () {
            var paused = wrap.classList.toggle('is-paused');
            btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
            btn.querySelector('span').textContent = paused ? btn.getAttribute('data-play') : btn.getAttribute('data-pause');
        });
        // Do not animate while off-screen.
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entries) {
                entries.forEach(function (en) { wrap.classList.toggle('is-offscreen', !en.isIntersecting); });
            }).observe(wrap);
        }
    });

    /* ------------------------------------------------------------ consultation dialog */
    var dialog = $('#consult');
    var lastFocus = null;
    function openConsult(source) {
        if (!dialog || dialog.open) return;
        lastFocus = document.activeElement;
        if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', '');
        store.set('lf_consult_seen', '1', true);
        track('consult_open', { trigger: source });
        var first = $('input:not([type=hidden]):not([tabindex="-1"])', dialog);
        if (first) first.focus();
    }
    function closeConsult() {
        if (!dialog) return;
        if (typeof dialog.close === 'function') dialog.close(); else dialog.removeAttribute('open');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.addEventListener('click', function (e) {
        var opener = e.target.closest('[data-lf-consult]');
        if (opener) { e.preventDefault(); openConsult('button'); return; }
        if (e.target.closest('[data-lf-close]')) closeConsult();
    });
    if (dialog) {
        dialog.addEventListener('click', function (e) { if (e.target === dialog) closeConsult(); });
        // Desktop only: offer the form once per session when the pointer leaves
        // towards the browser chrome, and never in the first 15 seconds or
        // after the visitor has started any form. Never automatic on mobile.
        var started = Date.now();
        var formTouched = false;
        document.addEventListener('focusin', function (e) { if (e.target.closest && e.target.closest('.lf-form')) formTouched = true; });
        var desktop = window.matchMedia('(min-width: 1024px) and (pointer: fine)').matches;
        if (desktop && document.body.getAttribute('data-page-type') !== 'contact') {
            document.addEventListener('mouseout', function (e) {
                if (e.relatedTarget || e.clientY > 0) return;
                if (formTouched || Date.now() - started < 15000 || store.get('lf_consult_seen', true)) return;
                openConsult('exit_intent');
            });
        }
    }
    if (location.hash === '#consult') openConsult('link');

    /* ------------------------------------------------------------ lead forms */
    var ENDPOINT = '/api/lead';
    var WA = document.documentElement.getAttribute('data-wa') || '917042538878';

    function fieldError(input) {
        var v = input.value.trim();
        if (input.required && input.type === 'checkbox' && !input.checked) return 'consent';
        if (input.required && !v) return 'required';
        if (input.name === 'phone' && v && !/^[6-9]\d{9}$/.test(v.replace(/\D/g, '').slice(-10))) return 'phone';
        if (input.name === 'name' && v && v.length < 2) return 'name';
        return '';
    }
    var MSG = {
        en: { required: 'Please fill in the highlighted fields.', phone: 'Please enter a valid 10-digit mobile number.', name: 'Please enter your name.', consent: 'Please tick the consent box so we can contact you.', busy: 'Please wait a moment and try again.' },
        hi: { required: 'कृपया चिह्नित जानकारी भरें।', phone: 'कृपया सही 10 अंकों का मोबाइल नंबर लिखें।', name: 'कृपया अपना नाम लिखें।', consent: 'संपर्क के लिए कृपया सहमति वाले बॉक्स पर टिक करें।', busy: 'कृपया थोड़ी देर बाद फिर कोशिश करें।' }
    };
    var lang = document.documentElement.lang === 'hi' ? 'hi' : 'en';

    // WhatsApp hand-off text. With `full`, every detail the visitor typed is
    // included so nothing has to be re-typed (used when the lead could not be
    // saved online and we send the visitor straight to WhatsApp instead).
    function waMessage(data, ref, full) {
        var hi = lang === 'hi';
        var lines = full
            ? [hi ? 'नमस्ते Loan Free, मुझे मुफ़्त और गोपनीय सलाह चाहिए। मेरी जानकारी:' : 'Hello Loan Free, I would like a free, confidential consultation. My details:']
            : [hi ? 'नमस्ते Loan Free, मैंने वेबसाइट पर सलाह के लिए अनुरोध भेजा है।' : 'Hello Loan Free, I have just requested a consultation on your website.'];
        if (ref) lines.push((hi ? 'संदर्भ: ' : 'Reference: ') + ref);
        if (data.name) lines.push((hi ? 'नाम: ' : 'Name: ') + data.name);
        if (full && data.phone) lines.push((hi ? 'मोबाइल: ' : 'Mobile: ') + data.phone);
        if (full && data.city) lines.push((hi ? 'शहर: ' : 'City: ') + data.city);
        if (data.topic) lines.push((hi ? 'विषय: ' : 'Topic: ') + data.topic);
        if (full && data.amount) lines.push((hi ? 'कुल बकाया लगभग: ' : 'Approx. total dues: ') + data.amount);
        if (full && data.contact) lines.push((hi ? 'संपर्क का तरीका: ' : 'Preferred contact: ') + data.contact);
        if (full && data.message) lines.push((hi ? 'संदेश: ' : 'Message: ') + data.message);
        return 'https://wa.me/' + WA + '?text=' + encodeURIComponent(lines.join('\n'));
    }

    $$('form[data-lf-form]').forEach(function (form) {
        var formId = form.getAttribute('data-lf-form');
        var wrap = form.closest('[data-lf-form-wrap]');
        var result = wrap && $('[data-lf-result]', wrap);
        var status = $('.form-status', form);
        var button = $('button[type=submit]', form);
        var loadedAt = Date.now();
        var started = false;
        form.addEventListener('input', function () {
            if (!started) { started = true; track('form_start', { form_id: formId }); }
        });

        function showResult(ok, data, ref) {
            if (!result) return;
            result.classList.toggle('is-fallback', !ok);
            $$('[data-ok]', result).forEach(function (el) { el.textContent = el.getAttribute(ok ? 'data-ok' : 'data-fail'); });
            $('[data-lf-ref]', result).textContent = ref ? (lang === 'hi' ? 'संदर्भ नंबर: ' : 'Reference: ') + ref : '';
            var wa = waMessage(data, ref, !ok);
            $('[data-lf-wa]', result).setAttribute('href', wa);
            form.hidden = true;
            result.hidden = false;
            result.focus();
            // Not saved online: send the visitor straight to WhatsApp with
            // everything they typed already in the message. The panel above
            // stays as a manual fallback if the browser blocks the redirect.
            if (!ok) {
                track('whatsapp_redirect', { link_location: 'form_fallback' });
                trackMeta('Contact');
                setTimeout(function () { window.location.href = wa; }, 250);
            }
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            var firstBad = null;
            var errorKind = '';
            $$('input, select, textarea', form).forEach(function (input) {
                if (input.closest('.hp-field')) return;
                var err = fieldError(input);
                input.setAttribute('aria-invalid', err ? 'true' : 'false');
                if (err && !firstBad) { firstBad = input; errorKind = err; }
            });
            if (firstBad) {
                status.textContent = MSG[lang][errorKind] || MSG[lang].required;
                firstBad.focus();
                return;
            }
            status.textContent = '';
            var data = {};
            new FormData(form).forEach(function (v, k) { data[k] = typeof v === 'string' ? v.trim() : v; });
            data.phone = String(data.phone || '').replace(/\D/g, '').slice(-10);
            data.page = location.pathname;
            data.lang = lang;
            data.elapsedMs = Date.now() - loadedAt;
            data.formId = formId;

            var label = $('span', button);
            var original = label.textContent;
            button.disabled = true;
            label.textContent = button.getAttribute('data-label-sending');

            var done = function (ok, ref) {
                button.disabled = false;
                label.textContent = original;
                track('form_submit', { form_id: formId, lead_saved: ok ? 'yes' : 'no' });
                if (ok) {
                    track('contact_enquiry', { form_id: formId });
                    trackMeta('Lead');
                }
                showResult(ok, data, ref);
            };

            var ctrl = 'AbortController' in window ? new AbortController() : null;
            var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 12000);
            fetch(ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                signal: ctrl ? ctrl.signal : undefined
            }).then(function (res) {
                return res.json().catch(function () { return {}; }).then(function (body) { return { res: res, body: body }; });
            }).then(function (r) {
                clearTimeout(timer);
                if (r.res.status === 429) { button.disabled = false; label.textContent = original; status.textContent = MSG[lang].busy; return; }
                done(Boolean(r.res.ok && r.body && r.body.ok), r.body && r.body.ref);
            }).catch(function () {
                clearTimeout(timer);
                done(false, null);
            });
        });
    });

    /* ------------------------------------------------------------ click-to-load map (contact) */
    $$('[data-load-map]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var box = btn.closest('.map-facade');
            var f = document.createElement('iframe');
            f.src = box.getAttribute('data-map-src');
            f.title = 'Map showing Tis Hazari Court, Delhi';
            f.loading = 'lazy';
            f.referrerPolicy = 'no-referrer-when-downgrade';
            box.innerHTML = '';
            box.appendChild(f);
        });
    });

    /* ------------------------------------------------------------ resource filters (blog index) */
    var filterBar = $('.filter-bar');
    if (filterBar) {
        var cards = $$('[data-category]');
        filterBar.addEventListener('click', function (e) {
            var btn = e.target.closest('button[data-filter]');
            if (!btn) return;
            var f = btn.getAttribute('data-filter');
            $$('button', filterBar).forEach(function (b) { b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'); });
            cards.forEach(function (c) { c.hidden = f !== 'all' && c.getAttribute('data-category').split(' ').indexOf(f) < 0; });
        });
        // Deep links such as /blog.html#topic-rights open the guides already filtered.
        var m = location.hash.match(/^#topic-([a-z]+)$/);
        var preset = m && $('button[data-filter="' + m[1] + '"]', filterBar);
        if (preset) preset.click();
    }
})();
