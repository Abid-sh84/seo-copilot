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
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Run a new audit or review your history
        </p>
      </div>

      {/* New Audit Form */}
      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4">Run a New Audit</h2>
        <AuditForm />
      </div>

      {/* Stats Cards */}
      <StatsCards />

      {/* Audit History */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Audits</h2>
        <AuditHistoryTable />
      </div>
    </div>
  );
}
