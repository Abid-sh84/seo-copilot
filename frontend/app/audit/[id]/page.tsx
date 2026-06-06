'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getAudit } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import type { SEOCheck, AEOCheck, GEOCheck, Recommendation, AuditResult } from '@/types/audit';

// ── Score Gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" className="text-muted/30" />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 8px ${color}60)`, transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-sm font-medium mt-2 text-muted-foreground">{label}</span>
    </div>
  );
}

// ── SEO Check Item ────────────────────────────────────────────────────────────

function SEOCheckItem({ check }: { check: SEOCheck }) {
  const severityColors = {
    high: 'border-red-500/30 bg-red-500/5',
    medium: 'border-yellow-500/30 bg-yellow-500/5',
    low: 'border-border bg-muted/20',
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${check.passed ? 'border-green-500/20 bg-green-500/5' : severityColors[check.severity]}`}>
      <div className="mt-0.5 flex-shrink-0">
        {check.passed ? (
          <CheckCircle2 className="w-4 h-4 text-green-400" />
        ) : check.severity === 'high' ? (
          <XCircle className="w-4 h-4 text-red-400" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-400" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-medium">{check.name}</span>
          <span className="text-xs text-muted-foreground flex-shrink-0">{check.weight}% weight</span>
        </div>
        <p className="text-xs text-muted-foreground">{check.message}</p>
        {check.value && (
          <p className="text-xs text-muted-foreground/70 mt-1 font-mono truncate">Found: {check.value}</p>
        )}
      </div>
    </div>
  );
}

// ── AEO/GEO Check Item ────────────────────────────────────────────────────────

function AnalyzerCheckItem({ check }: { check: AEOCheck | GEOCheck }) {
  const pct = check.maxPoints > 0 ? Math.round((check.earnedPoints / check.maxPoints) * 100) : 0;
  return (
    <div className={`p-3 rounded-lg border ${check.passed ? 'border-green-500/20 bg-green-500/5' : 'border-border bg-muted/20'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {check.passed ? (
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          )}
          <span className="text-sm font-medium">{check.name}</span>
        </div>
        <span className="text-xs font-mono text-muted-foreground flex-shrink-0">
          {check.earnedPoints}/{check.maxPoints} pts
        </span>
      </div>
      <div className="w-full bg-muted/40 rounded-full h-1 mb-2">
        <div
          className="h-1 rounded-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{check.details}</p>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const severityColor =
    rec.severity === 'high'
      ? 'text-red-400 bg-red-500/10 border-red-500/20'
      : rec.severity === 'medium'
      ? 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20'
      : 'text-muted-foreground bg-muted/20 border-border';

  return (
    <AccordionItem value={`${rec.checkId}-${rec.issueType}`} className="border border-border rounded-lg overflow-hidden mb-2">
      <AccordionTrigger className="px-4 py-3 hover:bg-muted/20 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <Badge className={`text-xs border flex-shrink-0 ${severityColor}`} variant="outline">
            {rec.severity}
          </Badge>
          <span className="text-sm font-medium">{rec.issueType}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 border-t border-border">
        <p className="text-sm text-muted-foreground mb-3">{rec.suggestion}</p>
        {rec.codeSnippet && (
          <pre className="bg-muted/30 border border-border rounded-lg p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
            {rec.codeSnippet}
          </pre>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

// ── Main Audit Report Page ────────────────────────────────────────────────────

export default function AuditReportPage() {
  const params = useParams();
  const router = useRouter();
  const auditId = params.id as string;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => getAudit(auditId),
  });

  const audit: AuditResult | undefined = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (isError || !audit) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2">Audit not found</h2>
        <p className="text-muted-foreground mb-6">This audit may have been deleted or doesn&apos;t exist.</p>
        <Link href="/dashboard">
          <Button variant="outline">Back to Dashboard</Button>
        </Link>
      </div>
    );
  }

  const geoColors = { low: '#f87171', medium: '#fbbf24', high: '#4ade80' };
  const geoColor = geoColors[audit.geoReadiness];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="gap-1.5" id="back-to-dashboard-btn">
              <ArrowLeft className="w-4 h-4" />
              Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{audit.pageTitle || 'Audit Report'}</h1>
            <a
              href={audit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
            >
              {audit.url}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard?url=${encodeURIComponent(audit.url)}`)}
            id="re-audit-btn"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" />
            Re-audit
          </Button>
        </div>
      </div>

      {/* Score Gauges */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
          <ScoreGauge score={audit.seoScore} label="SEO Score" color="#818cf8" />
          <div className="text-center">
            <div className="text-5xl font-bold gradient-text">{audit.overallScore}</div>
            <div className="text-sm text-muted-foreground mt-1">Overall Visibility</div>
            <div className={`mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold`}
              style={{ color: geoColor, background: `${geoColor}15` }}>
              GEO Readiness: {audit.geoReadiness.charAt(0).toUpperCase() + audit.geoReadiness.slice(1)}
            </div>
          </div>
          <ScoreGauge score={audit.aeoScore} label="AEO Score" color="#67e8f9" />
          <ScoreGauge score={audit.geoScore} label="GEO Score" color="#86efac" />
        </div>
        <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground border-t border-border pt-4">
          <span>Crawled with: <span className="font-mono">{audit.crawlMethod}</span></span>
          <span>Duration: <span className="font-mono">{(audit.crawlDurationMs / 1000).toFixed(1)}s</span></span>
          <span>Words: <span className="font-mono">{audit.pageWordCount.toLocaleString()}</span></span>
          <span>Date: <span className="font-mono">{audit.timestamp ? new Date(audit.timestamp).toLocaleDateString() : '—'}</span></span>
        </div>
      </div>

      {/* Check Results Tabs */}
      <Tabs defaultValue="seo" className="space-y-4">
        <TabsList className="glass border border-border">
          <TabsTrigger value="seo" id="tab-seo">
            SEO Checks
            <span className="ml-2 text-xs text-muted-foreground">
              {audit.seoChecks.filter((c) => c.passed).length}/{audit.seoChecks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="aeo" id="tab-aeo">
            AEO Checks
            <span className="ml-2 text-xs text-muted-foreground">
              {audit.aeoChecks.filter((c) => c.passed).length}/{audit.aeoChecks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="geo" id="tab-geo">
            GEO Checks
            <span className="ml-2 text-xs text-muted-foreground">
              {audit.geoChecks.filter((c) => c.passed).length}/{audit.geoChecks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" id="tab-recs">
            AI Fixes
            <span className="ml-2 text-xs text-muted-foreground">
              {audit.recommendations.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="seo">
          <div className="space-y-2">
            {[...audit.seoChecks]
              .sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1))
              .map((check) => (
                <SEOCheckItem key={check.id} check={check} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="aeo">
          <div className="space-y-2">
            {[...audit.aeoChecks]
              .sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1))
              .map((check) => (
                <AnalyzerCheckItem key={check.id} check={check} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="geo">
          <div className="space-y-2">
            {[...audit.geoChecks]
              .sort((a, b) => (a.passed === b.passed ? 0 : a.passed ? 1 : -1))
              .map((check) => (
                <AnalyzerCheckItem key={check.id} check={check} />
              ))}
          </div>
        </TabsContent>

        <TabsContent value="recommendations">
          {audit.recommendations.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="font-medium">No recommendations needed!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your site passed all checks. Great work!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                {audit.recommendations.length} AI-generated recommendations for your site:
              </p>
              <Accordion type="single" collapsible>
                {[...audit.recommendations]
                  .sort((a, b) => {
                    const order = { high: 0, medium: 1, low: 2 };
                    return order[a.severity] - order[b.severity];
                  })
                  .map((rec) => (
                    <RecommendationCard key={rec.checkId} rec={rec} />
                  ))}
              </Accordion>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
