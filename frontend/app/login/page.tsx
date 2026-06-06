import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In — SEO Copilot',
  description: 'Sign in to SEO Copilot with your Google account to start auditing your website.',
};

export default async function LoginPage() {
  const session = await auth();

  // Already logged in → go to dashboard
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/8 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-600/6 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 gradient-brand rounded-xl flex items-center justify-center glow-blue">
              <Search className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-2xl gradient-text">SEO Copilot</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
          <p className="text-muted-foreground text-sm">
            Sign in to audit your websites and track your SEO, AEO & GEO scores
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-xs text-muted-foreground mt-6">
          By signing in, you agree to our{' '}
          <a href="#" className="underline hover:text-foreground transition-colors">
            Terms of Service
          </a>{' '}
          and{' '}
          <a href="#" className="underline hover:text-foreground transition-colors">
            Privacy Policy
          </a>
        </p>
      </div>
    </main>
  );
}
