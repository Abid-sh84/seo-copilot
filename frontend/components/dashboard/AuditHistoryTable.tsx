'use client';

import { useQuery } from '@tanstack/react-query';
import { getAudits, deleteAudit, downloadAuditPDF, downloadAuditExcel } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, ChevronLeft, ChevronRight, FileText, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuditListItem } from '@/types/audit';

function ScoreBadge({ score }: { score: number }) {
  const style =
    score >= 70
      ? 'bg-green-50 text-green-700 border-green-200'
      : score >= 40
      ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
      : 'bg-red-50 text-red-600 border-red-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${style}`}>
      {score}
    </span>
  );
}

export function AuditHistoryTable() {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audits', page],
    queryFn: () => getAudits(page, 10),
  });

  const { mutate: deleteAuditMutate } = useMutation({
    mutationFn: (id: string) => deleteAudit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audits'] });
    },
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100 last:border-0">
              <div className="h-4 flex-1 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-12 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        Failed to load audit history. Please try again.
      </div>
    );
  }

  const audits: AuditListItem[] = data?.data?.audits ?? [];
  const pagination = data?.data?.pagination;

  if (audits.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-5 h-5 text-slate-400" />
        </div>
        <p className="font-semibold text-slate-800 mb-1">No audits yet</p>
        <p className="text-sm text-slate-500">
          Enter a URL above to run your first audit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50 text-xs font-semibold text-slate-400 uppercase tracking-wider">
          <span>URL</span>
          <span className="text-center w-12">SEO</span>
          <span className="text-center w-12">AEO</span>
          <span className="text-center w-12">GEO</span>
          <span className="w-24">Date</span>
          <span className="w-24" />
        </div>

        {/* Table Rows */}
        <div>
          {audits.map((audit) => (
            <Link
              key={audit.auditId}
              href={`/audit/${audit.auditId}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3.5 border-b border-slate-100 last:border-0 hover:bg-blue-50/50 transition-colors items-center group"
              id={`audit-row-${audit.auditId}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {audit.pageTitle || audit.url}
                </p>
                <p className="text-xs text-slate-400 truncate">{audit.url}</p>
              </div>
              <div className="w-12 text-center"><ScoreBadge score={audit.seoScore} /></div>
              <div className="w-12 text-center"><ScoreBadge score={audit.aeoScore} /></div>
              <div className="w-12 text-center"><ScoreBadge score={audit.geoScore} /></div>
              <div className="w-24 text-xs text-slate-400">
                {new Date(audit.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div
                className="w-24 flex justify-end items-center gap-1"
                onClick={(e) => e.preventDefault()}
              >
                {/* Export PDF */}
                <button
                  className="h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  onClick={() => downloadAuditPDF(audit.auditId, audit.pageTitle).catch(() => {})}
                  title="Download PDF"
                  id={`export-pdf-${audit.auditId}`}
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>
                {/* Export Excel */}
                <button
                  className="h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                  onClick={() => downloadAuditExcel(audit.auditId, audit.pageTitle).catch(() => {})}
                  title="Download Excel"
                  id={`export-excel-${audit.auditId}`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </button>
                {/* Delete */}
                <button
                  className="h-7 w-7 flex items-center justify-center opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  onClick={() => deleteAuditMutate(audit.auditId)}
                  id={`delete-audit-${audit.auditId}`}
                  title="Delete audit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-slate-500">
          <span>
            Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total)} of{' '}
            {pagination.total} audits
          </span>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => p - 1)}
              id="pagination-prev-btn"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              id="pagination-next-btn"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
