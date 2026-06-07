// ─── Shared Types for SEO Copilot ─────────────────────────────────────────────

export type Severity   = 'high' | 'medium' | 'low';
export type CrawlMethod = 'axios' | 'puppeteer';

export interface SEOCheck {
  id: string;
  name: string;
  category: 'meta' | 'structure' | 'technical' | 'performance';
  weight: number;
  passed: boolean;
  value?: string;
  expected?: string;
  message: string;
  severity: Severity;
}

export interface AEOCheck {
  id: string;
  name: string;
  maxPoints: number;
  earnedPoints: number;
  passed: boolean;
  details: string;
}

export interface GEOCheck {
  id: string;
  name: string;
  maxPoints: number;
  earnedPoints: number;
  passed: boolean;
  details: string;
}

export interface Recommendation {
  checkId: string;
  issueType: string;
  severity: Severity;
  suggestion: string;
  codeSnippet?: string;
  estimatedImpact: 'high' | 'medium' | 'low';
}

export interface AuditResult {
  auditId: string;
  userId: string;
  url: string;
  timestamp: Date | string;
  seoScore: number;
  aeoScore: number;
  geoScore: number;
  overallScore: number;
  geoReadiness: 'low' | 'medium' | 'high';
  seoChecks: SEOCheck[];
  aeoChecks: AEOCheck[];
  geoChecks: GEOCheck[];
  recommendations: Recommendation[];
  pageTitle: string;
  pageDescription: string;
  pageWordCount: number;
  crawlMethod: CrawlMethod;
  crawlDurationMs: number;
  status: 'completed' | 'failed' | 'partial';
  errorMessage?: string;
}

export interface AuditRequest  { url: string; }

export interface AuditListItem {
  auditId: string;
  url: string;
  seoScore: number;
  aeoScore: number;
  geoScore: number;
  overallScore: number;
  timestamp: Date | string;
  status: 'completed' | 'failed' | 'partial';
  pageTitle: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  image?: string;
  auditCount: number;
  createdAt: Date | string;
}

// ─── Blog Types ───────────────────────────────────────────────────────────────

export interface BlogOutlineSection {
  level: 'h1' | 'h2' | 'h3';
  text: string;
  description?: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface GEOEnhancement {
  entitySuggestions: string[];
  citationPlaceholders: string[];
  statisticHooks: string[];
  internalLinkSuggestions: string[];
}

export interface BlogResult {
  blogId: string;
  keyword: string;
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
  generationDurationMs: number;
  status: 'completed' | 'failed';
  createdAt: Date | string;
}

export interface BlogListItem {
  blogId: string;
  keyword: string;
  title: string;
  slug: string;
  metaDescription: string;
  createdAt: Date | string;
  generationDurationMs: number;
}
