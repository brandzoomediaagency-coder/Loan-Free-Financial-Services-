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
    gscVerification: 'X9-vIJlOxxbVxak1dS4yJQJ-LScnnE5bkooTzsWeMiA',
  },

  leadEndpoint: '/api/lead',

  // Homepage client quotes were published before Phase 2 and could not be
  // verified. Set to false to remove them until consent records are on file.
  showHomepageTestimonials: true,

  // Named authors / reviewers. Leave empty until real people with verifiable
  // credentials are supplied; the templates then show the editorial team.
  people: [],
};

export const NAV = [
  { href: '/', label: 'Home', hi: 'होम' },
  { href: '/services.html', label: 'Services', hi: 'सेवाएँ' },
  { href: '/process.html', label: 'Process', hi: 'प्रक्रिया' },
  { href: '/about.html', label: 'About', hi: 'हमारे बारे में' },
  { href: '/blog.html', label: 'Resources', hi: 'गाइड' },
  { href: '/faq.html', label: 'FAQ', hi: 'सवाल-जवाब' },
  { href: '/contact.html', label: 'Contact', hi: 'संपर्क' },
];

export const FOOTER_SERVICES = [
  ['/personal-loan-settlement.html', 'Personal Loan Settlement'],
  ['/credit-card-debt-settlement.html', 'Credit Card Settlement'],
  ['/nbfc-loan-settlement.html', 'NBFC Loan Settlement'],
  ['/loan-ots-one-time-settlement.html', 'One-Time Settlement (OTS)'],
  ['/business-loan-restructuring.html', 'Business / MSME Restructuring'],
  ['/recovery-agent-harassment-protection.html', 'Recovery Harassment Support'],
  ['/digital-lending-app-harassment.html', 'Loan App Harassment Support'],
  ['/legal-notice-reply.html', 'Legal Notice Reply'],
  ['/cheque-bounce-section-138.html', 'Cheque Bounce / Sec 138'],
  ['/credit-score-guidance.html', 'Credit Score Guidance'],
  ['/loan-settlement-delhi.html', 'Loan Settlement in Delhi'],
];

export const FOOTER_COMPANY = [
  ['/about.html', 'About Us'],
  ['/process.html', 'Our Process'],
  ['/blog.html', 'Resources & Guides'],
  ['/faq.html', 'FAQ'],
  ['/contact.html', 'Contact'],
  ['/editorial-policy.html', 'Editorial Policy'],
  ['/privacy-policy.html', 'Privacy Policy'],
  ['/terms.html', 'Terms & Conditions'],
  ['/disclaimer.html', 'Disclaimer'],
];
