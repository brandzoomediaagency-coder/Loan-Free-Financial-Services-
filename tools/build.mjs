#!/usr/bin/env node
// Static site build for www.loanfree.info. Zero dependencies (Node 18+).
//
//   node tools/build.mjs              build src/ -> dist/
//   node tools/build.mjs --sync-vercel  also rewrite the redirect list in vercel.json
//
// Page sources live in src/pages/**.html. Each starts with a JSON front-matter
// comment (<!--page {...} -->) followed by the page-owned body. The build adds
// the shared header/footer/CTA/forms, generates <head> metadata and JSON-LD,
// converts icons to an SVG sprite, wraps images in responsive <picture>,
// fingerprints CSS/JS and writes sitemap.xml, robots.txt and llms.txt.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { SITE } from '../src/site.config.mjs';
import * as tpl from '../src/templates.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
const BUILD_DIR = '/assets/build';
const { esc } = tpl;

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
  d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);
const hash = (buf) => crypto.createHash('sha256').update(buf).digest('hex').slice(0, 10);
const write = (rel, data) => {
  const out = path.join(DIST, rel);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, data);
};
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/&#39;|&rsquo;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- pages
function loadPages() {
  const dir = path.join(SRC, 'pages');
  const withDrafts = process.argv.includes('--drafts');
  return walk(dir).filter((f) => f.endsWith('.html')).map((file) => {
    const raw = fs.readFileSync(file, 'utf8');
    const m = raw.match(/^<!--page\s*([\s\S]*?)\s*-->\s*/);
    if (!m) throw new Error(`Missing front matter: ${file}`);
    let fm;
    try { fm = JSON.parse(m[1]); } catch (e) { throw new Error(`Bad front matter JSON in ${file}: ${e.message}`); }
    const rel = path.relative(dir, file).split(path.sep).join('/');
    const urlPath = rel === 'index.html' ? '/' : rel.endsWith('/index.html') ? '/' + rel.slice(0, -10) : '/' + rel;
    const body = raw.slice(m[0].length);
    const h1 = (body.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
    return {
      lang: 'en', index: true, ...fm, rel, path: urlPath, body,
      slug: rel.replace(/\.html$/, '').replace(/\//g, '-').replace(/-index$/, '') || 'home',
      h1: fm.h1 || (h1 ? text(h1) : fm.title),
    };
  }).filter((p) => {
    // Drafts (unreviewed legal or Hindi content) are never in a production build.
    if (p.status !== 'draft') return true;
    if (!withDrafts) return false;
    p.index = false;
    p.body = `<div class="draft-banner" role="note"><strong>DRAFT — not published.</strong> ${p.draftNote || 'Awaiting expert review before publication.'}</div>\n` + p.body;
    return true;
  });
}

// ---------------------------------------------------------------- assets
function buildCss() {
  const files = ['fonts.css', 'base.css', 'components.css'].map((f) => path.join(SRC, 'css', f)).filter(fs.existsSync);
  let css = files.map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  css = css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s*\n\s*/g, '\n').replace(/\n+/g, '\n')
    .replace(/\s*([{};,])\s*/g, '$1').replace(/;}/g, '}').trim();
  const name = `site.${hash(css)}.css`;
  write(`${BUILD_DIR}/${name}`, css);
  return `${BUILD_DIR}/${name}`;
}

function buildJs() {
  const js = fs.readFileSync(path.join(SRC, 'js', 'site.js'), 'utf8');
  const name = `site.${hash(js)}.js`;
  write(`${BUILD_DIR}/${name}`, js);
  return `${BUILD_DIR}/${name}`;
}

