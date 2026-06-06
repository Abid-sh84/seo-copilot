import type { CrawlResult } from './crawler.service';
import type { AEOCheck } from '../../common/types';

export function analyzeAEO(crawl: CrawlResult): AEOCheck[] {
  const { $, wordCount } = crawl;
  const checks: AEOCheck[] = [];

  // ── 1. FAQ Section Present ────────────────────────────────────────────────
  const headings = $('h2, h3, h4')
    .map((_, el) => $(el).text().toLowerCase())
    .get();
  const hasFaqSection = headings.some(
    (h) => h.includes('faq') || h.includes('frequently asked') || h.includes('questions')
  );
  let hasFaqSchema = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).html() ?? '{}');
      if (d['@type'] === 'FAQPage') hasFaqSchema = true;
    } catch {}
  });
  const faqPassed = hasFaqSection && hasFaqSchema;
  checks.push({
    id: 'aeo_faq_section',
    name: 'FAQ Section + FAQPage Schema',
    maxPoints: 15,
    earnedPoints: hasFaqSection ? (hasFaqSchema ? 15 : 8) : 0,
    passed: faqPassed,
    details: hasFaqSection
      ? hasFaqSchema
        ? 'FAQ section found with FAQPage JSON-LD schema ✓'
        : 'FAQ section found but missing FAQPage schema — add JSON-LD for AI Overviews'
      : 'No FAQ section detected — add a FAQ to boost AI answer engine visibility',
  });

  // ── 2. Question-Format Headings ───────────────────────────────────────────
  const questionHeadings = headings.filter(
    (h) =>
      h.includes('?') ||
      h.startsWith('what') ||
      h.startsWith('how') ||
      h.startsWith('why') ||
      h.startsWith('when') ||
      h.startsWith('where') ||
      h.startsWith('which') ||
      h.startsWith('who') ||
      h.startsWith('is ') ||
      h.startsWith('are ') ||
      h.startsWith('can ')
  );
  const questionHeadingCount = questionHeadings.length;
  checks.push({
    id: 'aeo_question_headings',
    name: 'Question-Format Headings',
    maxPoints: 12,
    earnedPoints: questionHeadingCount >= 3 ? 12 : questionHeadingCount >= 1 ? 7 : 0,
    passed: questionHeadingCount >= 2,
    details:
      questionHeadingCount >= 2
        ? `${questionHeadingCount} question-format headings found ✓ (e.g., "What is...", "How to...")`
        : questionHeadingCount === 1
        ? '1 question heading found — add more (aim for 3+) to improve AEO'
        : 'No question-format headings — rephrase some H2/H3 tags as questions',
  });

  // ── 3. Direct Answer Paragraphs ───────────────────────────────────────────
  const firstParagraph = $('p').first().text().trim();
  const firstParaWords = firstParagraph.split(/\s+/).length;
  const isDirectAnswer = firstParaWords > 0 && firstParaWords <= 50;
  checks.push({
    id: 'aeo_direct_answer',
    name: 'Direct Answer Paragraph (Above the fold)',
    maxPoints: 12,
    earnedPoints: isDirectAnswer ? 12 : firstParaWords > 0 ? 5 : 0,
    passed: isDirectAnswer,
    details: isDirectAnswer
      ? `First paragraph is ${firstParaWords} words — ideal for featured snippet extraction ✓`
      : firstParaWords > 50
      ? `First paragraph is ${firstParaWords} words — trim to under 50 for snippet potential`
      : 'First paragraph not found — start with a concise direct answer',
  });

  // ── 4. Bullet/List Formatting ─────────────────────────────────────────────
  const listCount = $('ul, ol').length;
  const listItemCount = $('li').length;
  checks.push({
    id: 'aeo_list_formatting',
    name: 'Bullet/List Formatting',
    maxPoints: 10,
    earnedPoints: listCount >= 2 ? 10 : listCount === 1 ? 6 : 0,
    passed: listCount >= 1,
    details:
      listCount >= 2
        ? `${listCount} lists with ${listItemCount} total items ✓ — great for scannable content`
        : listCount === 1
        ? '1 list found — add more bullet points to improve AEO readability'
        : 'No lists found — use bullet points and numbered lists to structure your content',
  });

  // ── 5. Table Data Present ─────────────────────────────────────────────────
  const tableCount = $('table').length;
  checks.push({
    id: 'aeo_table_data',
    name: 'Table Data (Comparative/Structured Info)',
    maxPoints: 8,
    earnedPoints: tableCount >= 1 ? 8 : 0,
    passed: tableCount >= 1,
    details:
      tableCount >= 1
        ? `${tableCount} table(s) found — great for AI extraction ✓`
        : 'No tables found — consider adding comparison tables or structured data',
  });

  // ── 6. Concise Definitions ────────────────────────────────────────────────
  const bodyText = $('body').text().toLowerCase();
  const definitionPatterns = [' is a ', ' is an ', ' refers to ', ' means ', ' is defined as '];
  const hasDefinitions = definitionPatterns.some((p) => bodyText.includes(p));
  checks.push({
    id: 'aeo_concise_definitions',
    name: 'Concise Definitions',
    maxPoints: 8,
    earnedPoints: hasDefinitions ? 8 : 0,
    passed: hasDefinitions,
    details: hasDefinitions
      ? 'Definition-style sentences detected ✓ (e.g., "X is a...")'
      : 'No definition patterns found — add clear definitions to your content ("X is a...")',
  });

  // ── 7. Featured Snippet Potential ────────────────────────────────────────
  const paragraphs = $('p').map((_, el) => $(el).text().trim().split(/\s+/).length).get();
  const idealParagraphs = paragraphs.filter((count) => count >= 40 && count <= 60);
  checks.push({
    id: 'aeo_snippet_potential',
    name: 'Featured Snippet Potential',
    maxPoints: 10,
    earnedPoints: idealParagraphs.length >= 2 ? 10 : idealParagraphs.length === 1 ? 5 : 0,
    passed: idealParagraphs.length >= 1,
    details:
      idealParagraphs.length >= 2
        ? `${idealParagraphs.length} paragraphs in 40-60 word range (ideal for featured snippets) ✓`
        : idealParagraphs.length === 1
        ? '1 ideal-length paragraph — add more 40-60 word paragraphs for snippet potential'
        : 'No paragraphs in the 40-60 word sweet spot — optimize paragraph length for featured snippets',
  });

  // ── 8. How-To Schema ──────────────────────────────────────────────────────
  let hasHowToSchema = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).html() ?? '{}');
      if (d['@type'] === 'HowTo') hasHowToSchema = true;
    } catch {}
  });
  // Only check if content seems instructional
  const isHowToContent = headings.some(
    (h) => h.startsWith('how to') || h.startsWith('step') || h.includes('guide')
  );
  checks.push({
    id: 'aeo_howto_schema',
    name: 'How-To Schema',
    maxPoints: 10,
    earnedPoints: hasHowToSchema ? 10 : 0,
    passed: !isHowToContent || hasHowToSchema,
    details: hasHowToSchema
      ? 'HowTo JSON-LD schema present ✓'
      : isHowToContent
      ? 'Instructional content detected but no HowTo schema — add JSON-LD for voice search'
      : 'HowTo schema not applicable for this content type',
  });

  // ── 9. Speakable Schema ───────────────────────────────────────────────────
  let hasSpeakable = false;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const d = JSON.parse($(el).html() ?? '{}');
      if (d.speakable || JSON.stringify(d).includes('speakable')) hasSpeakable = true;
    } catch {}
  });
  checks.push({
    id: 'aeo_speakable_schema',
    name: 'Speakable Schema (Voice Search)',
    maxPoints: 8,
    earnedPoints: hasSpeakable ? 8 : 0,
    passed: hasSpeakable,
    details: hasSpeakable
      ? 'Speakable schema found — your content is voice search optimized ✓'
      : 'No speakable schema — add one to optimize for Google Assistant and voice search',
  });

  // ── 10. Content Depth ─────────────────────────────────────────────────────
  checks.push({
    id: 'aeo_content_depth',
    name: 'Content Depth (Word Count)',
    maxPoints: 7,
    earnedPoints: wordCount >= 1200 ? 7 : wordCount >= 800 ? 5 : wordCount >= 400 ? 2 : 0,
    passed: wordCount >= 800,
    details:
      wordCount >= 1200
        ? `${wordCount.toLocaleString()} words — excellent content depth ✓`
        : wordCount >= 800
        ? `${wordCount.toLocaleString()} words — good depth, but 1200+ words is ideal`
        : wordCount >= 400
        ? `${wordCount.toLocaleString()} words — content is thin, aim for 800+ words`
        : `${wordCount.toLocaleString()} words — very thin content, AI engines won't select this as an answer`,
  });

  return checks;
}

export function calculateAEOScore(checks: AEOCheck[]): number {
  const totalPoints = checks.reduce((sum, c) => sum + c.maxPoints, 0);
  const earnedPoints = checks.reduce((sum, c) => sum + c.earnedPoints, 0);
  return totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
}
