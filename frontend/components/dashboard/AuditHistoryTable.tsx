'use client';

import { useQuery } from '@tanstack/react-query';
import { getAudits, deleteAudit } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AuditListItem } from '@/types/audit';

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70
      ? 'bg-green-500/15 text-green-400 border-green-500/20'
      : score >= 40
      ? 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20'
      : 'bg-red-500/15 text-red-400 border-red-500/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>
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
      <div className="glass-card overflow-hidden">
        <div className="space-y-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4 border-b border-border last:border-0">
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="glass-card p-8 text-center text-muted-foreground">
        Failed to load audit history. Please try again.
      </div>
    );
  }

  const audits: AuditListItem[] = data?.data?.audits ?? [];
  const pagination = data?.data?.pagination;

  if (audits.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="font-medium mb-1">No audits yet</p>
        <p className="text-sm text-muted-foreground">
          Enter a URL above to run your first audit
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="glass-card overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3 border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground uppercase tracking-wider">
          <span>URL</span>
          <span className="text-center w-12">SEO</span>
          <span className="text-center w-12">AEO</span>
          <span className="text-center w-12">GEO</span>
          <span className="w-24">Date</span>
          <span className="w-16" />
        </div>

        {/* Table Rows */}
        <div>
          {audits.map((audit) => (
            <Link
              key={audit.auditId}
              href={`/audit/${audit.auditId}`}
              className="grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-4 py-3.5 border-b border-border last:border-0 hover:bg-muted/20 transition-colors items-center group"
              id={`audit-row-${audit.auditId}`}
            >
              <div className="min-w-0">
                <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                  {audit.pageTitle || audit.url}
                </p>
                <p className="text-xs text-muted-foreground truncate">{audit.url}</p>
              </div>
              <div className="w-12 text-center"><ScoreBadge score={audit.seoScore} /></div>
              <div className="w-12 text-center"><ScoreBadge score={audit.aeoScore} /></div>
              <div className="w-12 text-center"><ScoreBadge score={audit.geoScore} /></div>
              <div className="w-24 text-xs text-muted-foreground">
                {new Date(audit.timestamp).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>
              <div
                className="w-16 flex justify-end"
                onClick={(e) => e.preventDefault()} // Prevent row click on delete
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                  onClick={() => deleteAuditMutate(audit.auditId)}
                  id={`delete-audit-${audit.auditId}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * 10 + 1}–{Math.min(page * 10, pagination.total)} of{' '}
            {pagination.total} audits
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasPrevPage}
              onClick={() => setPage((p) => p - 1)}
              id="pagination-prev-btn"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!pagination.hasNextPage}
              onClick={() => setPage((p) => p + 1)}
              id="pagination-next-btn"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
