'use client';

import { useQuery } from '@tanstack/react-query';
import { getAudits } from '@/lib/api';
import { BarChart3, Globe, Search, TrendingUp } from 'lucide-react';
import type { AuditListItem } from '@/types/audit';

function StatCard({
  icon: Icon,
  label,
  value,
  iconColor,
  iconBg,
  valueColor,
  isLoading,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  iconColor: string;
  iconBg: string;
  valueColor: string;
  isLoading: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 hover:border-blue-100 hover:shadow-md transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
      </div>
      {isLoading ? (
        <>
          <div className="h-8 w-20 bg-slate-100 rounded-lg animate-pulse mb-1.5" />
          <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
        </>
      ) : (
        <>
          <div className={`text-3xl font-extrabold mb-1 ${valueColor}`}>{value}</div>
          <div className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</div>
        </>
      )}
    </div>
  );
}

export function StatsCards() {
  const { data, isLoading } = useQuery({
    queryKey: ['audits', 1],
    queryFn: () => getAudits(1, 100),
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

  const getScoreColor = (score: number) =>
    score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-500';

  const stats = [
    {
      icon: BarChart3,
      label: 'Total Audits',
      value: total,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      valueColor: 'text-slate-900',
    },
    {
      icon: Search,
      label: 'Avg SEO Score',
      value: audits.length > 0 ? `${avgSEO}/100` : '—',
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
      valueColor: audits.length > 0 ? getScoreColor(avgSEO) : 'text-slate-400',
    },
    {
      icon: Globe,
      label: 'Avg AEO Score',
      value: audits.length > 0 ? `${avgAEO}/100` : '—',
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-50',
      valueColor: audits.length > 0 ? getScoreColor(avgAEO) : 'text-slate-400',
    },
    {
      icon: TrendingUp,
      label: 'Avg GEO Score',
      value: audits.length > 0 ? `${avgGEO}/100` : '—',
      iconColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
      valueColor: audits.length > 0 ? getScoreColor(avgGEO) : 'text-slate-400',
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
