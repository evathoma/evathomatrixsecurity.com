const fs = require('fs/promises');
const fsSync = require('fs');
const path = require('path');

const publicDirectory = path.join(__dirname, '../../public');
const generatedDirectory = path.join(__dirname, '../generated');
const siteUrl = new URL(process.env.SITE_URL || 'https://www.evathomatrixsecurity.com').origin;
const socialImage = `${siteUrl}/assets/images/og-cover.png`;

function loadGeneratedManifest(fileName) {
  const manifestPath = path.join(generatedDirectory, fileName);
  if (!fsSync.existsSync(manifestPath)) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Required production build manifest is missing: ${manifestPath}`);
    }
    return null;
  }

  return JSON.parse(fsSync.readFileSync(manifestPath, 'utf8'));
}

const assetManifest = loadGeneratedManifest('asset-manifest.json');
const imageManifest = loadGeneratedManifest('image-manifest.json');

const pages = [
  {
    path: '/',
    file: 'index.html',
    title: 'Security Company in Tanzania | Evatho Matrix',
    description: 'Security guards, patrols, CCTV, K9, cash-in-transit and emergency response in Tanzania. Walinzi, doria na huduma za ulinzi Dar es Salaam.',
    changeFrequency: 'weekly',
    priority: '1.0',
  },
  {
    path: '/pages/about.html',
    file: 'pages/about.html',
    title: 'About Evatho Matrix | Security Company Tanzania',
    description: 'Meet Evatho Matrix Security Limited, a Tanzanian security company established in 2012. Jifunze kuhusu kampuni yetu ya ulinzi Tanzania.',
    changeFrequency: 'monthly',
    priority: '0.7',
  },
  {
    path: '/pages/services.html',
    file: 'pages/services.html',
    title: 'Security Services in Tanzania | Evatho Matrix',
    description: 'Manned and armed guarding, cash-in-transit, mobile patrol, K9, CCTV, metal detectors and ambulance services. Huduma za ulinzi Tanzania.',
    changeFrequency: 'monthly',
    priority: '0.9',
  },
  {
    path: '/pages/coverage.html',
    file: 'pages/coverage.html',
    title: 'Security Coverage in Tanzania | Evatho Matrix',
    description: 'Security coverage across Tanzania from Sinza B, Dar es Salaam. Tunatoa huduma za ulinzi na doria kwa biashara kote nchini.',
    changeFrequency: 'monthly',
    priority: '0.8',
  },
  {
    path: '/pages/contact.html',
    file: 'pages/contact.html',
    title: 'Contact Security Services | Dar es Salaam | Evatho Matrix',
    description: 'Contact our Sinza B, Dar es Salaam team for security guards, patrol, CCTV, K9 and cash transport. Wasiliana nasi kwa huduma za ulinzi.',
    changeFrequency: 'yearly',
    priority: '0.8',
  },
  {
    path: '/pages/careers.html',
    file: 'pages/careers.html',
    title: 'Security Jobs in Tanzania | Evatho Matrix',
    description: 'Explore security officer, cash-in-transit and K9 handler careers in Dar es Salaam. Nafasi za kazi za ulinzi Tanzania.',
    changeFrequency: 'monthly',
    priority: '0.6',
  },
];

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character]));
}

function getImageMetadata(source) {
  if (!imageManifest || !source) return null;
  const sourcePath = decodeURIComponent(new URL(source, siteUrl).pathname);
  return imageManifest.images[sourcePath] || null;
}

function getImageSrcset(image) {
  return image.srcset;
}

function getImageSizes(imageTag, isHero, isLogo) {
  if (isHero) return '(max-width: 600px) calc(100vw - 24px), 400px';
  if (isLogo) return '48px';
  if (/\bclient-card\b/i.test(imageTag)) {
    return '(max-width: 640px) 80vw, (max-width: 1024px) 33vw, 25vw';
  }
  if (/\bservice-card\b|\bgallery-item\b/i.test(imageTag)) {
    return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
  }
  return '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';
}

function setImageAttribute(imageTag, name, value) {
  const attribute = new RegExp(`(^|\\s)${name}\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s>]+)`, 'i');
  const escapedValue = escapeHtml(String(value));
  if (attribute.test(imageTag)) {
    return imageTag.replace(attribute, `$1${name}="${escapedValue}"`);
  }
  return imageTag.replace(/<img\b/i, `<img ${name}="${escapedValue}"`);
}

function getPageBundles(page) {
  if (!assetManifest) return null;
  const javascript = page.path === '/'
    ? assetManifest.javascript.home
    : page.path === '/pages/contact.html'
      ? assetManifest.javascript.contact
      : page.path === '/pages/coverage.html'
        ? assetManifest.javascript.coverage
        : assetManifest.javascript.standard;
  const stylesheet = page.path === '/'
    ? assetManifest.stylesheets.home
    : page.path === '/pages/coverage.html'
      ? assetManifest.stylesheets.coverage
      : assetManifest.stylesheets.standard;

  return { javascript, stylesheet };
}

function getStructuredData(page, canonicalUrl) {
  const organizationId = `${siteUrl}/#organization`;
  const websiteId = `${siteUrl}/#website`;
  const organization = {
    '@type': 'LocalBusiness',
    '@id': organizationId,
    name: 'Evatho Matrix Security Limited',
    alternateName: [
      'Evatho Matrix Security',
      'Evatho Matrix',
      'www.evathomatrixsecurity.com',
    ],
    url: siteUrl,
    logo: `${siteUrl}/assets/images/site/img/evatho_logo-HD+.png`,
    image: socialImage,
    description: 'A Tanzanian security company providing guarding, patrol, cash-in-transit, K9, CCTV and emergency response services.',
    foundingDate: '2012',
    telephone: '+255758704777',
    email: 'info@evathomatrixsecurity.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Sinza B',
      addressLocality: 'Dar es Salaam',
      addressCountry: 'TZ',
    },
    areaServed: {
      '@type': 'Country',
      name: 'Tanzania',
    },
  };
  const graph = [
    organization,
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: siteUrl,
      name: 'Evatho Matrix Security Limited',
      alternateName: 'www.evathomatrixsecurity.com',
      publisher: { '@id': organizationId },
      inLanguage: ['en-TZ', 'sw-TZ'],
    },
    {
      '@type': 'WebPage',
      '@id': `${canonicalUrl}#webpage`,
      url: canonicalUrl,
      name: page.title,
      description: page.description,
      isPartOf: { '@id': websiteId },
      about: { '@id': organizationId },
      inLanguage: ['en-TZ', 'sw-TZ'],
    },
  ];

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function renderPageMetadata(html, page) {
  const canonicalUrl = `${siteUrl}${page.path}`;
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const structuredData = getStructuredData(page, canonicalUrl);
  const heroImage = imageManifest?.images['/assets/images/a8.png'];
  const heroPreload = heroImage
    ? `<link rel="preload" as="image" href="${escapeHtml(heroImage.webp)}" type="image/webp" fetchpriority="high">`
    : '<link rel="preload" as="image" href="/assets/images/a8.png" fetchpriority="high">';
  const metadata = [
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<meta name="theme-color" content="#101d33">',
    '<meta name="application-name" content="Evatho Matrix Security | www.evathomatrixsecurity.com">',
    '<meta name="robots" content="index, follow, max-image-preview:large">',
    `<title>${title}</title>`,
    `<meta name="description" content="${description}">`,
    `<link rel="canonical" href="${canonicalUrl}">`,
    '<link rel="icon" href="/assets/images/site/img/evatho_logo-HD+.png" type="image/png">',
    '<link rel="apple-touch-icon" href="/assets/images/site/img/evatho_logo-HD+.png">',
    ...(page.path === '/' ? [heroPreload] : []),
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${description}">`,
    `<meta property="og:image" content="${socialImage}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    `<meta property="og:url" content="${canonicalUrl}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="Evatho Matrix Security | www.evathomatrixsecurity.com">',
    '<meta property="og:locale" content="en_TZ">',
    `<script type="application/ld+json">${structuredData}</script>`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${description}">`,
    `<meta name="twitter:image" content="${socialImage}">`,
  ].join('\n  ');

  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  if (!headMatch) {
    throw new Error(`HTML page "${page.file}" does not contain a head element.`);
  }

  let retainedHead = headMatch[1]
    .replace(/<meta\b(?=[^>]*\bcharset\s*=)[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\bname\s*=\s*["']viewport["'])[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\bname\s*=\s*["']description["'])[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\bproperty\s*=\s*["']og:)[^>]*>/gi, '')
    .replace(/<meta\b(?=[^>]*\bname\s*=\s*["']twitter:)[^>]*>/gi, '')
    .replace(/<link\b(?=[^>]*\brel\s*=\s*["']canonical["'])[^>]*>/gi, '')
    .replace(/<link\b(?=[^>]*\brel\s*=\s*["'](?:icon|apple-touch-icon)["'])[^>]*>/gi, '')
    .replace(/<title\b[^>]*>[\s\S]*?<\/title>/gi, '')
    .trim();

  const bundles = getPageBundles(page);
  if (bundles) {
    retainedHead = retainedHead.replace(/<link\b(?=[^>]*\brel\s*=\s*["']stylesheet["'])[^>]*>/gi, '');
  }

  let accessibleHtml = html.replace(/<img\b[^>]*>/gi, (imageTag) => {
    let optimizedTag = imageTag;
    const source = imageTag.match(/\bsrc\s*=\s*["']([^"']*)["']/i)?.[1] || '';
    const isLogo = /evatho_logo/i.test(source);
    const isHero = /\bclass\s*=\s*["'][^"']*\bhero-background\b/i.test(imageTag);
    const image = getImageMetadata(source);

    if (!/\balt\s*=/i.test(optimizedTag)) {
      optimizedTag = setImageAttribute(optimizedTag, 'alt', isHero ? '' : isLogo ? 'Evatho Matrix Security Limited logo' : 'Gallery image preview');
    } else if (!isHero && /\balt\s*=\s*(["'])\s*\1/i.test(optimizedTag)) {
      optimizedTag = optimizedTag.replace(/\balt\s*=\s*(["'])\s*\1/i, `alt="${isLogo ? 'Evatho Matrix Security Limited logo' : 'Gallery image preview'}"`);
    }

    if (!/\bloading\s*=/i.test(optimizedTag) || isHero) {
      optimizedTag = setImageAttribute(optimizedTag, 'loading', isHero || isLogo ? 'eager' : 'lazy');
    }
    if (!/\bdecoding\s*=/i.test(optimizedTag)) {
      optimizedTag = setImageAttribute(optimizedTag, 'decoding', 'async');
    }
    if (isHero) {
      optimizedTag = setImageAttribute(optimizedTag, 'fetchpriority', 'high');
    }

    if (!image) return optimizedTag;

    optimizedTag = setImageAttribute(optimizedTag, 'width', image.width);
    optimizedTag = setImageAttribute(optimizedTag, 'height', image.height);
    const sizes = getImageSizes(imageTag, isHero, isLogo);
    const pictureClass = isHero ? 'responsive-image hero-background-picture' : 'responsive-image';
    const sourceTag = `<source type="image/webp" srcset="${escapeHtml(getImageSrcset(image))}" sizes="${sizes}">`;
    return `<picture class="${pictureClass}">${sourceTag}${optimizedTag}</picture>`;
  });

  accessibleHtml = accessibleHtml.replace(/<main\b(?![^>]*\bid\s*=)([^>]*)>/i, '<main id="main-content"$1>');
  if (!/<main\b/i.test(accessibleHtml)) {
    accessibleHtml = accessibleHtml.replace(/<\/header>([\s\S]*?)<section\b([^>]*)>/i, '</header>$1<section id="main-content"$2>');
  }
  accessibleHtml = accessibleHtml.replace(/<body\b[^>]*>/i, (bodyTag) => `${bodyTag}\n  <a class="skip-link" href="#main-content">Skip to main content</a>`);
  if (bundles) {
    accessibleHtml = accessibleHtml.replace(/<script\b(?=[^>]*\bsrc\s*=\s*["']\/js\/)[^>]*>\s*<\/script>/gi, '');
    accessibleHtml = accessibleHtml.replace(/<\/body>/i, `<script defer src="${bundles.javascript}"></script>\n</body>`);
  } else {
    accessibleHtml = accessibleHtml.replace(/<script\b(?=[^>]*\bsrc\s*=)(?![^>]*\bdefer\b)([^>]*)>/gi, '<script defer$1>');
  }
  const stylesheet = bundles
    ? `<link rel="stylesheet" href="${bundles.stylesheet}">`
    : '<link rel="stylesheet" href="/css/a11y-responsive.css?v=4">';
  accessibleHtml = accessibleHtml.replace(headMatch[0], `<head>\n  ${metadata}\n  ${retainedHead}\n  ${stylesheet}\n</head>`);
  return accessibleHtml;
}

async function serveSeoPage(req, res, next) {
  const page = pages.find((candidate) => candidate.path === req.path);
  if (!page) {
    return next();
  }

  try {
    const html = await fs.readFile(path.join(publicDirectory, page.file), 'utf8');
    res
      .type('html')
      .set('Cache-Control', 'public, max-age=300, must-revalidate')
      .send(renderPageMetadata(html, page));
  } catch (error) {
    next(error);
  }
}

async function serveSitemap(req, res, next) {
  try {
    const urls = await Promise.all(pages.map(async (page) => {
      const filePath = path.join(publicDirectory, page.file);
      const stats = await fs.stat(filePath);
      const lastModified = stats.mtime.toISOString().slice(0, 10);

      return [
        '  <url>',
        `    <loc>${siteUrl}${page.path}</loc>`,
        `    <lastmod>${lastModified}</lastmod>`,
        `    <changefreq>${page.changeFrequency}</changefreq>`,
        `    <priority>${page.priority}</priority>`,
        '  </url>',
      ].join('\n');
    }));

    res
      .type('application/xml')
      .set('Cache-Control', 'public, max-age=3600')
      .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  pages,
  serveSeoPage,
  serveSitemap,
};
