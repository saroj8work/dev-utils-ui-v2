import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderSeoContent, SEO_PAGES } from '../src/seoPages.js';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputDirectory = resolve(projectRoot, 'dist');
const builtTemplate = await readFile(resolve(outputDirectory, 'index.html'), 'utf8');
const siteUrlValue = process.env.SITE_URL?.trim();
let siteUrl = '';

if (siteUrlValue) {
  let parsedUrl;
  try {
    parsedUrl = new URL(siteUrlValue);
  } catch {
    throw new Error('SITE_URL must be an absolute http or https URL, such as https://example.com.');
  }
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('SITE_URL must use http or https.');
  }
  siteUrl = parsedUrl.origin;
}

function escapeAttribute(value) {
  return value.replace(/[&"]/g, (character) => (character === '&' ? '&amp;' : '&quot;'));
}

function createPageHtml(page) {
  let html = builtTemplate
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeAttribute(page.title)}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"\s*\/?>/,
      `<meta name="description" content="${escapeAttribute(page.description)}" />`,
    )
    .replace(
      /<!--SEO_CONTENT_START-->[\s\S]*?<!--SEO_CONTENT_END-->/,
      `<!--SEO_CONTENT_START-->\n    <div id="seo-content-container">${renderSeoContent(page)}</div>\n    <!--SEO_CONTENT_END-->`,
    );

  const socialMetadata = [
    `<meta property="og:type" content="website" />`,
    `<meta property="og:title" content="${escapeAttribute(page.title)}" />`,
    `<meta property="og:description" content="${escapeAttribute(page.description)}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ];
  if (siteUrl) {
    const canonicalUrl = `${siteUrl}${page.route}`;
    socialMetadata.push(
      `<link rel="canonical" href="${escapeAttribute(canonicalUrl)}" />`,
      `<meta property="og:url" content="${escapeAttribute(canonicalUrl)}" />`,
    );
  }
  return html.replace('</head>', `    ${socialMetadata.join('\n    ')}\n  </head>`);
}

for (const page of SEO_PAGES) {
  const outputPath = page.slug
    ? resolve(outputDirectory, page.slug, 'index.html')
    : resolve(outputDirectory, 'index.html');
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, createPageHtml(page));
}

const robotsContent = [
  'User-agent: *',
  'Allow: /',
  ...(siteUrl ? [`Sitemap: ${siteUrl}/sitemap.xml`] : []),
  '',
].join('\n');
await writeFile(resolve(outputDirectory, 'robots.txt'), robotsContent);

if (siteUrl) {
  const sitemapUrls = SEO_PAGES.map((page) => `  <url><loc>${siteUrl}${page.route}</loc></url>`).join('\n');
  await writeFile(
    resolve(outputDirectory, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>\n`,
  );
}