// Font Awesome Free icons (CC BY 4.0) subset into one sprite.
const ICON_ALIASES = {
  'money-check-dollar': 'money-check', 'file-invoice-dollar': 'file-invoice', 'comments-dollar': 'comments',
  'hand-holding-dollar': 'indian-rupee-sign', 'search-dollar': 'magnifying-glass-chart', 'rupee-sign': 'indian-rupee-sign',
  'times': 'xmark', 'balance-scale': 'scale-balanced', 'shield-alt': 'shield-halved', 'map-marker-alt': 'location-dot',
  'info-circle': 'circle-info', 'check-circle': 'circle-check', 'exclamation-triangle': 'triangle-exclamation',
  'search': 'magnifying-glass', 'mobile-alt': 'mobile-screen-button', 'file-alt': 'file-lines', 'history': 'clock-rotate-left',
  'bank': 'building-columns', 'calendar-alt': 'calendar-check',
};
const usedIcons = new Set();
function iconSvg(name) {
  name = ICON_ALIASES[name] || name;
  if (!fs.existsSync(path.join(SRC, 'icons', name + '.svg'))) throw new Error(`Unknown icon: ${name}`);
  usedIcons.add(name);
  return `<svg class="i i-${name}" aria-hidden="true" focusable="false"><use href="__ICONS__#${name}"></use></svg>`;
}
function buildSprite() {
  const symbols = [...usedIcons].sort().map((name) => {
    const svg = fs.readFileSync(path.join(SRC, 'icons', name + '.svg'), 'utf8');
    const viewBox = svg.match(/viewBox="([^"]+)"/)[1];
    const inner = svg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/<!--[\s\S]*?-->/g, '');
    return `<symbol id="${name}" viewBox="${viewBox}">${inner}</symbol>`;
  }).join('');
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg"><!-- Icons: Font Awesome Free 6.4.0, CC BY 4.0, https://fontawesome.com/license/free -->${symbols}</svg>`;
  const name = `icons.${hash(sprite)}.svg`;
  write(`${BUILD_DIR}/${name}`, sprite);
  return `${BUILD_DIR}/${name}`;
}

