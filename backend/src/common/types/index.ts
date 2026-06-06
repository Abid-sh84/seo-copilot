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
