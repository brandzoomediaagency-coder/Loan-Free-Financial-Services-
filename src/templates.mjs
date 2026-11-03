// Shared page components. Every page is assembled from these by
// tools/build.mjs, so the header, footer, forms and CTAs stay identical
// site-wide. Icons are written as <i class="fas fa-NAME"> and converted to
// the SVG sprite by the build.
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { SITE, NAV, SERVICE_GROUPS, RESOURCE_GROUPS } from './site.config.mjs';

export const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const T = {
  en: {
    skip: 'Skip to main content',
    menuOpen: 'Open menu',
    consult: 'Get a Free Consultation',
    home: 'Home',
    menuClose: 'Close menu',
    servicesMenu: 'Show services',
    allServices: 'All services',
    compare: 'Settlement vs restructuring',
    topNote: 'Confidential consultation',
    topHours: 'Mon–Sat, 10 a.m.–8 p.m.',
    topCoverage: 'Phone & WhatsApp support across India',
    resourcesMenu: 'Show resources',
    allGuides: 'All guides',
    resources: 'Resources',
    legal: 'Legal',
    notLender: 'We are not a lender and are not approved by the RBI. Only your lender can agree a settlement.',
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
    menuClose: 'मेनू बंद करें',
    servicesMenu: 'सेवाएँ दिखाएँ',
    allServices: 'सभी सेवाएँ',
    compare: 'सेटलमेंट या रीस्ट्रक्चरिंग',
    topNote: 'गोपनीय सलाह',
    topHours: 'सोम–शनि, सुबह 10 – रात 8',
    topCoverage: 'पूरे भारत में फ़ोन और WhatsApp पर सहायता',
    resourcesMenu: 'गाइड दिखाएँ',
    allGuides: 'सभी गाइड',
    resources: 'गाइड',
    legal: 'नीतियाँ',
    notLender: 'हम लोन नहीं देते और RBI से स्वीकृत नहीं हैं। सेटलमेंट पर फ़ैसला सिर्फ़ आपका लोन देने वाला करता है।',
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
  const hi = page.lang === 'hi';
  const isActive = (href) => page.path === href || (href === '/blog.html' && page.type === 'article')
    || (href === '/services.html' && page.type === 'service');
  const groupList = (groups) => groups.map((g) => `
                        <div class="sub-group"><p class="sub-title">${esc(g.title)}</p><ul>${g.items.map(([href, label, icon]) =>
                          `<li><a href="${href}"${page.path === href ? ' aria-current="page"' : ''}><i class="fas fa-${icon}"></i><span>${esc(label)}</span></a></li>`).join('')}</ul></div>`).join('');
  const menus = {
    services: { label: s.servicesMenu, body: groupList(SERVICE_GROUPS), foot: `<a href="/services.html">${s.allServices} <i class="fas fa-arrow-right"></i></a><a href="/settlement-calculator.html">${hi ? 'सेटलमेंट कैलकुलेटर' : 'Settlement scenario calculator'} <i class="fas fa-arrow-right"></i></a>` },
    resources: { label: s.resourcesMenu, body: groupList(RESOURCE_GROUPS), foot: `<a href="/blog.html">${s.allGuides} <i class="fas fa-arrow-right"></i></a>` },
  };
  const links = NAV.map((n) => {
    const cur = isActive(n.href) ? ' aria-current="page"' : '';
    const label = hi ? n.hi : (n.short ? `<span class="nav-long">${esc(n.label.replace(n.short, '').trim())} </span>${esc(n.short)}` : esc(n.label));
    if (!n.menu) return `<li><a href="${n.href}" class="nav-link"${cur}>${label}</a></li>`;
    const m = menus[n.menu];
    return `<li class="has-sub"><div class="nav-item-row"><a href="${n.href}" class="nav-link"${cur}>${label}</a><button type="button" class="sub-toggle" aria-expanded="false" aria-controls="sub-${n.menu}" aria-label="${m.label}"><i class="fas fa-chevron-down"></i></button></div>
                <div class="sub-menu sub-${n.menu}" id="sub-${n.menu}"><div class="sub-grid">${m.body}
                    </div><div class="sub-foot">${m.foot}</div></div></li>`;
  }).join('\n            ');
  const langSwitch = page.alternates
    ? Object.entries(page.alternates).filter(([l]) => l !== page.lang)
        .map(([l, href]) => `<a href="${href}" class="top-link" hreflang="${l}" lang="${l}"><i class="fas fa-language"></i> ${l === 'hi' ? 'हिन्दी' : 'English'}</a>`).join('')
    : '';
  return `<a href="#main" class="skip-link">${s.skip}</a>
<header class="site-header">
    <div class="topbar">
        <div class="container topbar-inner">
            <ul class="top-notes"><li><i class="fas fa-lock"></i> ${s.topNote}</li><li><i class="fas fa-clock"></i> ${s.topHours}</li><li><i class="fas fa-location-dot"></i> ${s.topCoverage}</li></ul>
            <div class="top-links">${langSwitch}<a href="tel:${SITE.phoneE164}" class="top-link" data-lf-loc="topbar"><i class="fas fa-phone-volume"></i> ${SITE.phoneDisplay}</a><a href="mailto:${SITE.email}" class="top-link"><i class="fas fa-envelope"></i> ${SITE.email}</a></div>
        </div>
    </div>
    <nav class="navbar" aria-label="Primary">
        <div class="container nav-container">
            <a href="${hi ? '/hi/' : '/'}" class="logo" aria-label="${SITE.name} — ${s.home}">
                <img src="/assets/brand/logo-120.webp" alt="" class="nav-logo-img" width="44" height="44">
                <span class="brand-text"><span class="brand-name">Loan Free</span><span class="brand-sub">Financial Services</span></span>
            </a>
            <div class="nav-panel" id="primary-menu">
                <ul class="nav-menu">
            ${links}
                </ul>
                <div class="nav-panel-cta">
                    <a href="#consult" data-lf-consult class="btn btn-primary" data-lf-loc="mobile_menu">${s.consult}</a>
                    <div class="nav-panel-contact"><a href="tel:${SITE.phoneE164}" class="btn btn-outline" data-lf-loc="mobile_menu"><i class="fas fa-phone-volume"></i> ${s.callNow}</a><a href="${waLink(s.waDefault)}" class="btn btn-outline" target="_blank" rel="noopener" data-lf-loc="mobile_menu"><i class="fab fa-whatsapp"></i> ${s.whatsapp}</a></div>
                    <p class="nav-panel-hours"><i class="fas fa-clock"></i> ${s.topHours}</p>
                    ${langSwitch ? `<p class="nav-panel-lang">${langSwitch}</p>` : ''}
                </div>
            </div>
            <a href="#consult" data-lf-consult class="btn btn-primary nav-cta" data-lf-loc="header">${s.consult}</a>
            <button type="button" class="mobile-toggle" aria-label="${s.menuOpen}" data-label-open="${s.menuOpen}" data-label-close="${s.menuClose}" aria-controls="primary-menu" aria-expanded="false"><i class="fas fa-bars"></i></button>
        </div>
    </nav>
</header>`;
}

export function footer(page) {
  const s = t(page.lang);
  const hi = page.lang === 'hi';
  const year = new Date().getFullYear();
  const li = (arr) => arr.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('');
  const socials = [
    ['facebook', 'facebook-f', 'Facebook'], ['instagram', 'instagram', 'Instagram'],
    ['linkedin', 'linkedin-in', 'LinkedIn'], ['youtube', 'youtube', 'YouTube'],
  ].filter(([k]) => SITE.social[k])
    .map(([k, icon, label]) => `<a href="${SITE.social[k]}" class="social-icon" target="_blank" rel="noopener" aria-label="${label}"><i class="fab fa-${icon}"></i></a>`).join('');
  const services = SERVICE_GROUPS.flatMap((g) => g.items.map(([href, label]) => [href, label]));
  const resources = [['/blog.html', hi ? 'सभी गाइड' : 'Guides & articles'], ['/settlement-calculator.html', hi ? 'सेटलमेंट कैलकुलेटर' : 'Settlement calculator'], ['/loan-settlement-vs-restructuring.html', s.compare], ['/process.html', hi ? 'प्रक्रिया' : 'How it works'], ['/faq.html', hi ? 'सवाल-जवाब' : 'FAQs'], ['/editorial-policy.html', hi ? 'संपादकीय नीति' : 'Editorial policy']];
  const company = [['/about.html', hi ? 'हमारे बारे में' : 'About us'], ['/contact.html', hi ? 'संपर्क' : 'Contact'], ['/loan-settlement-delhi.html', hi ? 'दिल्ली ऑफ़िस' : 'Delhi office']];
  const legal = [['/privacy-policy.html', hi ? 'प्राइवेसी पॉलिसी' : 'Privacy policy'], ['/terms.html', hi ? 'नियम व शर्तें' : 'Terms & conditions'], ['/disclaimer.html', hi ? 'अस्वीकरण' : 'Disclaimer']];
  const lang = page.lang === 'en' ? (page.hasHindi ? '<li><a href="/hi/" lang="hi">हिन्दी गाइड</a></li>' : '') : '<li><a href="/">English</a></li>';
  return `<footer class="footer" data-lf-loc="footer">
    <div class="container">
        <div class="footer-grid">
            <div class="footer-col footer-brand">
                <a href="${hi ? '/hi/' : '/'}" class="logo logo-light" aria-label="${SITE.name} — ${s.home}">
                    <img src="/assets/brand/logo-120.webp" alt="" class="nav-logo-img" width="44" height="44" loading="lazy">
                    <span class="brand-text"><span class="brand-name">Loan Free</span><span class="brand-sub">Financial Services</span></span>
                </a>
                <p class="footer-about">${s.footerAbout}</p>
                <p class="footer-note"><i class="fas fa-circle-info"></i> ${s.notLender}</p>
                ${socials ? `<div class="social-icons">${socials}</div>` : ''}
            </div>
            <div class="footer-col">
                <p class="footer-heading">${s.services}</p>
                <ul>${li(services)}</ul>
            </div>
            <div class="footer-col">
                <p class="footer-heading">${s.resources}</p>
                <ul>${li(resources)}${lang}</ul>
                <p class="footer-heading footer-heading-gap">${s.company}</p>
                <ul>${li(company)}</ul>
            </div>
            <div class="footer-col">
                <p class="footer-heading">${s.contact}</p>
                <ul class="contact-list">
                    <li><i class="fas fa-phone-volume"></i><span><span class="contact-label">${s.phone} / WhatsApp</span><a href="tel:${SITE.phoneE164}">${SITE.phoneDisplay}</a></span></li>
                    <li><i class="fas fa-envelope"></i><span><span class="contact-label">${s.email}</span><a href="mailto:${SITE.email}">${SITE.email}</a></span></li>
                    <li><i class="fas fa-clock"></i><span><span class="contact-label">${s.hours}</span>${hi ? SITE.hoursDisplayHi : SITE.hoursDisplay}</span></li>
                    <li><i class="fas fa-location-dot"></i><span><span class="contact-label">${s.office}</span>${SITE.address.lines.join('<br>')}</span></li>
                </ul>
            </div>
        </div>
        <div class="footer-bottom">
            <div class="footer-bottom-row">
                <p>&copy; ${year} ${SITE.name}. ${s.rights}</p>
                <ul class="footer-legal">${li(legal)}<li><a href="/sitemap.xml">Sitemap</a></li><li><button type="button" class="link-button" data-lf-consent-open>${s.cookieSettings}</button></li></ul>
            </div>
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
    fallbackTitle: 'Opening WhatsApp with your details…',
    fallbackText: 'Your details are already filled in the message — just press send. If WhatsApp does not open, tap the button below or call us.',
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
    fallbackTitle: 'आपकी जानकारी के साथ WhatsApp खुल रहा है…',
    fallbackText: 'आपकी जानकारी संदेश में पहले से भरी है — बस भेजें दबाएँ। अगर WhatsApp न खुले तो नीचे का बटन दबाएँ या कॉल करें।',
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
            <div class="cta-copy">
                <p class="cta-title">${esc(opts.title || s.ctaTitle)}</p>
                <p>${esc(opts.text || s.ctaText)}</p>
            </div>
            <div class="cta-actions">
                <a href="#consult" data-lf-consult class="btn btn-light"><i class="fas fa-comments"></i> ${s.ctaPrimary}</a>
                <a href="${waLink(opts.wa || s.waDefault)}" target="_blank" rel="noopener" class="btn btn-ghost-light"><i class="fab fa-whatsapp"></i> ${s.ctaWa}</a>
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
    <a href="/privacy-policy.html#cookies">${hi ? 'कुकी के बारे में और जानें' : 'How we use cookies'}</a></p>
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
  const hiPage = page.lang === 'hi';
  const fmt = (d) => d && new Date(d + 'T00:00:00Z').toLocaleDateString(hiPage ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
  const who = author ? `<a href="/about.html#${author.id}">${esc(author.name)}</a>, ${esc(author.role)}` : `${SITE.name} ${hiPage ? 'संपादकीय टीम' : 'editorial team'}`;
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

// Homepage client quotes. Published before Phase 2 and not independently
// verified: keep only quotes backed by a consent record, and set
// SITE.showHomepageTestimonials = false to remove the section entirely.
const QUOTES = [
  ['They explained my options clearly and helped me deal with my credit card dues without the panic.', 'Rahul S.', 'Delhi'],
  ['The recovery calls were overwhelming. They helped me understand my rights and how to respond.', 'Priya M.', 'Mumbai'],
  ['Professional and patient. They guided every step of the documentation with the bank.', 'Amit K.', 'Bengaluru'],
  ['My personal loan was restructured into something I could actually manage.', 'Sneha R.', 'Pune'],
  ['Honest advice without false promises. That is exactly what I needed at a stressful time.', 'Vikram J.', 'Hyderabad'],
  ['They helped me reply to a legal notice I had no idea how to handle on my own.', 'Anjali D.', 'Chennai'],
  ['Clear, calm and respectful throughout. I finally understood where I stood.', 'Rohan G.', 'Noida'],
  ['Skeptical at first, but the guidance was genuine and practical.', 'Deepak C.', 'Bhopal'],
  ['They treated me with respect even when I was anxious. The process felt manageable.', 'Swati M.', 'Nagpur'],
  ['Helped me organise multiple dues into a structured plan. Much clearer now.', 'Karan P.', 'Vadodara'],
  ['The guidance gave me confidence to handle the calls properly.', 'Simran K.', 'Ludhiana'],
  ['Realistic expectations were set from day one. No tall claims, just steady support.', 'Vishal S.', 'Patna'],
  ['Helpful with my MSME loan situation when cash flow was tight.', 'Sanjay G.', 'Thane'],
  ['Responsive and reassuring. They answered every question patiently.', 'Nisha T.', 'Agra'],
];
export function testimonials() {
  if (!SITE.showHomepageTestimonials) return '';
  const card = ([q, n, c]) => `<figure class="testimonial-card"><blockquote><p>“${esc(q)}”</p></blockquote><figcaption class="client-info"><strong>${esc(n)}</strong><span>${esc(c)}</span></figcaption></figure>`;
  const half = Math.ceil(QUOTES.length / 2);
  return `<section class="testimonials-section" aria-labelledby="testi-title">
    <div class="container">
        <div class="section-title">
            <span class="eyebrow">In their words</span>
            <h2 id="testi-title">What Clients Have Told Us</h2>
            <p>Feedback shared with permission. Names are shortened for privacy.</p>
        </div>
        <div class="marquee-controls"><button type="button" class="marquee-toggle" aria-pressed="false" data-pause="Pause scrolling" data-play="Resume scrolling"><i class="fas fa-pause"></i> <span>Pause scrolling</span></button></div>
    </div>
    <div class="marquee-wrapper mobile-scroll">
        <div class="marquee-track scroll-left">${QUOTES.slice(0, half).map(card).join('')}</div>
        <div class="marquee-track scroll-right">${QUOTES.slice(half).map(card).join('')}</div>
    </div>
    <div class="container"><p class="testimonial-note">Individual experiences describe service, not results. Outcomes depend on each lender and case.</p></div>
</section>`;
}

// Verified business facts for About/Contact. Unconfirmed items are omitted
// rather than guessed; they appear automatically once added to SITE.
export function entityFacts() {
  const rows = [
    ['Brand', SITE.name],
    ['What we are', 'A debt-resolution consultancy. We are not a lender, bank, credit bureau or law firm, and we are not regulated or approved by the Reserve Bank of India.'],
    ['What we do', 'Consultation, settlement and restructuring negotiation support, documentation guidance, help responding to unfair recovery practices, and coordination with independent counsel where a case needs it.'],
    ['Who we help', 'Individuals and small businesses in India with personal loans, credit cards, NBFC or app loans and business loans they are struggling to repay.'],
  ];
  if (SITE.operatorConfirmed) rows.push(['Operated by', `${SITE.operatorEntity}${SITE.llpin ? ` (LLPIN ${SITE.llpin})` : ''}`]);
  if (SITE.foundingDate) rows.push(['Founded', SITE.foundingDate]);
  rows.push(
    ['Office', SITE.address.lines.join(' ')],
    ['Service area', 'Delhi NCR in person; the rest of India by phone, WhatsApp and email'],
    ['Languages', 'English and Hindi'],
    ['Hours', SITE.hoursDisplay],
    ['Contact', `<a href="tel:${SITE.phoneE164}">${SITE.phoneDisplay}</a> · <a href="mailto:${SITE.email}">${SITE.email}</a>`],
  );
  return `<dl class="fact-list">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
}

// Named advisors. Renders nothing until real people are added to SITE.people
// ({ id, name, role, credential, photo, bio, sameAs: [] }).
export function team() {
  if (!SITE.people.length) return '';
  return `<div class="team-grid">${SITE.people.map((p) => `<article class="team-card" id="${p.id}">
    ${p.photo ? `<img src="${p.photo}" width="400" height="500" alt="${esc(p.name)}, ${esc(p.role)} at ${SITE.name}" loading="lazy">` : ''}
    <h3>${esc(p.name)}</h3><p class="team-role">${esc(p.role)}${p.credential ? ` · ${esc(p.credential)}` : ''}</p>
    ${p.bio ? `<p>${esc(p.bio)}</p>` : ''}</article>`).join('')}</div>`;
}

export const CATEGORIES = {
  rights: 'Borrower rights', settlement: 'Settlement', credit: 'Credit report',
  legal: 'Legal notices', apps: 'Loan apps', default: 'Missed EMIs & budgeting',
};
const fmtDate = (d) => new Date(d + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });

