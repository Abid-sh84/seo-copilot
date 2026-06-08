'use client';

import { useQuery } from '@tanstack/react-query';
import { getAudits } from '@/lib/api';
import { BarChart3, Globe, Search, TrendingUp } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import type { AuditListItem } from '@/types/audit';
//stats card

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color: string;
  isLoading: boolean;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 ${color} rounded-lg flex items-center justify-center`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
      </div>
      {isLoading ? (
        <>
          <Skeleton className="h-8 w-16 mb-1" />
          <Skeleton className="h-4 w-24" />
        </>
      ) : (
        <>
          <div className="text-2xl font-bold mb-1">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </>
      )}
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['audits', 1],
    queryFn: () => getAudits(1, 100), // Get all for stats
  });

  const audits: AuditListItem[] = data?.data?.audits ?? [];
  const total = data?.data?.pagination?.total ?? 0;

  const avgSEO =
    audits.length > 0
      ? Math.round(audits.reduce((s, a) => s + a.seoScore, 0) / audits.length)
      : 0;

  const avgAEO =
    audits.length > 0
      ? Math.round(audits.reduce((s, a) => s + a.aeoScore, 0) / audits.length)
      : 0;

  const avgGEO =
    audits.length > 0
      ? Math.round(audits.reduce((s, a) => s + a.geoScore, 0) / audits.length)
      : 0;

  const stats = [
    {
      icon: BarChart3,
      label: 'Total Audits',
      value: total,
      color: 'bg-blue-500/15 text-blue-400',
    },
    {
      icon: Search,
      label: 'Avg SEO Score',
      value: audits.length > 0 ? avgSEO : '—',
      color: 'bg-purple-500/15 text-purple-400',
    },
    {
      icon: Globe,
      label: 'Avg AEO Score',
      value: audits.length > 0 ? avgAEO : '—',
      color: 'bg-cyan-500/15 text-cyan-400',
    },
    {
      icon: TrendingUp,
      label: 'Avg GEO Score',
      value: audits.length > 0 ? avgGEO : '—',
      color: 'bg-green-500/15 text-green-400',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} isLoading={isLoading} />
      ))}
    </div>
  );
}
