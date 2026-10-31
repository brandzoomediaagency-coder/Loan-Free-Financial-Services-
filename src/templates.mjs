// Shared page components. Every page is assembled from these by
// tools/build.mjs, so the header, footer, forms and CTAs stay identical
// site-wide. Icons are written as <i class="fas fa-NAME"> and converted to
// the SVG sprite by the build.
import { SITE, NAV, FOOTER_SERVICES, FOOTER_COMPANY } from './site.config.mjs';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const T = {
  en: {
    skip: 'Skip to main content',
    menuOpen: 'Open menu',
    consult: 'Free Consultation',
    home: 'Home',
    callNow: 'Call Now',
    whatsapp: 'WhatsApp',
    waDefault: 'Hi, I would like a free consultation about my loan situation.',
    footerAbout: 'A debt-resolution consultancy offering settlement negotiation support, documentation guidance and help responding to unfair recovery practices across India. We are not a lender.',
    services: 'Services',
    company: 'Company',
    contact: 'Contact',
    email: 'Email',
    phone: 'Phone',
    office: 'Office',
    hours: 'Office hours',
    cookieSettings: 'Cookie settings',
    rights: 'All rights reserved.',
    disclaimer: 'Disclaimer: Loan Free Financial Services provides consultation, negotiation support, documentation guidance and coordination with independent professionals where needed. We are not a lender, a bank, a credit bureau or a law firm, and we are not regulated or approved by the Reserve Bank of India. We do not encourage intentional default and do not guarantee any waiver, settlement outcome, timeline or credit-score result. Outcomes depend on lender policy, the amount outstanding, your circumstances and documentation.',
    ctaTitle: 'Talk through your options — confidentially',
    ctaText: 'A free first consultation. No obligation, and we never ask for OTPs, passwords or card numbers.',
    ctaPrimary: 'Get Free Consultation',
    ctaWa: 'WhatsApp Us',
  },
  hi: {
    skip: 'मुख्य सामग्री पर जाएँ',
    menuOpen: 'मेनू खोलें',
    consult: 'मुफ़्त सलाह',
    home: 'होम',
    callNow: 'कॉल करें',
    whatsapp: 'WhatsApp',
    waDefault: 'नमस्ते, मुझे अपने लोन के बारे में मुफ़्त सलाह चाहिए।',
    footerAbout: 'लोन सेटलमेंट, दस्तावेज़ों और रिकवरी से जुड़ी परेशानियों में मार्गदर्शन देने वाली कंसल्टेंसी। हम लोन नहीं देते।',
    services: 'सेवाएँ',
    company: 'कंपनी',
    contact: 'संपर्क',
    email: 'ईमेल',
    phone: 'फ़ोन',
    office: 'ऑफ़िस',
    hours: 'समय',
    cookieSettings: 'कुकी सेटिंग',
    rights: 'सर्वाधिकार सुरक्षित।',
    disclaimer: 'अस्वीकरण: Loan Free Financial Services सलाह, बातचीत में सहायता और दस्तावेज़ों पर मार्गदर्शन देती है। हम लोन देने वाली संस्था, बैंक, क्रेडिट ब्यूरो या लॉ फ़र्म नहीं हैं, और RBI द्वारा विनियमित या अनुमोदित नहीं हैं। हम जानबूझकर डिफ़ॉल्ट करने की सलाह नहीं देते और किसी छूट, नतीजे, समय-सीमा या क्रेडिट स्कोर की गारंटी नहीं देते। हर मामले का नतीजा अलग होता है।',
    ctaTitle: 'अपनी स्थिति पर गोपनीय बातचीत करें',
    ctaText: 'पहली सलाह मुफ़्त है। हम कभी OTP, पासवर्ड या कार्ड नंबर नहीं माँगते।',
    ctaPrimary: 'मुफ़्त सलाह लें',
    ctaWa: 'WhatsApp करें',
  },
};
export const t = (lang) => T[lang] || T.en;

export const waLink = (text) => `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(text)}`;

