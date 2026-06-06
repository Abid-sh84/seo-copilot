'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
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

    // Basic URL validation
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
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
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-background border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all disabled:opacity-50"
            autoComplete="url"
          />
        </div>
        <Button
          type="submit"
          id="audit-submit-btn"
          disabled={isPending || !url.trim()}
          className="gradient-brand text-white border-0 glow-blue px-6 font-semibold min-w-[130px]"
        >
          {isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Auditing...
            </>
          ) : (
            'Run Audit'
          )}
        </Button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {errorMessage}
        </div>
      )}

      {/* Loading State Info */}
      {isPending && (
        <p className="text-xs text-muted-foreground flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          Running SEO, AEO, and GEO analysis with Gemini AI recommendations...
        </p>
      )}
    </form>
  );
}
