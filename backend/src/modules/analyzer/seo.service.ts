import axios from 'axios';
import type { CrawlResult } from './crawler.service';
import type { SEOCheck } from '../../common/types';

interface LinkCheckResult {
  url: string;
  status: number | null;
  ok: boolean;
}

async function checkLinkStatus(href: string, baseUrl: string): Promise<LinkCheckResult> {
  try {
    // Resolve relative URLs
    const absoluteUrl = new URL(href, baseUrl).toString();
    // Only check internal links
    const base = new URL(baseUrl);
    const link = new URL(absoluteUrl);
    if (link.hostname !== base.hostname) {
      return { url: absoluteUrl, status: null, ok: true }; // Skip external
    }

    const response = await axios.head(absoluteUrl, {
      timeout: 5000,
      validateStatus: () => true, // Don't throw on any status
    });

    return {
      url: absoluteUrl,
      status: response.status,
      ok: response.status < 400,
    };
  } catch {
    return { url: href, status: null, ok: false };
  }
}

export async function analyzeSEO(crawl: CrawlResult): Promise<SEOCheck[]> {
  const { $, url, finalUrl, isHttps, loadTimeMs } = crawl;
  const checks: SEOCheck[] = [];

  // ── 1. Title Tag ──────────────────────────────────────────────────────────
  const title = $('title').first().text().trim();
  const titleLen = title.length;
  checks.push({
    id: 'title_tag',
    name: 'Title Tag',
    category: 'meta',
    weight: 8,
    passed: titleLen >= 50 && titleLen <= 60,
    value: title || undefined,
    expected: '50-60 characters',
    message: !title
      ? 'No title tag found'
      : titleLen < 50
      ? `Title too short (${titleLen} chars). Aim for 50-60 characters.`
      : titleLen > 60
      ? `Title too long (${titleLen} chars). Keep it under 60 characters.`
      : `Title is ${titleLen} characters — perfect!`,
    severity: !title ? 'high' : 'medium',
  });

  // ── 2. Meta Description ───────────────────────────────────────────────────
  const metaDesc = $('meta[name="description"]').attr('content')?.trim() ?? '';
  const descLen = metaDesc.length;
  checks.push({
    id: 'meta_description',
    name: 'Meta Description',
    category: 'meta',
    weight: 8,
    passed: descLen >= 140 && descLen <= 160,
    value: metaDesc || undefined,
    expected: '140-160 characters',
    message: !metaDesc
      ? 'No meta description found'
      : descLen < 140
      ? `Description too short (${descLen} chars). Aim for 140-160.`
      : descLen > 160
      ? `Description too long (${descLen} chars). Keep under 160.`
      : `Meta description is ${descLen} characters — perfect!`,
    severity: !metaDesc ? 'high' : 'medium',
  });

  // ── 3. H1 Tag ─────────────────────────────────────────────────────────────
  const h1Tags = $('h1');
  const h1Count = h1Tags.length;
  checks.push({
    id: 'h1_tag',
    name: 'H1 Tag',
    category: 'structure',
    weight: 7,
    passed: h1Count === 1,
    value: h1Count > 0 ? h1Tags.first().text().trim() : undefined,
    expected: 'Exactly one H1 tag',
    message:
      h1Count === 0
        ? 'No H1 tag found — every page needs exactly one H1'
        : h1Count > 1
        ? `Found ${h1Count} H1 tags — use exactly one H1 per page`
        : 'H1 tag present and unique ✓',
    severity: h1Count === 0 ? 'high' : 'medium',
  });

  // ── 4. Heading Hierarchy (H2-H6) ──────────────────────────────────────────
  const hasH2 = $('h2').length > 0;
  checks.push({
    id: 'heading_hierarchy',
    name: 'Heading Hierarchy (H2-H6)',
    category: 'structure',
    weight: 5,
    passed: hasH2,
    value: `H2: ${$('h2').length}, H3: ${$('h3').length}, H4: ${$('h4').length}`,
    expected: 'At least one H2 tag for content structure',
    message: hasH2
      ? `Good heading structure found (${$('h2').length} H2s, ${$('h3').length} H3s)`
      : 'No H2 tags found — add subheadings to structure your content',
    severity: 'low',
  });

  // ── 5. Image Alt Tags ─────────────────────────────────────────────────────
  const allImages = $('img');
  const imagesWithoutAlt = $('img').filter((_, el) => {
    const alt = $(el).attr('alt');
    return alt === undefined || alt.trim() === '';
  });
  const imgCount = allImages.length;
  const missingAlt = imagesWithoutAlt.length;
  checks.push({
    id: 'image_alt_tags',
    name: 'Image Alt Tags',
    category: 'meta',
    weight: 7,
    passed: imgCount === 0 || missingAlt === 0,
    value: `${imgCount} images, ${missingAlt} missing alt`,
    expected: 'All images have non-empty alt attributes',
    message:
      imgCount === 0
        ? 'No images found on this page'
        : missingAlt === 0
        ? `All ${imgCount} images have alt attributes ✓`
        : `${missingAlt} of ${imgCount} images are missing alt text`,
    severity: missingAlt > 0 ? 'high' : 'low',
  });

  // ── 6. Canonical Tag ──────────────────────────────────────────────────────
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() ?? '';
  const canonicalIsValid = canonical !== '' && (canonical === finalUrl || canonical === url);
  checks.push({
    id: 'canonical_tag',
    name: 'Canonical Tag',
    category: 'technical',
    weight: 6,
    passed: canonical !== '',
    value: canonical || undefined,
    expected: 'Canonical tag pointing to the page URL',
    message: !canonical
      ? 'No canonical tag found — add one to prevent duplicate content issues'
      : canonicalIsValid
      ? 'Canonical tag present and correctly set ✓'
      : `Canonical tag found but points to different URL: ${canonical}`,
    severity: !canonical ? 'medium' : 'low',
  });

  // ── 7. Open Graph Tags ────────────────────────────────────────────────────
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const ogDesc = $('meta[property="og:description"]').attr('content');
  const ogImage = $('meta[property="og:image"]').attr('content');
  const ogPassed = !!(ogTitle && ogDesc && ogImage);
  const missingOg = [
    !ogTitle && 'og:title',
    !ogDesc && 'og:description',
    !ogImage && 'og:image',
  ].filter(Boolean);
  checks.push({
    id: 'open_graph_tags',
    name: 'Open Graph Tags',
    category: 'meta',
    weight: 5,
    passed: ogPassed,
    value: ogPassed ? `og:title, og:description, og:image all present` : undefined,
    expected: 'og:title, og:description, og:image all present',
    message: ogPassed
      ? 'All Open Graph tags present ✓'
      : `Missing OG tags: ${missingOg.join(', ')}`,
    severity: 'medium',
  });

  // ── 8. Twitter Card Tags ──────────────────────────────────────────────────
  const twitterCard = $('meta[name="twitter:card"]').attr('content');
  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  const twitterPassed = !!(twitterCard && twitterTitle);
  checks.push({
    id: 'twitter_card_tags',
    name: 'Twitter Card Tags',
    category: 'meta',
    weight: 4,
    passed: twitterPassed,
    value: twitterCard || undefined,
    expected: 'twitter:card and twitter:title present',
    message: twitterPassed
      ? 'Twitter Card tags present ✓'
      : `Missing: ${!twitterCard ? 'twitter:card' : ''} ${!twitterTitle ? 'twitter:title' : ''}`.trim(),
    severity: 'low',
  });

  // ── 9. Schema Markup ──────────────────────────────────────────────────────
  const jsonLdBlocks = $('script[type="application/ld+json"]');
  const schemaCount = jsonLdBlocks.length;
  let validSchema = false;
  jsonLdBlocks.each((_, el) => {
    try {
      const content = $(el).html();
      if (content) {
        JSON.parse(content);
        validSchema = true;
      }
    } catch {
      // Invalid JSON-LD
    }
  });
  checks.push({
    id: 'schema_markup',
    name: 'Schema Markup (JSON-LD)',
    category: 'technical',
    weight: 8,
    passed: validSchema,
    value: schemaCount > 0 ? `${schemaCount} JSON-LD block(s)` : undefined,
    expected: 'At least one valid JSON-LD schema block',
    message: !schemaCount
      ? 'No schema markup found — add JSON-LD schema to help search engines understand your content'
      : !validSchema
      ? `Found ${schemaCount} schema block(s) but JSON is invalid`
      : `${schemaCount} valid JSON-LD schema block(s) found ✓`,
    severity: !validSchema ? 'high' : 'low',
  });

  // ── 10. FAQ Schema ────────────────────────────────────────────────────────
  let hasFaqSchema = false;
  let hasFaqSection = false;
  jsonLdBlocks.each((_, el) => {
    try {
      const data = JSON.parse($(el).html() ?? '{}');
      if (data['@type'] === 'FAQPage') hasFaqSchema = true;
    } catch {}
  });
  // Check for FAQ section in content
  const headingText = $('h2, h3, h4').map((_, el) => $(el).text().toLowerCase()).get();
  hasFaqSection = headingText.some(
    (t) => t.includes('faq') || t.includes('frequently asked') || t.includes('questions')
  );
  checks.push({
    id: 'faq_schema',
    name: 'FAQ Schema',
    category: 'technical',
    weight: 6,
    passed: !hasFaqSection || hasFaqSchema,
    value: hasFaqSchema ? 'FAQPage schema present' : undefined,
    expected: 'FAQPage schema present when FAQ section is detected',
    message: hasFaqSchema
      ? 'FAQPage JSON-LD schema found ✓'
      : hasFaqSection
      ? 'FAQ section detected but no FAQPage schema — add JSON-LD for AI Overviews'
      : 'No FAQ section detected (not required)',
    severity: hasFaqSection && !hasFaqSchema ? 'medium' : 'low',
  });

  // ── 11. robots.txt ────────────────────────────────────────────────────────
  let robotsOk = false;
  try {
    const baseUrl = new URL(finalUrl).origin;
    const robotsRes = await axios.get(`${baseUrl}/robots.txt`, { timeout: 5000 });
    robotsOk = robotsRes.status === 200 && typeof robotsRes.data === 'string';
  } catch {}
  checks.push({
    id: 'robots_txt',
    name: 'robots.txt',
    category: 'technical',
    weight: 5,
    passed: robotsOk,
    expected: 'Accessible at /robots.txt with valid content',
    message: robotsOk
      ? 'robots.txt is accessible ✓'
      : 'robots.txt not found or not accessible — add one to guide search engine crawlers',
    severity: 'medium',
  });

  // ── 12. sitemap.xml ───────────────────────────────────────────────────────
  let sitemapOk = false;
  try {
    const baseUrl = new URL(finalUrl).origin;
    const sitemapRes = await axios.get(`${baseUrl}/sitemap.xml`, { timeout: 5000 });
    sitemapOk =
      sitemapRes.status === 200 &&
      typeof sitemapRes.data === 'string' &&
      sitemapRes.data.includes('<urlset');
  } catch {}
  checks.push({
    id: 'sitemap_xml',
    name: 'sitemap.xml',
    category: 'technical',
    weight: 5,
    passed: sitemapOk,
    expected: 'Accessible, valid XML with <urlset>',
    message: sitemapOk
      ? 'sitemap.xml is accessible and valid ✓'
      : 'sitemap.xml not found — create one and submit to Google Search Console',
    severity: 'medium',
  });

  // ── 13. Broken Links (internal) ───────────────────────────────────────────
  const internalLinks: string[] = [];
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (
      href &&
      !href.startsWith('#') &&
      !href.startsWith('mailto:') &&
      !href.startsWith('tel:')
    ) {
      try {
        const resolved = new URL(href, finalUrl).toString();
        const base = new URL(finalUrl);
        const link = new URL(resolved);
        if (link.hostname === base.hostname) {
          internalLinks.push(resolved);
        }
      } catch {}
    }
  });

  // Check up to 10 internal links for broken status
  const linksToCheck = [...new Set(internalLinks)].slice(0, 10);
  const linkResults = await Promise.all(linksToCheck.map((l) => checkLinkStatus(l, finalUrl)));
  const brokenLinks = linkResults.filter((r) => !r.ok);

  checks.push({
    id: 'broken_links',
    name: 'Broken Internal Links',
    category: 'technical',
    weight: 8,
    passed: brokenLinks.length === 0,
    value:
      linksToCheck.length > 0
        ? `Checked ${linksToCheck.length} links, ${brokenLinks.length} broken`
        : undefined,
    expected: 'No internal 404/500 responses',
    message:
      linksToCheck.length === 0
        ? 'No internal links found to check'
        : brokenLinks.length === 0
        ? `All ${linksToCheck.length} internal links are working ✓`
        : `Found ${brokenLinks.length} broken link(s): ${brokenLinks
            .slice(0, 3)
            .map((l) => l.url)
            .join(', ')}`,
    severity: brokenLinks.length > 0 ? 'high' : 'low',
  });

  // ── 14. HTTPS ─────────────────────────────────────────────────────────────
  checks.push({
    id: 'https',
    name: 'HTTPS Security',
    category: 'technical',
    weight: 5,
    passed: isHttps,
    value: isHttps ? 'HTTPS' : 'HTTP',
    expected: 'Page served over HTTPS',
    message: isHttps ? 'Page is served over HTTPS ✓' : 'Page is not using HTTPS — migrate immediately',
    severity: isHttps ? 'low' : 'high',
  });

  // ── 15. Page Load Speed ───────────────────────────────────────────────────
  const loadTimeSeconds = loadTimeMs / 1000;
  const loadTimePassed = loadTimeSeconds <= 3;
  checks.push({
    id: 'page_load_speed',
    name: 'Page Load Speed',
    category: 'performance',
    weight: 7,
    passed: loadTimePassed,
    value: `${loadTimeSeconds.toFixed(2)}s`,
    expected: 'Under 3 seconds',
    message: loadTimePassed
      ? `Page loaded in ${loadTimeSeconds.toFixed(2)}s ✓`
      : `Page took ${loadTimeSeconds.toFixed(2)}s to load — optimize images, scripts, and server response time`,
    severity: loadTimeSeconds > 5 ? 'high' : loadTimeSeconds > 3 ? 'medium' : 'low',
  });

  // ── 16. Mobile Viewport ───────────────────────────────────────────────────
  const viewport = $('meta[name="viewport"]').attr('content');
  const hasViewport = !!(viewport && viewport.includes('width=device-width'));
  checks.push({
    id: 'mobile_viewport',
    name: 'Mobile Viewport',
    category: 'technical',
    weight: 6,
    passed: hasViewport,
    value: viewport || undefined,
    expected: 'viewport meta tag with width=device-width',
    message: hasViewport
      ? 'Mobile viewport meta tag present ✓'
      : 'No viewport meta tag — your site may not be mobile-friendly',
    severity: hasViewport ? 'low' : 'high',
  });

  return checks;
}

export function calculateSEOScore(checks: SEOCheck[]): number {
  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = checks
    .filter((c) => c.passed)
    .reduce((sum, c) => sum + c.weight, 0);

  return totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 100) : 0;
}
