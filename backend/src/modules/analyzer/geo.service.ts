import type { CrawlResult } from './crawler.service';
import type { GEOCheck } from '../../common/types';

export function analyzeGEO(crawl: CrawlResult): GEOCheck[] {
  const { $, bodyText, wordCount } = crawl;
  const checks: GEOCheck[] = [];

  // ── 1. Entity Coverage ────────────────────────────────────────────────────
  // Check for named entities: links, proper nouns, capitalized words, brands mentioned
  const links = $('a[href]')
    .map((_, el) => $(el).attr('href') ?? '')
    .get()
    .filter((h) => h.startsWith('http'));
  const externalLinks = links.length;
  const capitalizedWordMatches = bodyText.match(/\b[A-Z][a-z]{2,}\b/g) ?? [];
  const uniqueCapitalized = new Set(capitalizedWordMatches).size;

  checks.push({
    id: 'geo_entity_coverage',
    name: 'Entity Coverage',
    maxPoints: 20,
    earnedPoints:
      uniqueCapitalized >= 15 && externalLinks >= 3
        ? 20
        : uniqueCapitalized >= 8
        ? 12
        : uniqueCapitalized >= 3
        ? 6
        : 0,
    passed: uniqueCapitalized >= 8,
    details:
      uniqueCapitalized >= 15
        ? `Strong entity coverage: ${uniqueCapitalized} named entities with ${externalLinks} external links ✓`
        : uniqueCapitalized >= 8
        ? `Moderate entity coverage: ${uniqueCapitalized} named entities. Add more brand/tool references.`
        : `Weak entity coverage: only ${uniqueCapitalized} named entities. LLMs need rich entity signals to cite your content.`,
  });

  // ── 2. Citation / Reference Signals ───────────────────────────────────────
  // Statistics, numbers with %, authoritative external links
  const statsMatches = bodyText.match(/\d+(\.\d+)?%|\$\d+|\d+ (million|billion|thousand)/gi) ?? [];
  const hasStats = statsMatches.length >= 2;
  const authorityDomains = ['.gov', '.edu', '.org', 'wikipedia', 'pubmed', 'scholar.google'];
  const hasAuthorityLinks = links.some((l) => authorityDomains.some((d) => l.includes(d)));

  checks.push({
    id: 'geo_citation_signals',
    name: 'Citation & Reference Signals',
    maxPoints: 20,
    earnedPoints: hasStats && hasAuthorityLinks ? 20 : hasStats || hasAuthorityLinks ? 12 : 0,
    passed: hasStats || externalLinks >= 2,
    details:
      hasStats && hasAuthorityLinks
        ? `Strong citation signals: statistics (${statsMatches.length} found) + authoritative links ✓`
        : hasStats
        ? `${statsMatches.length} statistics found but no authoritative links — add citations from .gov, .edu, or Wikipedia`
        : externalLinks >= 2
        ? `${externalLinks} external links found but no statistics — add data/research to your content`
        : 'No statistics or authoritative references. LLMs prefer citing data-backed content.',
  });

  // ── 3. AI Extractability Score ────────────────────────────────────────────
  // Clear heading structure + definitions + logical flow
  const h2Count = $('h2').length;
  const h3Count = $('h3').length;
  const hasDefinitions = [' is a ', ' is an ', ' refers to ', ' means '].some((p) =>
    bodyText.toLowerCase().includes(p)
  );
  const hasGoodStructure = h2Count >= 3 && h3Count >= 1 && hasDefinitions;
  const hasMediumStructure = h2Count >= 2 || hasDefinitions;

  checks.push({
    id: 'geo_extractability',
    name: 'AI Extractability Score',
    maxPoints: 20,
    earnedPoints: hasGoodStructure ? 20 : hasMediumStructure ? 12 : 4,
    passed: hasMediumStructure,
    details: hasGoodStructure
      ? `Excellent AI extractability: clear headings (${h2Count} H2s, ${h3Count} H3s) + definitions ✓`
      : hasMediumStructure
      ? `Moderate extractability: ${h2Count} H2s. Add more H3 subheadings and definition-style sentences.`
      : 'Poor AI extractability — LLMs need clear headings, definitions, and logical content flow',
  });

  // ── 4. Brand Mention Signals ──────────────────────────────────────────────
  // Author byline, organization schema, about page linked
  const hasAuthorMeta =
    $('meta[name="author"]').length > 0 || $('[rel="author"]').length > 0 || $('[itemprop="author"]').length > 0;
  const hasOrgSchema = (() => {
    let found = false;
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const d = JSON.parse($(el).html() ?? '{}');
        if (['Organization', 'Person', 'WebSite'].includes(d['@type'])) found = true;
      } catch {}
    });
    return found;
  })();
  const hasAboutLink = $('a[href]')
    .map((_, el) => $(el).attr('href') ?? '')
    .get()
    .some((h) => h.includes('/about') || h.includes('/team') || h.includes('/author'));

  checks.push({
    id: 'geo_brand_signals',
    name: 'Brand Mention Signals',
    maxPoints: 15,
    earnedPoints:
      [hasAuthorMeta, hasOrgSchema, hasAboutLink].filter(Boolean).length === 3
        ? 15
        : [hasAuthorMeta, hasOrgSchema, hasAboutLink].filter(Boolean).length === 2
        ? 10
        : [hasAuthorMeta, hasOrgSchema, hasAboutLink].filter(Boolean).length === 1
        ? 5
        : 0,
    passed: hasOrgSchema || hasAuthorMeta,
    details: hasOrgSchema
      ? `Organization/Person schema found ✓${hasAuthorMeta ? ' + author attribution' : ''}`
      : hasAuthorMeta
      ? 'Author attribution found. Add Organization schema for stronger brand signals.'
      : 'No brand signals. Add author byline, Organization JSON-LD schema, and link to About page.',
  });

  // ── 5. Original Research Signals ──────────────────────────────────────────
  // Unique data, survey results, case studies
  const originalResearchKeywords = [
    'according to our',
    'our research',
    'our study',
    'we found',
    'our survey',
    'our data shows',
    'our analysis',
    'case study',
    'original research',
    'our findings',
  ];
  const hasOriginalResearch = originalResearchKeywords.some((kw) =>
    bodyText.toLowerCase().includes(kw)
  );

  checks.push({
    id: 'geo_original_research',
    name: 'Original Research Signals',
    maxPoints: 10,
    earnedPoints: hasOriginalResearch ? 10 : 0,
    passed: hasOriginalResearch,
    details: hasOriginalResearch
      ? 'Original research signals detected ✓ (e.g., "our study", "we found")'
      : 'No original research detected. LLMs strongly prefer citing unique data and first-hand insights.',
  });

  // ── 6. Content Freshness Signals ──────────────────────────────────────────
  const publishedDate =
    $('meta[property="article:published_time"]').attr('content') ||
    $('time[datetime]').attr('datetime') ||
    $('[itemprop="datePublished"]').attr('content');
  const modifiedDate =
    $('meta[property="article:modified_time"]').attr('content') ||
    $('[itemprop="dateModified"]').attr('content');

  let isFresh = false;
  if (publishedDate || modifiedDate) {
    const dateStr = modifiedDate || publishedDate;
    if (dateStr) {
      const date = new Date(dateStr);
      const daysSince = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      isFresh = daysSince <= 365; // Within last year
    }
  }

  // Also check for year references in content
  const currentYear = new Date().getFullYear();
  const hasCurrentYearRef = bodyText.includes(String(currentYear));

  checks.push({
    id: 'geo_content_freshness',
    name: 'Content Freshness Signals',
    maxPoints: 15,
    earnedPoints: isFresh ? 15 : hasCurrentYearRef ? 8 : publishedDate ? 5 : 0,
    passed: isFresh || hasCurrentYearRef || !!publishedDate,
    details: isFresh
      ? `Content has recent publish/modified date ✓ — LLMs prefer fresh content`
      : publishedDate
      ? `Published date found but content may be outdated — update your content regularly`
      : hasCurrentYearRef
      ? `References ${currentYear} found — add article:published_time meta tag for full freshness signals`
      : 'No freshness signals — add publish/update dates to improve AI citation chances',
  });

  return checks;
}

export function calculateGEOScore(checks: GEOCheck[]): number {
  const totalPoints = checks.reduce((sum, c) => sum + c.maxPoints, 0);
  const earnedPoints = checks.reduce((sum, c) => sum + c.earnedPoints, 0);
  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
}

export function getGEOReadiness(score: number): 'low' | 'medium' | 'high' {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}
