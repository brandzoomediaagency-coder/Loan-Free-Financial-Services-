// Single source of truth for business facts used across every page, the
// structured data, the footer and the lead form. Change a fact here once and
// rebuild; never hard-code these values in page sources.
//
// Values marked CONFIRM are published on the current site but have not been
// independently verified. See MANUAL_ACTIONS_REQUIRED.md before changing them.
export const SITE = {
  origin: 'https://www.loanfree.info',
  name: 'Loan Free Financial Services',
  shortName: 'Loan Free',
  tagline: 'Debt resolution consultancy · Delhi · Pan-India',
  description:
    'Loan Free Financial Services is a Delhi-based debt-resolution consultancy. It helps borrowers understand their options and supports loan settlement, restructuring, documentation and responses to unfair recovery practices. It is not a lender.',

  // CONFIRM: the privacy policy names this LLP as the operator. Until the
  // owner confirms the relationship and LLPIN, it is NOT added to schema
  // legalName and is only mentioned where the privacy policy already did.
  operatorEntity: 'Athena Legal Solution LLP',
  operatorConfirmed: false,
  llpin: null, // CONFIRM: add the LLPIN once supplied
  foundingDate: null, // CONFIRM: "since 2020" was claimed but not verified

  phoneDisplay: '+91 70425 38878',
  phoneE164: '+917042538878',
  whatsapp: '917042538878',
  // CONFIRM: off-domain email. Move to an @loanfree.info address when ready.
  email: 'info@athenalegalsolutionllp.in',

  // CONFIRM: a court chamber is published as the office. Check customer
  // access and Google Business Profile eligibility (see MANUAL_ACTIONS).
  address: {
    street: 'Chamber No. 698, 2nd Floor, Western Wing, Tis Hazari Court, District Courts North',
    lines: ['Chamber No. 698, 2nd Floor,', 'Western Wing, Tis Hazari Court,', 'District Courts North, Delhi 110054'],
    locality: 'Delhi',
    region: 'Delhi',
    postalCode: '110054',
    country: 'IN',
  },
  geo: { lat: 28.666, lng: 77.216 },
  // CONFIRM: the old Contact page listed Saturday 10:00–18:00; every other
  // page and the schema said 10:00–20:00. The majority value is used.
  hours: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], opens: '10:00', closes: '20:00' },
  hoursDisplay: 'Mon–Sat, 10:00 AM – 8:00 PM',
  hoursDisplayHi: 'सोम–शनि, सुबह 10 बजे – रात 8 बजे',

  social: {
    facebook: 'https://www.facebook.com/profile.php?id=61562416165952',
    instagram: 'https://www.instagram.com/loanfree.info/',
    linkedin: null, // add when the company page exists
    youtube: null,
    googleBusinessProfile: null, // add the Maps URL once verified
  },

  analytics: {
    ga4: 'G-QF7NBLW9G0', // existing property on the live site (31 Oct 2026)
    metaPixel: '1010576377287782', // existing pixel; loads only after marketing consent
    // Meta receives the page URL with every pixel event, and most URLs on this site describe
    // a debt problem. The pixel therefore runs only on these neutral pages (and only after
    // "Accept all"). Add a path here only after reviewing what its URL reveals.
    metaPixelPages: ['/', '/about.html', '/contact.html', '/services.html', '/process.html', '/faq.html'],
    // Google Tag Manager containers added to main on 1 Nov 2026 (58af001, 3f3a231). They load
    // after the Consent Mode default above, so Google tags inside them respect the visitor's
    // choice. Non-Google tags added in GTM must use GTM consent checks (see TRACKING_VERIFICATION).
    // The noscript iframe is intentionally omitted: without JavaScript consent cannot be read.
    gtm: ['GTM-MZT2JKM8', 'GTM-54VQF7S6'],
    gscVerification: 'X9-vIJlOxxbVxak1dS4yJQJ-LScnnE5bkooTzsWeMiA',
  },

  leadEndpoint: '/api/lead',

  // Homepage client quotes were published before Phase 2 and could not be
  // verified. Set to false to remove them until consent records are on file.
  showHomepageTestimonials: false,

  // Named authors / reviewers. Leave empty until real people with verifiable
  // credentials are supplied; the templates then show the editorial team.
  people: [],
};

