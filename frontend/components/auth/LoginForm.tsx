'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Loader2, CircleAlert, CheckCircle } from 'lucide-react';

/** Coloured Google "G" logo */
function GoogleIcon() {
  return (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

const benefits = [
  '16-point SEO technical audit',
  '10-check AEO answer engine analysis',
  '6-check GEO readiness scoring',
  'Gemini AI fix recommendations',
  'Full audit history & PDF export',
];

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setError('Something went wrong. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
          <CircleAlert className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Google sign-in button */}
      <button
        id="google-signin-btn"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 h-12 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm border border-slate-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        ) : (
          <GoogleIcon />
        )}
        {isLoading ? 'Signing in…' : 'Continue with Google'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-slate-100" />
        <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
          What you get
        </span>
        <div className="flex-1 h-px bg-slate-100" />
      </div>

      {/* Benefits list */}
      <ul className="space-y-2.5">
        {benefits.map((item) => (
          <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
            <CheckCircle className="w-4 h-4 flex-shrink-0 text-blue-600" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