// Guide cards for the resources hub, generated from every published article.
export function articleCards(pages) {
  const list = pages.filter((p) => p.type === 'article' && p.lang === 'en' && p.index !== false)
    .sort((a, b) => (b.dateModified || '').localeCompare(a.dateModified || '') || a.h1.localeCompare(b.h1));
  const used = [...new Set(list.map((p) => p.category))].filter(Boolean);
  const filters = `<div class="filter-bar" role="group" aria-label="Filter guides by topic"><button type="button" data-filter="all" aria-pressed="true">All guides</button>${used.map((c) => `<button type="button" data-filter="${c}" aria-pressed="false">${CATEGORIES[c] || c}</button>`).join('')}</div>`;
  const cards = list.map((p) => {
    const slug = p.rel.replace(/^blog\//, '').replace(/\.html$/, '');
    return `<article class="resource-card" data-category="${p.category || ''}">
        <div class="resource-thumb"><img src="/assets/thumbs/${slug}.webp" width="600" height="400" loading="lazy" alt=""></div>
        <div class="resource-body">
            <span class="tag">${CATEGORIES[p.category] || 'Guide'}</span>
            <h3><a href="${p.path}" class="card-link">${esc(p.h1)}</a></h3>
            <p>${esc(p.description)}</p>
            <p class="resource-meta">Updated <time datetime="${p.dateModified}">${fmtDate(p.dateModified)}</time></p>
        </div>
    </article>`;
  }).join('\n');
  return `${filters}<div class="card-grid">${cards}</div>`;
}

// Grouped service rows from SERVICE_GROUPS (homepage and Services page).
export function servicesIndex(page, headingLevel = 'h3') {
  return `<div class="svc-groups">${SERVICE_GROUPS.map((g) => `
    <div class="svc-group">
        <p class="svc-group-title">${esc(g.title)}</p>
        <ul class="svc-list">${g.items.map(([href, label, icon, desc]) => `
            <li><a class="svc-row" href="${href}"><span class="icon-tile"><i class="fas fa-${icon}"></i></span><span><${headingLevel}>${esc(label)}</${headingLevel}><p>${esc(desc)}</p></span><i class="fas fa-arrow-right"></i></a></li>`).join('')}
        </ul>
    </div>`).join('')}
</div>`;
}

// Responsive photo from assets/photos (made by tools/photos.py): AVIF + WebP at 480/800/1200.
// Only the above-the-fold LCP photo should be marked eager (it also gets fetchpriority=high).
let photoManifest = null;
export function photo(name, { alt = '', sizes = '100vw', eager = false, cls = '' } = {}) {
  if (!photoManifest) photoManifest = JSON.parse(fs.readFileSync(new URL('../assets/photos/manifest.json', import.meta.url), 'utf8'));
  const m = photoManifest[name];
  if (!m) throw new Error(`Unknown photo: ${name}`);
  const w = Math.max(...m.widths), h = Math.round(m.h * w / m.w);
  const set = (ext) => m.widths.map((x) => `/assets/photos/${name}-${x}.${ext} ${x}w`).join(', ');
  const mid = m.widths.includes(800) ? 800 : w;
  return `<picture${cls ? ` class="${cls}"` : ''}><source type="image/avif" srcset="${set('avif')}" sizes="${esc(sizes)}"><source type="image/webp" srcset="${set('webp')}" sizes="${esc(sizes)}"><img src="/assets/photos/${name}-${mid}.webp" width="${w}" height="${h}" alt="${esc(alt)}" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"'} decoding="async"></picture>`;
}
export function photoPreload(name, sizes) {
  if (!photoManifest) photoManifest = JSON.parse(fs.readFileSync(new URL('../assets/photos/manifest.json', import.meta.url), 'utf8'));
  const m = photoManifest[name];
  return `<link rel="preload" as="image" type="image/avif" imagesrcset="${m.widths.map((x) => `/assets/photos/${name}-${x}.avif ${x}w`).join(', ')}" imagesizes="${esc(sizes)}" fetchpriority="high">`;
}

// Calculator teaser and in-page promo (no figures are passed anywhere).
export function calculatorPromo() {
  return `<aside class="calc-promo" aria-label="Loan settlement and legal fee calculator">
    <img src="/assets/illustrations/calculator-planning.svg" width="560" height="420" loading="lazy" alt="">
    <div><p class="calc-promo-title">Try the settlement &amp; fee calculator</p>
    <p>Enter your total outstanding to see an illustrative ${CALC.formatPercent(CALC.CONFIG.SETTLEMENT_SCENARIO_PERCENT)} settlement scenario and our applicable professional fee. Private, and never a prediction of what a lender will accept.</p>
    <a class="btn btn-outline btn-sm" href="/settlement-calculator.html"><i class="fas fa-chart-line"></i> Open the calculator</a></div>
</aside>`;
}

// Loan Settlement & Legal Fee Calculator (src/js/calculator.js binds it and holds every business
// number in CONFIG). Used on the calculator page and the homepage. Two inputs: the total outstanding
// amount and an optional multi-select of loan types. The illustrative settlement scenario and the
// professional fee are shown in separate cards and never added together.
const CALC = createRequire(import.meta.url)('./js/calculator.js');
const pctLabel = () => CALC.formatPercent(CALC.CONFIG.SETTLEMENT_SCENARIO_PERCENT);

export function calculator({ h = 2 } = {}) {
  const H = `h${h}`, HC = `h${h + 1}`;
  const C = CALC.CONFIG;
  const pct = pctLabel();
  const options = C.LOAN_TYPES.map((lt) => `<li><label class="calc-ms-opt"><input type="checkbox" value="${lt.id}" data-loan-type><span class="calc-ms-box" aria-hidden="true"><i class="fas fa-check"></i></span><span>${esc(lt.label)}</span></label></li>`).join('');
  const tiers = C.FEE_TIERS.map((tr) => `<li data-tier="${tr.id}"><span>${esc(tr.label)} <span class="calc-tier-tag">Your tier</span></span><strong>${CALC.formatPercent(tr.bps / 100)}</strong></li>`).join('');
  return `<div class="calc" data-lf-calc>
  <div class="calc-shell">
    <form class="calc-inputs" data-calc-form novalidate autocomplete="off" aria-labelledby="calc-inputs-title">
      <${H} class="calc-step-title" id="calc-inputs-title"><span class="calc-step" aria-hidden="true">1</span> Enter your loan details</${H}>
      <div class="calc-fields">
        <div class="calc-field">
          <label class="calc-label" for="calc-amount">Total Outstanding Loan Amount</label>
          <div class="calc-input"><span aria-hidden="true">₹</span><input id="calc-amount" data-calc-amount type="text" inputmode="decimal" autocomplete="off" placeholder="10,00,000" required aria-required="true" aria-describedby="calc-amount-hint calc-amount-error"></div>
          <p class="calc-hint" id="calc-amount-hint">Enter the combined outstanding amount across your unsecured loans.</p>
          <p class="calc-error" id="calc-amount-error" data-calc-amount-error hidden></p>
        </div>
        <div class="calc-field">
          <span class="calc-label" id="calc-types-label">What type of loan do you have?</span>
          <div class="calc-ms" data-lf-ms>
            <button type="button" class="calc-ms-toggle" data-ms-toggle aria-expanded="false" aria-controls="calc-types-panel" aria-labelledby="calc-types-label calc-types-value" aria-describedby="calc-types-hint"><span class="calc-ms-value" id="calc-types-value" data-ms-value>Select loan types</span><i class="fas fa-chevron-down"></i></button>
            <div class="calc-ms-panel" id="calc-types-panel" data-ms-panel hidden>
              <div class="calc-ms-tools"><button type="button" class="calc-ms-link" data-ms-all>Select all</button><button type="button" class="calc-ms-link" data-ms-clear>Clear all</button></div>
              <fieldset class="calc-ms-group"><legend class="visually-hidden">Loan types (select all that apply)</legend>
                <ul class="calc-ms-list">${options}</ul>
              </fieldset>
              <div class="calc-ms-foot"><button type="button" class="btn btn-primary btn-sm" data-ms-done>Done</button></div>
            </div>
          </div>
          <ul class="calc-chips" data-r="chips" aria-label="Selected loan types" hidden></ul>
          <template data-chip-template><li class="calc-chip"><span></span><button type="button" class="calc-chip-x"><i class="fas fa-xmark"></i></button></li></template>
          <p class="calc-hint" id="calc-types-hint">Select all loan categories that apply. Enter their combined outstanding amount above.</p>
          <p class="calc-note" role="note"><i class="fas fa-circle-info"></i><span><strong>Unsecured loans only.</strong> Our settlement services do not cover secured loans such as home loans, vehicle loans, loans against property or gold loans.</span></p>
        </div>
      </div>
    </form>

    <div class="calc-results is-empty" data-calc-results tabindex="-1" aria-labelledby="calc-results-title">
      <div class="calc-results-head">
        <${H} class="calc-step-title" id="calc-results-title"><span class="calc-step" aria-hidden="true">2</span> Your results</${H}>
        <p class="calc-status" data-r="status">Enter your total outstanding loan amount to see your results.</p>
      </div>
      <p class="visually-hidden" data-r="live" aria-live="polite"></p>
      <div class="calc-cards">
        <div class="calc-card calc-card-loan">
          <div class="calc-card-head"><span class="calc-card-icon"><i class="fas fa-wallet"></i></span><${HC} class="calc-card-title">Your loan details</${HC}></div>
          <dl class="calc-figures">
            <div class="calc-fig-main"><dt>Total outstanding loan amount</dt><dd class="calc-big" data-r="outstanding">—</dd></div>
            <div class="calc-fig-main"><dt>Selected loan types</dt><dd><ul class="calc-type-list" data-r="types" hidden></ul><span class="calc-muted" data-r="types-none">None selected yet</span></dd></div>
          </dl>
          <p class="calc-fine">Choosing a loan type does not mean an account qualifies for settlement. That depends on the lender, the loan, your circumstances and applicable law.</p>
        </div>
        <div class="calc-card calc-card-settle">
          <div class="calc-card-head"><span class="calc-card-icon"><i class="fas fa-handshake"></i></span><${HC} class="calc-card-title">Illustrative settlement scenario</${HC}></div>
          <dl class="calc-figures">
            <div><dt>Reference settlement percentage</dt><dd><span class="calc-pill">${pct}</span></dd></div>
            <div class="calc-fig-main"><dt>Illustrative settlement amount</dt><dd class="calc-big" data-r="settlement">—</dd></div>
          </dl>
          <p class="calc-text" data-r="settlement-text">Shown as ${pct} of your total outstanding, for illustration only.</p>
          <p class="calc-caution"><i class="fas fa-triangle-exclamation"></i><span>Illustration only — not a lender-approved offer or a guaranteed outcome. Lenders decide each case: an actual settlement, if offered, may be for a different amount.</span></p>
        </div>
        <div class="calc-card calc-card-fee">
          <div class="calc-card-head"><span class="calc-card-icon"><i class="fas fa-scale-balanced"></i></span><${HC} class="calc-card-title">Our applicable legal / professional fee</${HC}></div>
          <dl class="calc-figures">
            <div><dt>Applicable fee percentage</dt><dd><span class="calc-pill" data-r="fee-percent">—</span></dd></div>
            <div class="calc-fig-main"><dt>Estimated fee</dt><dd class="calc-big" data-r="fee">—</dd></div>
          </dl>
          <p class="calc-text" data-r="fee-calc">The rate depends on your total outstanding amount.</p>
          <p class="calc-text calc-tier-text" data-r="fee-tier"></p>
          <ul class="calc-tiers" aria-label="Our fee structure">${tiers}</ul>
          <p class="calc-fine">The fee is calculated according to the total outstanding amount and our stated fee structure. Applicable taxes, if any, are not included and will be confirmed before engagement. This fee is separate from any amount paid to your lender.</p>
        </div>
      </div>
      <p class="calc-privacy"><i class="fas fa-lock"></i> Calculated on your device. Nothing you enter is saved, sent to us, or shared with analytics or advertising services.</p>
    </div>
  </div>

  <div class="calc-cta" data-lf-loc="calculator">
    <div class="calc-cta-copy">
      <${H} class="calc-cta-title">Want to Explore Your Loan Settlement Options?</${H}>
      <p>Every loan account is different. Speak with our team to understand the available options and the process applicable to your situation.</p>
    </div>
    <div class="calc-cta-actions">
      <a href="#consult" data-lf-consult class="btn btn-primary"><i class="fas fa-comments"></i> Get a Free Consultation</a>
      <a href="${waLink(t('en').waDefault)}" target="_blank" rel="noopener" class="btn btn-ghost-light"><i class="fab fa-whatsapp"></i> Talk to Us on WhatsApp</a>
    </div>
    <p class="calc-cta-note"><i class="fas fa-lock"></i> Contacting us does not share any figures you entered in the calculator.</p>
  </div>

  <div class="calc-disclaimer" role="note" aria-label="Important disclaimer">
    <p><strong>Important Disclaimer:</strong> This calculator is for educational and illustrative purposes only. The ${pct} figure is a hypothetical calculation and is not a guaranteed settlement offer or an assurance that any lender will accept a particular amount. Actual settlement terms depend on the lender's decision, account status, financial circumstances and applicable rules. Loan settlement may affect credit reporting and future borrowing eligibility. The professional fee shown is based on the fee structure provided by Loan Free Financial Services and is an estimate. Final terms and applicable charges will be communicated before engagement. Do not stop repayments, ignore lender communications or make financial decisions solely on the basis of this calculator. Consider obtaining independent professional advice.</p>
    <p>Loan Free Financial Services is not a lender and is not approved by the Reserve Bank of India. Neither the RBI nor any lender has reviewed or endorsed this calculator or our fee structure.</p>
  </div>
</div>`;
}

// Calculator facts used in page copy, generated from the same CONFIG so the text always matches
// the arithmetic. Expanded when pages are loaded (before FAQ structured data is extracted):
//   <!-- lf:calc-percent -->               "30%"
//   <!-- lf:calc-fee-summary -->           "1% (up to and including ₹10,00,000), 0.75% (...) and 0.50% (...)"
//   <!-- lf:calc-fee-example 2500000 -->   "₹25,00,000 × 0.75% = ₹18,750"
//   <!-- lf:calc-fee-table -->             fee structure table
//   <!-- lf:calc-examples 1000000 2500000 --> worked examples table
export function expandCalcTokens(html) {
  if (!html.includes('<!-- lf:calc-')) return html;
  const C = CALC.CONFIG;
  const rate = (tr) => CALC.formatPercent(tr.bps / 100);
  const lower = (s) => s.charAt(0).toLowerCase() + s.slice(1);
  const feeExample = (n) => { const f = CALC.legalFee(n); return `${CALC.formatINR(n)} × ${f.percentLabel} = ${CALC.formatINR(f.amount)}`; };
  const summary = C.FEE_TIERS.map((tr) => `${rate(tr)} (${lower(tr.label)})`);
  return html
    .replace(/<!-- lf:calc-percent -->/g, () => pctLabel())
    .replace(/<!-- lf:calc-fee-summary -->/g, () => summary.slice(0, -1).join(', ') + ' and ' + summary[summary.length - 1])
    .replace(/<!-- lf:calc-fee-example (\d+) -->/g, (_, n) => feeExample(Number(n)))
    .replace(/<!-- lf:calc-fee-table -->/g, () => `<div class="table-wrap">
            <table class="content-table">
                <caption class="visually-hidden">Professional fee structure</caption>
                <thead><tr><th scope="col">Total outstanding loan amount</th><th scope="col">Rate applied to the entire amount</th></tr></thead>
                <tbody>${C.FEE_TIERS.map((tr) => `<tr><th scope="row">${esc(tr.label)}</th><td>${rate(tr)}</td></tr>`).join('')}</tbody>
            </table>
        </div>`)
    .replace(/<!-- lf:calc-examples ([\d ]+) -->/g, (_, list) => `<div class="table-wrap">
            <table class="content-table">
                <caption class="visually-hidden">Worked examples</caption>
                <thead><tr><th scope="col">Total outstanding</th><th scope="col">Illustrative settlement scenario (${pctLabel()})</th><th scope="col">Fee rate</th><th scope="col">Estimated professional fee</th></tr></thead>
                <tbody>${list.trim().split(/\s+/).map(Number).map((n) => { const r = CALC.calculate(n, []).results; return `<tr><th scope="row">${CALC.formatINR(n)}</th><td>${CALC.formatINR(r.settlement.amount)}</td><td>${r.fee.percentLabel}</td><td>${CALC.formatINR(r.fee.amount)}</td></tr>`; }).join('')}</tbody>
            </table>
        </div>`);
}

// Homepage service grid: every real service, two featured with an illustration.
// 12 grid cells (2 featured x 2 + 8) so rows stay full at 2, 3 and 4 columns.
const SERVICE_ART = {
  '/personal-loan-settlement.html': 'svc-personal-loan',
  '/recovery-agent-harassment-protection.html': 'svc-recovery-rules',
};
export function servicesGrid() {
  const items = SERVICE_GROUPS.flatMap((g) => g.items.map((it) => [...it, g.title]));
  return `<ul class="svc-grid">${items.map(([href, label, icon, desc, group]) => {
    const art = SERVICE_ART[href];
    return `<li class="svc-card${art ? ' svc-card-featured' : ''}">
        ${art ? `<img class="svc-art" src="/assets/illustrations/${art}.svg" width="480" height="360" loading="lazy" alt="">` : ''}
        <div class="svc-body">
            <span class="icon-tile"><i class="fas fa-${icon}"></i></span>
            <p class="svc-group">${esc(group)}</p>
            <h3>${esc(label)}</h3>
            <p>${esc(desc)}</p>
            <div class="svc-links"><a class="link-arrow" href="${href}">Learn more<span class="visually-hidden"> about ${esc(label)}</span> <i class="fas fa-arrow-right"></i></a><a class="svc-ask" href="#consult" data-lf-consult data-lf-loc="service_card">Free consultation</a></div>
        </div>
    </li>`;
  }).join('')}</ul>`;
}
