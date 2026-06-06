'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

// Google Icon SVG
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

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
    <div className="glass-card p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-lg font-semibold">Sign in to your account</h2>
        <p className="text-sm text-muted-foreground">
          Use your Google account to sign in securely
        </p>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3">
          {error}
        </div>
      )}

      <Button
        id="google-signin-btn"
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full h-12 bg-white hover:bg-gray-50 text-gray-900 border border-gray-200 font-medium gap-3 transition-all duration-200 hover:shadow-lg"
        variant="outline"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        {isLoading ? 'Signing in...' : 'Continue with Google'}
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs text-muted-foreground">
          <span className="bg-card px-3">What you get access to</span>
        </div>
      </div>

      <ul className="space-y-2 text-sm text-muted-foreground">
        {[
          '16-point SEO technical audit',
          '10-check AEO answer engine analysis',
          '6-check GEO readiness scoring',
          'Gemini AI fix recommendations',
          'Full audit history & PDF export',
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full gradient-brand flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
