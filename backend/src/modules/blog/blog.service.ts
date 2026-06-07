import { GoogleGenerativeAI } from '@google/generative-ai';
import type { BlogOutlineSection, FAQItem, GEOEnhancement } from '../../models/Blog.model';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BlogGenerationResult {
  title: string;
  metaDescription: string;
  slug: string;
  outline: BlogOutlineSection[];
  introduction: string;
  faqSection: FAQItem[];
  faqSchema: string;
  geoEnhancements: GEOEnhancement;
  recommendedWordCount: number;
  contentDepthTarget: string;
}

// ─── Retry Utility ────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`[BlogGenerator] Retry ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('Max retries reached');
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildBlogPrompt(keyword: string, tone?: string, targetAudience?: string): string {
  const toneStr = tone ?? 'professional and informative';
  const audienceStr = targetAudience ?? 'SEO professionals, bloggers, and digital marketers';

  return `You are an expert content strategist specializing in SEO, AEO (Answer Engine Optimization), and GEO (Generative Engine Optimization).

Generate a complete, publication-ready blog content plan for the keyword: "${keyword}"

Tone: ${toneStr}
Target Audience: ${audienceStr}

Return your response as a JSON object with this EXACT structure:
{
  "title": "SEO title tag, 50-60 characters, includes primary keyword",
  "metaDescription": "Meta description, 150-160 characters, includes keyword + CTA",
  "slug": "clean-hyphenated-url-slug-no-stop-words",
  "outline": [
    { "level": "h1", "text": "Main heading", "description": "Brief description of section content" },
    { "level": "h2", "text": "Subheading", "description": "Brief description" },
    { "level": "h3", "text": "Sub-subheading", "description": "Brief description" }
  ],
  "introduction": "A complete introduction paragraph (2-3 sentences). MUST directly answer 'What is [keyword]?' in the first sentence for AEO optimization. Keep under 50 words for featured snippet potential.",
  "faqSection": [
    { "question": "Question phrased naturally?", "answer": "Direct, concise answer in 2-3 sentences" }
  ],
  "geoEnhancements": {
    "entitySuggestions": ["Named entities (people, tools, brands) to mention for LLM citation"],
    "citationPlaceholders": ["Specific statistics or sources to reference for authority"],
    "statisticHooks": ["Data points or research to include for credibility"],
    "internalLinkSuggestions": ["Related topics worth linking to from this article"]
  },
  "recommendedWordCount": 2000,
  "contentDepthTarget": "Comprehensive guide / Beginner-friendly / Advanced tutorial"
}

Rules:
- Title MUST be 50-60 characters and include the primary keyword
- Meta description MUST be 150-160 characters
- Slug should be clean, hyphenated, no stop words (a, the, is, etc.)
- Outline MUST have exactly 1 H1, at least 4 H2s, and 2+ H3s under relevant H2s
- Include at least 5 FAQ questions (max 7), each with a direct answer
- Introduction paragraph MUST start with a definition-style sentence for AEO
- FAQ answers should be concise (2-3 sentences, under 50 words each)
- GEO enhancements should have at least 3 items in each array
- Recommended word count should be 1500-3000 based on topic complexity
- Return ONLY the JSON object, no other text or markdown formatting`;
}

// ─── FAQ Schema Generator ─────────────────────────────────────────────────────

function generateFAQSchema(faqs: FAQItem[]): string {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return JSON.stringify(schema, null, 2);
}

// ─── Main Generator ──────────────────────────────────────────────────────────

export async function generateBlogContent(
  keyword: string,
  tone?: string,
  targetAudience?: string
): Promise<BlogGenerationResult> {
  const prompt = buildBlogPrompt(keyword, tone, targetAudience);

  const result = await withRetry(async () => {
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    // Extract JSON from response (may be wrapped in ```json ... ```)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Gemini response did not contain valid JSON object');
    }

    const parsed = JSON.parse(jsonMatch[0]) as Omit<BlogGenerationResult, 'faqSchema'>;
    return parsed;
  });

  // Generate the FAQPage JSON-LD schema separately for accuracy
  const faqSchema = generateFAQSchema(result.faqSection);

  return {
    ...result,
    faqSchema,
  };
}