export function header(page) {
  const s = t(page.lang);
  const hiNav = page.lang === 'hi';
  const links = NAV.map((n) => {
    const active = page.path === n.href || (n.href === '/blog.html' && page.type === 'article') ? ' active" aria-current="page' : '';
    return `<li><a href="${n.href}" class="nav-link${active}">${hiNav ? n.hi : n.label}</a></li>`;
  }).join('\n            ');
  const langSwitch = page.alternates
    ? Object.entries(page.alternates).filter(([l]) => l !== page.lang)
        .map(([l, href]) => `<li><a href="${href}" class="nav-link nav-lang" hreflang="${l}" lang="${l}">${l === 'hi' ? 'हिन्दी' : 'English'}</a></li>`).join('')
    : '';
  return `<a href="#main" class="skip-link">${s.skip}</a>
<nav class="navbar" aria-label="Primary">
    <div class="container nav-container">
        <a href="/" class="logo" aria-label="${SITE.name} — ${s.home}">
            <img src="/assets/brand/logo-120.webp" alt="" class="nav-logo-img" width="52" height="52">
            <span class="brand-text"><span class="brand-name">LOAN FREE</span><span class="brand-sub">FINANCIAL SERVICES</span></span>
        </a>
        <ul class="nav-menu" id="primary-menu">
            ${links}${langSwitch}
        </ul>
        <button type="button" class="mobile-toggle" aria-label="${s.menuOpen}" aria-controls="primary-menu" aria-expanded="false"><i class="fas fa-bars"></i></button>
        <a href="#consult" data-lf-consult class="btn btn-primary nav-cta" data-lf-loc="header">${s.consult}</a>
    </div>
</nav>`;
}

export function footer(page) {
  const s = t(page.lang);
  const year = new Date().getFullYear();
  const li = (arr) => arr.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('');
  const socials = [
    ['facebook', 'facebook-f', 'Facebook'], ['instagram', 'instagram', 'Instagram'],
    ['linkedin', 'linkedin-in', 'LinkedIn'], ['youtube', 'youtube', 'YouTube'],
  ].filter(([k]) => SITE.social[k])
    .map(([k, icon, label]) => `<a href="${SITE.social[k]}" class="social-icon" target="_blank" rel="noopener" aria-label="${label}"><i class="fab fa-${icon}"></i></a>`).join('');
  return `<footer class="footer" data-lf-loc="footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-col">
                <p class="footer-heading">${SITE.name}</p>
                <p class="footer-about">${s.footerAbout}</p>
                <div class="social-icons">${socials}</div>
            </div>
            <div class="footer-col">
                <p class="footer-heading">${s.services}</p>
                <ul>${li(FOOTER_SERVICES)}</ul>
            </div>
            <div class="footer-col">
                <p class="footer-heading">${s.company}</p>
                <ul>${li(FOOTER_COMPANY)}${page.lang === 'en' ? '<li><a href="/hi/">हिन्दी गाइड</a></li>' : '<li><a href="/">English</a></li>'}</ul>
            </div>
            <div class="footer-col">
                <p class="footer-heading">${s.contact}</p>
                <div class="contact-item"><i class="fas fa-phone-volume"></i><div><strong>${s.phone}:</strong><br><a href="tel:${SITE.phoneE164}">${SITE.phoneDisplay}</a></div></div>
                <div class="contact-item"><i class="fas fa-envelope"></i><div><strong>${s.email}:</strong><br><a href="mailto:${SITE.email}">${SITE.email}</a></div></div>
                <div class="contact-item"><i class="fas fa-location-dot"></i><div><strong>${s.office}:</strong><br>${SITE.address.lines.join('<br>')}</div></div>
                <div class="contact-item"><i class="fas fa-clock"></i><div><strong>${s.hours}:</strong><br>${page.lang === 'hi' ? SITE.hoursDisplayHi : SITE.hoursDisplay}</div></div>
            </div>
        </div>
        <div class="footer-bottom">
            <p>&copy; ${year} ${SITE.name}. ${s.rights} · <a href="/sitemap.xml">Sitemap</a> · <button type="button" class="link-button" data-lf-consent-open>${s.cookieSettings}</button></p>
            <p class="disclaimer">${s.disclaimer}</p>
        </div>
    </div>
</footer>`;
}

