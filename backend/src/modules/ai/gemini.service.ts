import { GoogleGenerativeAI } from '@google/generative-ai';
import type { SEOCheck, AEOCheck, GEOCheck, Recommendation } from '../../common/types';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Exponential backoff retry utility
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
      console.log(`[Gemini] Retry ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw new Error('Max retries reached');
}

// Simple in-memory cache: url -> { recommendations, timestamp }
const recommendationCache = new Map<
  string,
  { recommendations: Recommendation[]; timestamp: number }
>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

function getCachedRecommendations(url: string): Recommendation[] | null {
  const cached = recommendationCache.get(url);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.recommendations;
  }
  return null;
}

function setCachedRecommendations(url: string, recommendations: Recommendation[]): void {
  recommendationCache.set(url, { recommendations, timestamp: Date.now() });
}

interface FailedCheck {
  type: 'seo' | 'aeo' | 'geo';
  id: string;
  name: string;
  message: string;
  severity: string;
}

function buildPrompt(url: string, failedChecks: FailedCheck[]): string {
  const issues = failedChecks
    .map(
      (c, i) =>
        `${i + 1}. [${c.type.toUpperCase()}] ${c.name} (Severity: ${c.severity})
   Issue: ${c.message}`
    )
    .join('\n\n');

  return `You are an expert SEO, AEO, and GEO consultant. A user has just audited the website: ${url}

The following issues were detected:

${issues}

For EACH issue, provide a specific, actionable recommendation. Format your response as a JSON array with this exact structure:
[
  {
    "checkId": "check_id_from_above",
    "issueType": "Brief issue category",
    "severity": "high|medium|low",
    "suggestion": "Specific actionable advice in 2-3 sentences",
    "codeSnippet": "Optional: ready-to-use code example if applicable",
    "estimatedImpact": "high|medium|low"
  }
]

Rules:
- Be specific and actionable, not generic
- Include actual HTML/JSON-LD code snippets where helpful
- Keep suggestions concise (2-3 sentences max)
- Prioritize high-severity issues
- Return ONLY the JSON array, no other text`;
}

export async function generateRecommendations(
  url: string,
  seoChecks: SEOCheck[],
  aeoChecks: AEOCheck[],
  geoChecks: GEOCheck[]
): Promise<Recommendation[]> {
  // Check cache first
  const cached = getCachedRecommendations(url);
  if (cached) {
    console.log(`[Gemini] Using cached recommendations for ${url}`);
    return cached;
  }

  // Collect all failed checks
  const failedChecks: FailedCheck[] = [
    ...seoChecks
      .filter((c) => !c.passed)
      .map((c) => ({
        type: 'seo' as const,
        id: c.id,
        name: c.name,
        message: c.message,
        severity: c.severity,
      })),
    ...aeoChecks
      .filter((c) => !c.passed)
      .map((c) => ({
        type: 'aeo' as const,
        id: c.id,
        name: c.name,
        message: c.details,
        severity: c.earnedPoints === 0 ? 'high' : 'medium',
      })),
    ...geoChecks
      .filter((c) => !c.passed)
      .map((c) => ({
        type: 'geo' as const,
        id: c.id,
        name: c.name,
        message: c.details,
        severity: c.earnedPoints === 0 ? 'high' : 'medium',
      })),
  ];

  if (failedChecks.length === 0) {
    return [];
  }

  // Limit to top 12 issues to avoid token limits
  const topIssues = failedChecks
    .sort((a, b) => (a.severity === 'high' ? -1 : b.severity === 'high' ? 1 : 0))
    .slice(0, 12);

  const prompt = buildPrompt(url, topIssues);

  const recommendations = await withRetry(async () => {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Extract JSON from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('Gemini response did not contain valid JSON array');
    }

    const parsed = JSON.parse(jsonMatch[0]) as Recommendation[];
    return parsed;
  });

  // Cache for 24 hours
  setCachedRecommendations(url, recommendations);

  return recommendations;
}