export const NAV = [
  { href: '/', label: 'Home', hi: 'होम' },
  { href: '/about.html', label: 'About Us', hi: 'हमारे बारे में' },
  { href: '/services.html', label: 'Services', hi: 'सेवाएँ', menu: 'services' },
  { href: '/process.html', label: 'How It Works', hi: 'प्रक्रिया' },
  { href: '/settlement-calculator.html', label: 'Settlement Calculator', short: 'Calculator', hi: 'कैलकुलेटर' },
  { href: '/blog.html', label: 'Resources', hi: 'गाइड', menu: 'resources' },
  { href: '/faq.html', label: 'FAQs', hi: 'सवाल-जवाब' },
  { href: '/contact.html', label: 'Contact', hi: 'संपर्क' },
];

// Resources menu: guide topics (deep links into the filtered guide list) and tools.
export const RESOURCE_GROUPS = [
  { title: 'Guides by topic', items: [
    ['/blog.html#topic-rights', 'Borrower rights', 'scale-balanced'],
    ['/blog.html#topic-settlement', 'Loan settlement', 'handshake'],
    ['/blog.html#topic-credit', 'Credit score & CIBIL', 'chart-line'],
    ['/blog.html#topic-legal', 'Legal notices', 'file-signature'],
    ['/blog.html#topic-apps', 'Loan apps', 'mobile-screen-button'],
    ['/blog.html#topic-default', 'Missed EMIs', 'calendar-check'],
  ] },
  { title: 'Tools & help', items: [
    ['/settlement-calculator.html', 'Settlement scenario calculator', 'indian-rupee-sign'],
    ['/loan-settlement-vs-restructuring.html', 'Settlement vs restructuring', 'route'],
    ['/process.html', 'How our process works', 'list-check'],
    ['/faq.html', 'Frequently asked questions', 'circle-info'],
    ['/editorial-policy.html', 'How we check our guides', 'book-open'],
  ] },
];

// One catalogue of services, used by the header menu, the homepage and the footer.
// Only services with a page on this site are listed. [href, label, icon, short description]
export const SERVICE_GROUPS = [
  { title: 'Loan & card settlement', items: [
    ['/personal-loan-settlement.html', 'Personal Loan Settlement', 'wallet', 'Prepare a hardship case and a written settlement request to your lender.'],
    ['/credit-card-debt-settlement.html', 'Credit Card Settlement', 'credit-card', 'Options beyond the minimum-due cycle, including settlement.'],
    ['/nbfc-loan-settlement.html', 'NBFC & App Loan Settlement', 'building-columns', 'Find the real lender behind an app loan and your options.'],
    ['/loan-ots-one-time-settlement.html', 'One-Time Settlement (OTS)', 'handshake', 'How OTS works and what to check before you pay.'],
  ] },
  { title: 'Recovery & borrower rights', items: [
    ['/recovery-agent-harassment-protection.html', 'Recovery Agent Harassment', 'shield-halved', 'The rules agents must follow, and how to record and escalate breaches.'],
    ['/digital-lending-app-harassment.html', 'Loan App Harassment', 'mobile-screen-button', 'Threats or contact-list misuse by an app, and where to complain.'],
  ] },
  { title: 'Notices & legal matters', items: [
    ['/legal-notice-reply.html', 'Legal Notice Reply Support', 'file-signature', 'Understand the notice, the deadline and how to respond.'],
    ['/cheque-bounce-section-138.html', 'Cheque Bounce / Section 138', 'money-check', 'Time limits, options to pay or settle, and when you need an advocate.'],
  ] },
  { title: 'Business & credit report', items: [
    ['/business-loan-restructuring.html', 'MSME Loan Restructuring', 'briefcase', 'Restructuring or settlement requests for small businesses.'],
    ['/credit-score-guidance.html', 'Credit Report After Settlement', 'chart-line', 'Settled vs Closed, correcting errors and rebuilding.'],
  ] },
];

