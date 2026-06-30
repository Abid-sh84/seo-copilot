'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { getAudit } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, ExternalLink, RefreshCw, Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { SEOCheck, AEOCheck, GEOCheck, Recommendation, AuditResult } from '@/types/audit';
import { downloadAuditPDF, downloadAuditExcel } from '@/lib/api';
import { useState } from 'react';

// ── Score Gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#f1f5f9" strokeWidth="6" />
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
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-extrabold text-slate-900">{score}</span>
          <span className="text-xs text-slate-400">/100</span>
        </div>
      </div>
      <span className="text-sm font-medium mt-2 text-slate-500">{label}</span>
    </div>
  );
}

// ── SEO Check Item ────────────────────────────────────────────────────────────

function SEOCheckItem({ check }: { check: SEOCheck }) {
  const severityStyles = {
    high: 'border-red-200 bg-red-50',
    medium: 'border-yellow-200 bg-yellow-50',
    low: 'border-slate-200 bg-slate-50',
  };

  return (
    <div className={`flex items-start gap-3 p-3 rounded-xl border ${check.passed ? 'border-green-200 bg-green-50' : severityStyles[check.severity]}`}>
      <div className="mt-0.5 flex-shrink-0">
        {check.passed ? (
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        ) : check.severity === 'high' ? (
          <XCircle className="w-4 h-4 text-red-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-yellow-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="text-sm font-semibold text-slate-800">{check.name}</span>
          <span className="text-xs text-slate-400 flex-shrink-0">{check.weight}% weight</span>
        </div>
        <p className="text-xs text-slate-500">{check.message}</p>
        {check.value && (
          <p className="text-xs text-slate-400 mt-1 font-mono truncate">Found: {check.value}</p>
        )}
      </div>
    </div>
  );
}

// ── AEO/GEO Check Item ────────────────────────────────────────────────────────

function AnalyzerCheckItem({ check }: { check: AEOCheck | GEOCheck }) {
  const pct = check.maxPoints > 0 ? Math.round((check.earnedPoints / check.maxPoints) * 100) : 0;
  return (
    <div className={`p-3 rounded-xl border ${check.passed ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {check.passed ? (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold text-slate-800">{check.name}</span>
        </div>
        <span className="text-xs font-mono text-slate-400 flex-shrink-0">
          {check.earnedPoints}/{check.maxPoints} pts
        </span>
      </div>
      <div className="w-full bg-slate-200 rounded-full h-1.5 mb-2">
        <div
          className="h-1.5 rounded-full bg-blue-500 transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-slate-500">{check.details}</p>
    </div>
  );
}

// ── Recommendation Card ───────────────────────────────────────────────────────

function RecommendationCard({ rec }: { rec: Recommendation }) {
  const severityStyle =
    rec.severity === 'high'
      ? 'text-red-600 bg-red-50 border-red-200'
      : rec.severity === 'medium'
      ? 'text-yellow-700 bg-yellow-50 border-yellow-200'
      : 'text-slate-500 bg-slate-50 border-slate-200';

  return (
    <AccordionItem value={`${rec.checkId}-${rec.issueType}`} className="border border-slate-200 rounded-xl overflow-hidden mb-2">
      <AccordionTrigger className="px-4 py-3 hover:bg-slate-50 hover:no-underline">
        <div className="flex items-center gap-3 text-left">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border flex-shrink-0 ${severityStyle}`}>
            {rec.severity}
          </span>
          <span className="text-sm font-medium text-slate-800">{rec.issueType}</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4 border-t border-slate-100">
        <p className="text-sm text-slate-600 mb-3 mt-3">{rec.suggestion}</p>
        {rec.codeSnippet && (
          <pre className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap text-slate-700">
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
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingXls, setExportingXls] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit', auditId],
    queryFn: () => getAudit(auditId),
  });

  const audit: AuditResult | undefined = data?.data;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse" />)}
        </div>
        <div className="h-64 bg-slate-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (isError || !audit) {
    return (
      <div className="text-center py-20">
        <XCircle className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <h2 className="text-lg font-bold text-slate-800 mb-2">Audit not found</h2>
        <p className="text-slate-500 mb-6">This audit may have been deleted or doesn&apos;t exist.</p>
        <Link href="/dashboard">
          <button className="px-5 py-2.5 text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Back to Dashboard
          </button>
        </Link>
      </div>
    );
  }

  const geoColors = { low: '#ef4444', medium: '#f59e0b', high: '#22c55e' };
  const geoColor = geoColors[audit.geoReadiness];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <Link href="/dashboard" className="mt-0.5 shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors" id="back-to-dashboard-btn">
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-extrabold text-slate-900 truncate">{audit.pageTitle || 'Audit Report'}</h1>
            <a
              href={audit.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-slate-400 hover:text-blue-600 flex items-center gap-1 transition-colors mt-0.5"
            >
              {audit.url}
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative group">
            <button
              id="export-btn"
              disabled={exportingPdf || exportingXls}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors disabled:opacity-50"
            >
              {exportingPdf || exportingXls ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              Export
            </button>
            <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 overflow-hidden">
              <button
                id="export-pdf-btn"
                disabled={exportingPdf}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                onClick={async () => {
                  setExportingPdf(true);
                  setExportError(null);
                  try { await downloadAuditPDF(auditId, audit.pageTitle); }
                  catch (e) { setExportError('PDF export failed'); }
                  finally { setExportingPdf(false); }
                }}
              >
                <FileText className="w-4 h-4 text-red-500" />
                {exportingPdf ? 'Generating PDF…' : 'Download PDF'}
              </button>
              <button
                id="export-excel-btn"
                disabled={exportingXls}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-t border-slate-100 disabled:opacity-50"
                onClick={async () => {
                  setExportingXls(true);
                  setExportError(null);
                  try { await downloadAuditExcel(auditId, audit.pageTitle); }
                  catch (e) { setExportError('Excel export failed'); }
                  finally { setExportingXls(false); }
                }}
              >
                <FileSpreadsheet className="w-4 h-4 text-green-600" />
                {exportingXls ? 'Generating…' : 'Download Excel'}
              </button>
            </div>
          </div>

          <button
            onClick={() => router.push(`/dashboard?url=${encodeURIComponent(audit.url)}`)}
            id="re-audit-btn"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm shadow-blue-500/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Re-audit
          </button>
        </div>
      </div>

      {/* Export error */}
      {exportError && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {exportError}
        </div>
      )}

      {/* Score Gauges */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-center justify-around gap-8">
          <ScoreGauge score={audit.seoScore} label="SEO Score" color="#2563eb" />
          <div className="text-center">
            <div className="text-5xl font-extrabold text-slate-900">{audit.overallScore}</div>
            <div className="text-sm text-slate-500 mt-1">Overall Visibility</div>
            <div
              className="mt-2 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border"
              style={{ color: geoColor, background: `${geoColor}15`, borderColor: `${geoColor}30` }}
            >
              GEO Readiness: {audit.geoReadiness.charAt(0).toUpperCase() + audit.geoReadiness.slice(1)}
            </div>
          </div>
          <ScoreGauge score={audit.aeoScore} label="AEO Score" color="#0891b2" />
          <ScoreGauge score={audit.geoScore} label="GEO Score" color="#059669" />
        </div>
        <div className="flex justify-center gap-6 mt-6 text-xs text-slate-400 border-t border-slate-100 pt-4">
          <span>Crawled with: <span className="font-mono text-slate-600">{audit.crawlMethod}</span></span>
          <span>Duration: <span className="font-mono text-slate-600">{(audit.crawlDurationMs / 1000).toFixed(1)}s</span></span>
          <span>Words: <span className="font-mono text-slate-600">{audit.pageWordCount.toLocaleString()}</span></span>
          <span>Date: <span className="font-mono text-slate-600">{audit.timestamp ? new Date(audit.timestamp).toLocaleDateString() : '—'}</span></span>
        </div>
      </div>

      {/* Check Results Tabs */}
      <Tabs defaultValue="seo" className="space-y-4">
        <TabsList className="bg-slate-100 border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="seo" id="tab-seo" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            SEO Checks
            <span className="ml-2 text-xs text-slate-400">
              {audit.seoChecks.filter((c) => c.passed).length}/{audit.seoChecks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="aeo" id="tab-aeo" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            AEO Checks
            <span className="ml-2 text-xs text-slate-400">
              {audit.aeoChecks.filter((c) => c.passed).length}/{audit.aeoChecks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="geo" id="tab-geo" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            GEO Checks
            <span className="ml-2 text-xs text-slate-400">
              {audit.geoChecks.filter((c) => c.passed).length}/{audit.geoChecks.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" id="tab-recs" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            AI Fixes
            <span className="ml-2 text-xs text-slate-400">
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
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto mb-3" />
              <p className="font-bold text-slate-800">No recommendations needed!</p>
              <p className="text-sm text-slate-500 mt-1">
                Your site passed all checks. Great work!
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-slate-500 mb-4">
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
