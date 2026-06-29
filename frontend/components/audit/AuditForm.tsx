'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Search, AlertCircle } from 'lucide-react';
import { runAudit } from '@/lib/api';

export function AuditForm() {
  const [url, setUrl] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const router = useRouter();

  const { mutate, isPending, error } = useMutation({
    mutationFn: (url: string) => runAudit(url),
    onSuccess: (data) => {
      const auditId = data?.data?.auditId;
      if (auditId) {
        router.push(`/audit/${auditId}`);
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setValidationError('Please enter a URL');
      return;
    }

    try {
      const normalized = trimmed.startsWith('http') ? trimmed : `https://${trimmed}`;
      new URL(normalized);
    } catch {
      setValidationError('Please enter a valid URL (e.g. example.com or https://example.com)');
      return;
    }

    mutate(url.trim());
  };

  const errorMessage =
    validationError ??
    (error instanceof Error ? error.message : error ? 'An error occurred' : null);

  return (
    <form onSubmit={handleSubmit} className="space-y-3" id="audit-form">
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="audit-url-input"
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setValidationError(null);
            }}
            placeholder="Enter a URL to audit (e.g. https://example.com)"
            disabled={isPending}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all disabled:opacity-50"
            autoComplete="url"
          />
        </div>
        <button
          type="submit"
          id="audit-submit-btn"
          disabled={isPending || !url.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold px-6 py-2.5 rounded-lg transition-colors shadow-sm shadow-blue-500/20 min-w-[130px] flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Auditing...
            </>
          ) : (
            'Run Audit'
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Loading State Info */}
      {isPending && (
        <p className="text-xs text-slate-500 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          Running SEO, AEO, and GEO analysis with Gemini AI recommendations...
        </p>
      )}
    </form>
  );
}