// Responsive image variants created by tools/images.mjs: assets/img/<name>-<w>.webp
const variantIndex = new Map();
for (const f of fs.existsSync(path.join(ROOT, 'assets/img')) ? fs.readdirSync(path.join(ROOT, 'assets/img')) : []) {
  const m = f.match(/^(.+)-(\d+)\.webp$/);
  if (m) variantIndex.set(m[1], [...(variantIndex.get(m[1]) || []), Number(m[2])].sort((a, b) => a - b));
}
function pictureFor(imgTag) {
  const src = (imgTag.match(/\ssrc="\/assets\/([^"/]+)\.(jpe?g|png)"/) || []);
  const widths = src[1] && variantIndex.get(src[1]);
  if (!widths) return imgTag;
  const srcset = widths.map((w) => `/assets/img/${src[1]}-${w}.webp ${w}w`).join(', ');
  const sizes = (imgTag.match(/\sdata-sizes="([^"]+)"/) || [])[1] || '(max-width: 768px) 100vw, 50vw';
  const img = imgTag.replace(/\sdata-sizes="[^"]*"/, '').replace(/\sloading="[^"]*"/, '')
    .replace(/<img/, `<img loading="${/fetchpriority="high"/.test(imgTag) ? 'eager' : 'lazy'}"`)
    .replace(/(\sdecoding="[^"]*")?(\s*\/?>)$/, ' decoding="async"$2');
  return `<picture><source type="image/webp" srcset="${srcset}" sizes="${sizes}">${img}</picture>`;
}

// ---------------------------------------------------------------- structured data
const ORG_ID = `${SITE.origin}/#organization`;
function orgNode(full) {
  const node = { '@type': 'ProfessionalService', '@id': ORG_ID, name: SITE.name, alternateName: SITE.shortName, url: SITE.origin + '/' };
  if (!full) return node;
  Object.assign(node, {
    description: SITE.description,
    logo: { '@type': 'ImageObject', url: `${SITE.origin}/assets/brand/logo-512.png`, width: 512, height: 512 },
    image: `${SITE.origin}/assets/og/home.jpg`,
    telephone: SITE.phoneE164,
    email: SITE.email,
    address: { '@type': 'PostalAddress', streetAddress: SITE.address.street, addressLocality: SITE.address.locality, addressRegion: SITE.address.region, postalCode: SITE.address.postalCode, addressCountry: SITE.address.country },
    geo: { '@type': 'GeoCoordinates', latitude: SITE.geo.lat, longitude: SITE.geo.lng },
    areaServed: { '@type': 'Country', name: 'India' },
    openingHoursSpecification: { '@type': 'OpeningHoursSpecification', dayOfWeek: SITE.hours.days, opens: SITE.hours.opens, closes: SITE.hours.closes },
    contactPoint: { '@type': 'ContactPoint', telephone: SITE.phoneE164, contactType: 'customer service', areaServed: 'IN', availableLanguage: ['English', 'Hindi'] },
    knowsAbout: ['Loan settlement', 'One-time settlement', 'Credit card debt', 'Debt restructuring', 'Borrower rights in loan recovery', 'Credit reports after settlement'],
    sameAs: Object.values(SITE.social).filter(Boolean),
  });
  if (SITE.operatorConfirmed) node.legalName = SITE.operatorEntity;
  if (SITE.foundingDate) node.foundingDate = SITE.foundingDate;
  return node;
}

function faqFromBody(body) {
  const qs = [];
  for (const m of body.matchAll(/<button class="accordion-header"[^>]*>([\s\S]*?)<\/button>\s*<div class="accordion-content"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g)) {
    qs.push({ '@type': 'Question', name: text(m[1]), acceptedAnswer: { '@type': 'Answer', text: text(m[2]) } });
  }
  return qs;
}

function jsonLd(page, ogImage) {
  const url = SITE.origin + page.path;
  const full = ['home', 'about', 'contact'].includes(page.type) || page.path === '/loan-settlement-delhi.html';
  const graph = [orgNode(full)];
  if (page.type === 'home') {
    graph.push({ '@type': 'WebSite', '@id': `${SITE.origin}/#website`, url: SITE.origin + '/', name: SITE.name, publisher: { '@id': ORG_ID }, inLanguage: ['en-IN', 'hi-IN'] });
  }
  const crumbs = [[page.lang === 'hi' ? 'होम' : 'Home', page.lang === 'hi' ? '/hi/' : '/'], ...(page.breadcrumbs || [])];
  const webPageType = { about: 'AboutPage', contact: 'ContactPage', faq: 'FAQPage', collection: 'CollectionPage' }[page.type] || 'WebPage';
  const webPage = {
    '@type': webPageType, '@id': `${url}#webpage`, url, name: page.title, description: page.description,
    isPartOf: { '@id': `${SITE.origin}/#website` }, inLanguage: page.lang === 'hi' ? 'hi-IN' : 'en-IN',
    primaryImageOfPage: { '@type': 'ImageObject', url: ogImage },
  };
  if (page.dateModified) webPage.dateModified = page.dateModified;
  if (page.path !== '/') {
    webPage.breadcrumb = { '@id': `${url}#breadcrumb` };
    graph.push({
      '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`,
      itemListElement: crumbs.map(([name, href], i) => ({ '@type': 'ListItem', position: i + 1, name, ...(href || i < crumbs.length - 1 ? { item: SITE.origin + (href || page.path) } : { item: url }) })),
    });
  }
  graph.push(webPage);
  if (page.type === 'service' && page.service) {
    graph.push({
      '@type': 'Service', '@id': `${url}#service`, name: page.service.name, serviceType: page.service.serviceType || page.service.name,
      description: page.description, provider: { '@id': ORG_ID }, url,
      areaServed: page.path === '/loan-settlement-delhi.html' ? [{ '@type': 'City', name: 'Delhi' }, { '@type': 'Country', name: 'India' }] : { '@type': 'Country', name: 'India' },
    });
  }
  if (page.type === 'article') {
    const person = (id) => SITE.people.find((p) => p.id === id);
    const personNode = (p) => p && { '@type': 'Person', name: p.name, jobTitle: p.role, url: `${SITE.origin}/about.html#${p.id}`, ...(p.sameAs ? { sameAs: p.sameAs } : {}) };
    const article = {
      '@type': 'Article', '@id': `${url}#article`, headline: page.h1.slice(0, 110), description: page.description,
      mainEntityOfPage: { '@id': `${url}#webpage` }, inLanguage: page.lang === 'hi' ? 'hi-IN' : 'en-IN',
      image: [ogImage, ...(page.image ? [SITE.origin + page.image] : [])],
      datePublished: page.datePublished || page.dateModified, dateModified: page.dateModified,
      author: personNode(person(page.author)) || { '@id': ORG_ID }, publisher: { '@id': ORG_ID },
    };
    const reviewer = personNode(person(page.reviewer));
    if (reviewer) webPage.reviewedBy = reviewer;
    if (page.lastReviewed) webPage.lastReviewed = page.lastReviewed;
    graph.push(article);
  }
  const faq = page.index !== false ? faqFromBody(page.body) : [];
  if (faq.length >= 2) {
    if (webPageType === 'FAQPage') webPage.mainEntity = faq;
    else graph.push({ '@type': 'FAQPage', '@id': `${url}#faq`, mainEntity: faq, isPartOf: { '@id': `${url}#webpage` } });
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

// ---------------------------------------------------------------- head
function head(page, assets) {
  const url = SITE.origin + page.path;
  const ogFile = `/assets/og/${page.slug}.jpg`;
  const ogImage = SITE.origin + (fs.existsSync(path.join(ROOT, ogFile)) ? ogFile : '/assets/og/home.jpg');
  const robots = page.index === false ? 'noindex, follow' : 'index, follow, max-image-preview:large, max-snippet:-1';
  const alt = page.alternates
    ? Object.entries(page.alternates).map(([l, href]) => `<link rel="alternate" hreflang="${l === 'hi' ? 'hi-IN' : 'en-IN'}" href="${SITE.origin + href}">`).join('\n') +
      `\n<link rel="alternate" hreflang="x-default" href="${SITE.origin + (page.alternates.en || page.path)}">`
    : '';
  const { ga4 } = SITE.analytics;
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(page.title)}</title>
<meta name="description" content="${esc(page.description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${url}">
${alt}
<meta name="theme-color" content="#102a43">
${page.type === 'home' ? `<meta name="google-site-verification" content="${SITE.analytics.gscVerification}">\n` : ''}<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" href="/assets/brand/favicon-32.png" sizes="32x32">
<link rel="apple-touch-icon" href="/assets/brand/apple-touch-icon.png">
<meta property="og:type" content="${page.type === 'article' ? 'article' : 'website'}">
<meta property="og:site_name" content="${SITE.name}">
<meta property="og:locale" content="${page.lang === 'hi' ? 'hi_IN' : 'en_IN'}">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(page.ogTitle || page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:image" content="${ogImage}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(page.h1)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preload" href="/assets/fonts/poppins-700-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${assets.css}">
<script>document.documentElement.classList.add('js');window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}(function(){var c=null;try{c=localStorage.getItem('lf_consent');}catch(e){}var g=c==='all'?'granted':'denied';gtag('consent','default',{analytics_storage:g,ad_storage:g,ad_user_data:g,ad_personalization:g,wait_for_update:500});})();gtag('js',new Date());gtag('config','${ga4}');</script>
<script async src="https://www.googletagmanager.com/gtag/js?id=${ga4}"></script>
<script src="${assets.js}" defer></script>
<script type="application/ld+json">${jsonLd(page, ogImage)}</script>`;
}

// ---------------------------------------------------------------- render
function render(page, pagesByPath, assets) {
  let body = page.body;
  body = body
    .replace(/<!-- lf:breadcrumbs -->/g, () => tpl.breadcrumbs(page))
    .replace(/<!-- lf:review-box -->/g, () => tpl.reviewBox(page))
    .replace(/<!-- lf:testimonials -->/g, () => tpl.testimonials())
    .replace(/<!-- lf:entity-facts -->/g, () => tpl.entityFacts())
    .replace(/<!-- lf:team -->/g, () => tpl.team())
    .replace(/<!-- lf:article-cards -->/g, () => tpl.articleCards([...pagesByPath.values()]))
    .replace(/<!-- lf:related(?: heading="([^"]*)")? -->/g, (_, h) => tpl.related(page, pagesByPath, h))
    .replace(/<!-- lf:cta(?: title="([^"]*)" text="([^"]*)")? -->/g, (_, title, txt) => tpl.ctaBand(page, { title, text: txt }))
    .replace(/<!-- lf:lead-form(?: id="([^"]*)")? -->/g, (_, id) => tpl.leadForm(page, id || 'lead-form', 'full'));

  let html = `<!DOCTYPE html>
<html lang="${page.lang === 'hi' ? 'hi' : 'en'}" data-wa="${SITE.whatsapp}" ${SITE.analytics.metaPixelPages.includes(page.path) ? ` data-meta-pixel="${SITE.analytics.metaPixel}"` : ''}>
<head>
${head(page, assets)}
</head>
<body class="page-${page.type}${page.bodyClass ? ' ' + page.bodyClass : ''}" data-page-type="${page.type}">
${tpl.header(page)}
<main id="main">
${body.trim()}
</main>
${tpl.footer(page)}
${tpl.globals(page)}
</body>
</html>
`;
  html = html
    .replace(/<i class="(?:fa[srb]?|fa-solid|fa-brands|fa-regular)\s+fa-([a-z0-9-]+)[^"]*"[^>]*><\/i>/g, (_, n) => iconSvg(n))
    .replace(/<img\b[^>]*>/g, (tag) => pictureFor(tag))
    .replace(/<a ([^>]*target="_blank"[^>]*)>/g, (m, attrs) => (/rel=/.test(attrs) ? m : `<a ${attrs} rel="noopener">`));
  return html;
}

// ---------------------------------------------------------------- outputs
function sitemap(pages) {
  const entries = pages.filter((p) => p.index !== false && p.sitemap !== false && p.type !== 'error')
    .sort((a, b) => (a.path === '/' ? -1 : b.path === '/' ? 1 : a.path.localeCompare(b.path)))
    .map((p) => {
      const alts = p.alternates ? Object.entries(p.alternates).map(([l, href]) =>
        `\n    <xhtml:link rel="alternate" hreflang="${l === 'hi' ? 'hi-IN' : 'en-IN'}" href="${SITE.origin + href}"/>`).join('') : '';
      return `  <url>\n    <loc>${SITE.origin + p.path}</loc>\n    <lastmod>${p.dateModified}</lastmod>${alts}\n  </url>`;
    });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries.join('\n')}\n</urlset>\n`;
}

function robots() {
  // A crawler obeys only the most specific group that names it, so every group
  // repeats the /api/ rule. The named groups document that AI crawlers are welcome.
  const bots = ['*', 'Googlebot', 'Bingbot', 'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'PerplexityBot', 'ClaudeBot', 'Claude-SearchBot', 'Google-Extended', 'Applebot-Extended'];
  return `# robots.txt for ${SITE.origin}
# All search engines and AI answer engines may crawl the public site.
${bots.map((b) => `User-agent: ${b}\nAllow: /\nDisallow: /api/\n`).join('\n')}
Sitemap: ${SITE.origin}/sitemap.xml
`;
}

function llms(pages) {
  const sec = (title, list) => `## ${title}\n\n${list.map((p) => `- [${p.h1}](${SITE.origin + p.path}): ${p.description}`).join('\n')}\n`;
  const live = pages.filter((p) => p.index !== false);
  return `# ${SITE.name}

> ${SITE.description}

- Office: ${SITE.address.lines.join(' ')} (India). Service: remote consultation across India by phone and WhatsApp.
- Contact: ${SITE.phoneDisplay} · ${SITE.email}
- Limitations: not a lender, bank, credit bureau or law firm; not regulated or approved by the Reserve Bank of India; no guaranteed waiver, timeline or credit-score outcome.

${sec('Services', live.filter((p) => p.type === 'service'))}
${sec('Guides', live.filter((p) => p.type === 'article'))}
${sec('About and policies', live.filter((p) => ['about', 'contact', 'legal', 'faq', 'page'].includes(p.type)))}`;
}

function syncVercel(pages) {
  const file = path.join(ROOT, 'vercel.json');
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  // Generated rules are recognised by shape (/x -> /x.html); Vercel rejects unknown keys.
  const isGenerated = (r) => !r.has && r.destination === r.source + '.html';
  const keep = (cfg.redirects || []).filter((r) => !isGenerated(r));
  const gen = pages.filter((p) => p.path.endsWith('.html') && p.type !== 'error').map((p) => ({
    source: p.path.replace(/\.html$/, ''), destination: p.path, permanent: true,
  }));
  cfg.redirects = [...keep, ...gen];
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
  console.log(`vercel.json: ${keep.length} fixed + ${gen.length} extension-less redirects`);
}

// ---------------------------------------------------------------- main
function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  const pages = loadPages();
  const pagesByPath = new Map(pages.map((p) => [p.path, p]));
  for (const p of pages) p.hasHindi = pagesByPath.has('/hi/');
  const assets = { css: buildCss(), js: buildJs() };

  const rendered = pages.map((p) => [p, render(p, pagesByPath, assets)]);
  const sprite = buildSprite();
  for (const [p, html] of rendered) {
    write(p.rel, html.replace(/__ICONS__/g, sprite));
  }

  // Static files copied as-is.
  const copy = (from, to = from) => {
    const src = path.join(ROOT, from);
    if (!fs.existsSync(src)) return;
    if (fs.statSync(src).isDirectory()) fs.cpSync(src, path.join(DIST, to), { recursive: true });
    else { fs.mkdirSync(path.dirname(path.join(DIST, to)), { recursive: true }); fs.copyFileSync(src, path.join(DIST, to)); }
  };
  copy('assets');
  copy('assets/brand/favicon.ico', 'favicon.ico');
  // Legacy logo URLs kept alive because social previews may still reference them.
  copy('logo.png'); copy('loan-free-logo.png'); copy('Loan Free Financial Services.png');

  write('sitemap.xml', sitemap(pages));
  write('robots.txt', robots());
  write('llms.txt', llms(pages));

  if (process.argv.includes('--sync-vercel')) syncVercel(pages);
  console.log(`Built ${pages.length} pages, ${usedIcons.size} icons -> dist/ (css ${assets.css}, js ${assets.js})`);
}

main();
