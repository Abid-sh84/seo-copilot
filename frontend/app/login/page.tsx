import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { LoginForm } from '@/components/auth/LoginForm';
import { Search, BarChart3, Zap, Globe, Shield, CheckCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sign In — SEO Copilot',
  description:
    'Sign in to SEO Copilot with your Google account to start auditing your website.',
};

const features = [
  { icon: BarChart3, label: '16-point SEO technical audit',         color: '#2563eb', bg: '#eff6ff' },
  { icon: Zap,       label: 'Gemini AI fix recommendations',         color: '#d97706', bg: '#fffbeb' },
  { icon: Globe,     label: '10-check AEO answer engine analysis',   color: '#0891b2', bg: '#ecfeff' },
  { icon: Shield,    label: '6-check GEO readiness scoring',         color: '#7c3aed', bg: '#f5f3ff' },
];

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect('/dashboard');

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">

      {/* ── Navbar (matches home page) ─────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">
              SEO <span className="text-blue-600">Copilot</span>
            </span>
          </div>
          <a
            href="/"
            className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors"
          >
            ← Back to home
          </a>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="flex flex-1">
        {/* Left panel – branding (hidden on mobile) */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden bg-gradient-to-br from-blue-50/70 via-white to-violet-50/40 border-r border-slate-100">

          {/* Hero copy */}
          <div className="space-y-8 my-auto">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-blue-100">
              <Zap className="w-3 h-3" /> Powered by Google Gemini AI
            </div>

            <div className="space-y-4">
              <p className="text-blue-600 font-semibold text-base tracking-wide">
                Audit. Optimize. Rank.
              </p>
              <h1 className="text-4xl xl:text-5xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Your AI-Powered{' '}
                <span className="bg-blue-600 text-white px-3 py-1 rounded-xl inline-block">
                  SEO
                </span>{' '}
                Audit Platform
              </h1>
              <p className="text-slate-500 text-lg leading-relaxed max-w-md">
                Get a complete SEO, AEO &amp; GEO health check for any URL —
                backed by Gemini AI recommendations in seconds.
              </p>
            </div>

            {/* Feature list */}
            <ul className="space-y-3">
              {features.map(({ icon: Icon, label, color, bg }) => (
                <li key={label} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: bg }}
                  >
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Testimonial */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <div className="flex gap-0.5 mb-3">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
            </div>
            <p className="text-sm text-slate-700 leading-relaxed italic mb-3">
              &ldquo;SEO Copilot cut our audit time from hours to minutes and surfaced issues we had completely missed.&rdquo;
            </p>
            <p className="text-xs text-slate-400 font-medium">— Product team at a SaaS startup</p>
          </div>
        </div>

        {/* Right panel – sign in form */}
        <div className="flex flex-1 items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md space-y-8">

            {/* Mobile logo (hidden on lg) */}
            <div className="flex lg:hidden flex-col items-center gap-3 text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-md">
                <Search className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-2xl">
                SEO <span className="text-blue-600">Copilot</span>
              </span>
            </div>

            {/* Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
              <div className="text-center space-y-1">
                <h2 className="text-2xl font-extrabold text-slate-900">Welcome back</h2>
                <p className="text-sm text-slate-500">
                  Sign in to audit your websites and track your SEO, AEO &amp; GEO scores
                </p>
              </div>
              <LoginForm />
            </div>

            <p className="text-center text-xs text-slate-400">
              By signing in, you agree to our{' '}
              <a href="#" className="underline underline-offset-2 hover:text-slate-700 transition-colors">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="underline underline-offset-2 hover:text-slate-700 transition-colors">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