export function breadcrumbs(page) {
  const s = t(page.lang);
  const home = page.lang === 'hi' ? ['होम', '/hi/'] : [s.home, '/'];
  const items = [home, ...(page.breadcrumbs || [])];
  const lis = items.map(([name, href], i) =>
    i === items.length - 1 || !href ? `<li aria-current="page">${esc(name)}</li>` : `<li><a href="${href}">${esc(name)}</a></li>`).join('');
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><div class="container"><ol>${lis}</ol></div></nav>`;
}

const FORM = {
  en: {
    name: 'Your name', phone: 'Mobile number', phoneHint: '10-digit Indian mobile number',
    city: 'City (optional)', topic: 'What do you need help with?', choose: 'Choose one',
    amount: 'Approximate total outstanding (optional)', prefer: 'Preferred contact',
    message: 'Anything else we should know? (optional)',
    messageHint: 'Please do not share account numbers, card numbers, OTPs or passwords.',
    consent: `I agree that ${SITE.name} may store these details and contact me by phone or WhatsApp about this enquiry, as described in the <a href="/privacy-policy.html">Privacy Policy</a>.`,
    submit: 'Request free consultation', sending: 'Sending…',
    successTitle: 'Thank you — your request is saved',
    successText: 'An advisor will contact you during office hours. You can also continue on WhatsApp now; your reference number is included in the message.',
    successWa: 'Continue on WhatsApp', successCall: 'Call us',
    fallbackTitle: 'We could not save your request online',
    fallbackText: 'Please continue on WhatsApp or call us — your details will open in the message so you do not have to type them again.',
    privacy: 'Confidential. We never sell your data, and form details are not sent to analytics or advertising platforms.',
    topics: ['Personal loan', 'Credit card dues', 'NBFC or app loan', 'Business / MSME loan', 'Recovery agent harassment', 'Loan app harassment', 'Legal notice / Section 138', 'Credit report after settlement', 'Several loans together', 'Something else'],
    amounts: ['Under ₹1 lakh', '₹1–5 lakh', '₹5–10 lakh', '₹10–25 lakh', 'Over ₹25 lakh', 'Prefer not to say'],
    contacts: ['WhatsApp', 'Phone call'],
  },
  hi: {
    name: 'आपका नाम', phone: 'मोबाइल नंबर', phoneHint: '10 अंकों का भारतीय मोबाइल नंबर',
    city: 'शहर (वैकल्पिक)', topic: 'आपको किस बारे में मदद चाहिए?', choose: 'चुनें',
    amount: 'कुल बकाया लगभग (वैकल्पिक)', prefer: 'संपर्क का तरीका',
    message: 'और कुछ बताना चाहें? (वैकल्पिक)',
    messageHint: 'कृपया खाता नंबर, कार्ड नंबर, OTP या पासवर्ड न लिखें।',
    consent: `मैं सहमत हूँ कि ${SITE.name} ये जानकारी सुरक्षित रख सकती है और इस पूछताछ के बारे में मुझसे फ़ोन या WhatsApp पर संपर्क कर सकती है (<a href="/privacy-policy.html">प्राइवेसी पॉलिसी</a>)।`,
    submit: 'मुफ़्त सलाह के लिए भेजें', sending: 'भेजा जा रहा है…',
    successTitle: 'धन्यवाद — आपका अनुरोध सेव हो गया है',
    successText: 'ऑफ़िस समय में हमारे सलाहकार आपसे संपर्क करेंगे। आप चाहें तो अभी WhatsApp पर बात जारी रख सकते हैं।',
    successWa: 'WhatsApp पर जारी रखें', successCall: 'कॉल करें',
    fallbackTitle: 'आपका अनुरोध ऑनलाइन सेव नहीं हो पाया',
    fallbackText: 'कृपया WhatsApp या कॉल से संपर्क करें — आपकी जानकारी संदेश में अपने-आप भर जाएगी।',
    privacy: 'गोपनीय। आपकी फ़ॉर्म जानकारी एनालिटिक्स या विज्ञापन प्लेटफ़ॉर्म को नहीं भेजी जाती।',
    topics: ['पर्सनल लोन', 'क्रेडिट कार्ड बकाया', 'NBFC या ऐप लोन', 'बिज़नेस / MSME लोन', 'रिकवरी एजेंट की परेशानी', 'लोन ऐप की परेशानी', 'लीगल नोटिस / धारा 138', 'सेटलमेंट के बाद क्रेडिट रिपोर्ट', 'कई लोन एक साथ', 'कुछ और'],
    amounts: ['₹1 लाख से कम', '₹1–5 लाख', '₹5–10 लाख', '₹10–25 लाख', '₹25 लाख से ज़्यादा', 'नहीं बताना चाहते'],
    contacts: ['WhatsApp', 'फ़ोन कॉल'],
  },
};
// Values posted to the API are always the English option labels so the
// server allowlist stays language-independent.
const optionList = (labels, values, placeholder) =>
  (placeholder ? `<option value="">${placeholder}</option>` : '') +
  labels.map((l, i) => `<option value="${esc(values[i])}">${esc(l)}</option>`).join('');

export function leadForm(page, id, variant = 'full') {
  const f = FORM[page.lang] || FORM.en;
  const en = FORM.en;
  const full = variant === 'full';
  return `<div class="lf-form-wrap" data-lf-form-wrap>
<form class="lf-form" id="${id}" data-lf-form="${id}" data-variant="${variant}" novalidate>
    <div class="form-row">
        <div class="form-field"><label for="${id}-name">${f.name}</label>
            <input id="${id}-name" name="name" type="text" autocomplete="name" required minlength="2" maxlength="80"></div>
        <div class="form-field"><label for="${id}-phone">${f.phone}</label>
            <input id="${id}-phone" name="phone" type="tel" inputmode="numeric" autocomplete="tel-national" required pattern="[6-9][0-9]{9}" maxlength="10" aria-describedby="${id}-phone-hint">
            <span class="field-hint" id="${id}-phone-hint">${f.phoneHint}</span></div>
    </div>
    <div class="form-row">
        ${full ? `<div class="form-field"><label for="${id}-city">${f.city}</label>
            <input id="${id}-city" name="city" type="text" autocomplete="address-level2" maxlength="60"></div>` : ''}
        <div class="form-field"><label for="${id}-topic">${f.topic}</label>
            <select id="${id}-topic" name="topic" required>${optionList(f.topics, en.topics, f.choose)}</select></div>
    </div>
    ${full ? `<div class="form-row">
        <div class="form-field"><label for="${id}-amount">${f.amount}</label>
            <select id="${id}-amount" name="amount">${optionList(f.amounts, en.amounts, f.choose)}</select></div>
        <div class="form-field"><label for="${id}-contact">${f.prefer}</label>
            <select id="${id}-contact" name="contact">${optionList(f.contacts, en.contacts)}</select></div>
    </div>
    <div class="form-field"><label for="${id}-message">${f.message}</label>
        <textarea id="${id}-message" name="message" rows="3" maxlength="600" aria-describedby="${id}-message-hint"></textarea>
        <span class="field-hint" id="${id}-message-hint">${f.messageHint}</span></div>` : ''}
    <div class="hp-field" aria-hidden="true"><label>Company<input name="company" type="text" tabindex="-1" autocomplete="off"></label></div>
    <label class="consent-check"><input type="checkbox" name="consent" value="yes" required> <span>${f.consent}</span></label>
    <button type="submit" class="btn btn-primary w-full" data-label-sending="${esc(f.sending)}"><i class="fas fa-paper-plane"></i> <span>${f.submit}</span></button>
    <p class="form-status" role="alert" aria-live="assertive"></p>
    <p class="form-privacy"><i class="fas fa-lock"></i> ${f.privacy}</p>
</form>
<div class="form-result" data-lf-result hidden tabindex="-1">
    <div class="form-result-icon"><i class="fas fa-circle-check"></i></div>
    <p class="form-result-title" data-ok="${esc(f.successTitle)}" data-fail="${esc(f.fallbackTitle)}"></p>
    <p class="form-result-text" data-ok="${esc(f.successText)}" data-fail="${esc(f.fallbackText)}"></p>
    <p class="form-result-ref" data-lf-ref></p>
    <div class="form-result-actions">
        <a class="btn btn-wa-green" data-lf-wa href="${waLink(t(page.lang).waDefault)}" target="_blank" rel="noopener" data-lf-loc="form_result"><i class="fab fa-whatsapp"></i> ${f.successWa}</a>
        <a class="btn btn-outline" href="tel:${SITE.phoneE164}" data-lf-loc="form_result"><i class="fas fa-phone-volume"></i> ${f.successCall}</a>
    </div>
</div>
</div>`;
}

export function ctaBand(page, opts = {}) {
  const s = t(page.lang);
  return `<section class="cta-band" data-lf-loc="cta_band" aria-label="${esc(opts.title || s.ctaTitle)}">
    <div class="container">
        <div class="cta-banner">
            <p class="cta-title">${esc(opts.title || s.ctaTitle)}</p>
            <p>${esc(opts.text || s.ctaText)}</p>
            <div class="d-flex justify-center flex-wrap gap-1">
                <a href="#consult" data-lf-consult class="btn btn-light"><i class="fas fa-comments"></i> ${s.ctaPrimary}</a>
                <a href="${waLink(opts.wa || s.waDefault)}" target="_blank" rel="noopener" class="btn btn-wa-green"><i class="fab fa-whatsapp"></i> ${s.ctaWa}</a>
            </div>
        </div>
    </div>
</section>`;
}

export function globals(page) {
  const s = t(page.lang);
  const hi = page.lang === 'hi';
  return `<a href="${waLink(s.waDefault)}" class="wa-float" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" data-lf-loc="floating_button"><i class="fab fa-whatsapp"></i></a>
<div class="sticky-bar" data-lf-loc="sticky_bar">
    <a href="tel:${SITE.phoneE164}" class="sticky-btn btn-call"><i class="fas fa-phone-volume"></i> ${s.callNow}</a>
    <a href="${waLink(s.waDefault)}" class="sticky-btn btn-wa" target="_blank" rel="noopener"><i class="fab fa-whatsapp"></i> ${s.whatsapp}</a>
</div>
<dialog id="consult" class="consult-dialog" aria-labelledby="consult-title">
    <button type="button" class="consult-close" data-lf-close aria-label="Close"><i class="fas fa-xmark"></i></button>
    <p class="consult-title" id="consult-title">${hi ? 'मुफ़्त और गोपनीय सलाह' : 'Free, confidential consultation'}</p>
    <p class="consult-sub">${hi ? 'अपनी जानकारी दें, हमारे सलाहकार ऑफ़िस समय में संपर्क करेंगे।' : 'Share a few details and an advisor will contact you during office hours.'}</p>
    ${leadForm(page, 'consult-form', 'compact')}
</dialog>
<div class="consent-banner" id="lf-consent" role="region" aria-label="Cookie preferences" hidden>
    <p>${hi
      ? 'हम साइट को बेहतर बनाने के लिए एनालिटिक्स कुकी और आपकी अनुमति होने पर ही विज्ञापन-मापन का उपयोग करते हैं। आपकी फ़ॉर्म जानकारी इन प्लेटफ़ॉर्म को नहीं भेजी जाती।'
      : 'We use analytics cookies to understand how the site is used and, only if you allow it, advertising measurement. Your form details are never sent to these platforms.'}
    <a href="/privacy-policy.html#cookies">${hi ? 'और जानें' : 'Learn more'}</a></p>
    <div class="consent-actions">
        <button type="button" class="btn btn-outline btn-sm" data-consent="essential">${hi ? 'केवल ज़रूरी' : 'Essential only'}</button>
        <button type="button" class="btn btn-primary btn-sm" data-consent="all">${hi ? 'सभी स्वीकार करें' : 'Accept all'}</button>
    </div>
</div>`;
}

// "Reviewed by" / editorial box for YMYL pages. Shows real named people only
// when they exist in SITE.people; otherwise states plainly who prepared it.
export function reviewBox(page) {
  const person = (id) => SITE.people.find((p) => p.id === id);
  const author = person(page.author);
  const reviewer = person(page.reviewer);
  const fmt = (d) => d && new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const who = author ? `<a href="/about.html#${author.id}">${esc(author.name)}</a>, ${esc(author.role)}` : `${SITE.name} editorial team`;
  const rev = reviewer
    ? `Reviewed by <a href="/about.html#${reviewer.id}">${esc(reviewer.name)}</a>, ${esc(reviewer.credential)}${page.lastReviewed ? ` on ${fmt(page.lastReviewed)}` : ''}.`
    : 'Independent expert review of this page is pending.';
  if (page.lang === 'hi') {
    return `<aside class="review-box" aria-label="लेख की जानकारी"><p><strong>तैयार किया:</strong> ${who}. ${page.dateModified ? `<strong>अपडेट:</strong> <time datetime="${page.dateModified}">${fmt(page.dateModified)}</time>.` : ''}</p><p>हमारी <a href="/editorial-policy.html">संपादकीय नीति</a> देखें। यह सामान्य जानकारी है, कानूनी सलाह नहीं।</p></aside>`;
  }
  return `<aside class="review-box" aria-label="About this page">
    <p><strong>Prepared by:</strong> ${who}. ${page.datePublished ? `<strong>Published:</strong> <time datetime="${page.datePublished}">${fmt(page.datePublished)}</time>. ` : ''}${page.dateModified ? `<strong>Last updated:</strong> <time datetime="${page.dateModified}">${fmt(page.dateModified)}</time>.` : ''}</p>
    <p>${rev} Read our <a href="/editorial-policy.html">editorial policy</a>. This is general information, not legal or financial advice for your situation.</p>
</aside>`;
}

// Related links rendered as cards from other pages' front matter.
export function related(page, pagesByPath, heading) {
  const items = (page.related || []).map((p) => pagesByPath.get(p)).filter(Boolean);
  if (!items.length) return '';
  const hi = page.lang === 'hi';
  return `<section class="related-links" aria-labelledby="related-${page.slug}">
    <h2 id="related-${page.slug}">${heading || (hi ? 'संबंधित गाइड' : 'Related guides and services')}</h2>
    <ul class="related-grid">${items.map((r) => `<li><a href="${r.path}"><span class="related-kind">${r.type === 'service' ? (hi ? 'सेवा' : 'Service') : (hi ? 'गाइड' : 'Guide')}</span><span class="related-title">${esc(r.h1 || r.title)}</span><i class="fas fa-arrow-right"></i></a></li>`).join('')}</ul>
</section>`;
}
