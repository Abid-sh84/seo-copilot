import type { Metadata } from 'next';
import { AuditForm } from '@/components/audit/AuditForm';
import { AuditHistoryTable } from '@/components/dashboard/AuditHistoryTable';
import { StatsCards } from '@/components/dashboard/StatsCards';

export const metadata: Metadata = {
  title: 'Dashboard — SEO Copilot',
  description: 'View your audit history, run new audits, and track your SEO, AEO, and GEO scores.',
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">
          Run a new audit or review your SEO history
        </p>
      </div>

      {/* New Audit Form */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
          ⚡ New Audit
        </h2>
        <AuditForm />
      </div>

      {/* Stats Overview */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Overview
        </h2>
        <StatsCards />
      </div>

      {/* Audit History */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
          Recent Audits
        </h2>
        <AuditHistoryTable />
      </div>
    </div>
  );
}
