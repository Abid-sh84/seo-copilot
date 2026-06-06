import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Search, Brain, Globe, Zap, BarChart3, Shield, CheckCircle, Star } from 'lucide-react';

export const metadata: Metadata = {
  title: 'SEO Copilot — AI-Powered SEO, AEO & GEO Audit Platform',
  description: 'Audit your website for SEO, AEO & GEO with Google Gemini AI. Rank on Google, ChatGPT & Perplexity in under 10 seconds.',
};

const painPoints = [
  'How do I find keywords that actually convert?',
  'Which pages need optimization right now?',
  'Why are competitors ranking faster than us?',
  'How do I optimize hundreds of pages manually?',
  'Too many SEO tools for one job?',
  'Why is my site not appearing in AI answers?',
  'How do I maintain consistency across all pages?',
  'How do I track GEO performance?',
];

const features = [
  { icon: Search,   title: 'SEO Audit Engine',       desc: '16-point technical SEO check — meta tags, schema, broken links, HTTPS, Core Web Vitals and more.',            color:'#2563eb', bg:'#eff6ff' },
  { icon: Brain,    title: 'AEO Analyzer',            desc: 'Score content for AI answer readiness — FAQ sections, question headings, featured snippet potential.',         color:'#7c3aed', bg:'#f5f3ff' },
  { icon: Globe,    title: 'GEO Analyzer',            desc: 'Measure how likely ChatGPT & Gemini are to cite your content. Entity coverage, citations, brand signals.',     color:'#0891b2', bg:'#ecfeff' },
  { icon: Zap,      title: 'AI Recommendations',      desc: 'Gemini-powered fixes for every failed check — including ready-to-paste JSON-LD schema snippets.',             color:'#d97706', bg:'#fffbeb' },
  { icon: BarChart3,title: 'Audit History & Trends',  desc: 'Track SEO, AEO and GEO scores over time with trend charts and comparisons across all audited URLs.',          color:'#059669', bg:'#ecfdf5' },
  { icon: Shield,   title: 'PDF Reports',             desc: 'Generate clean, branded PDF reports — perfect for sharing with clients or documenting progress.',              color:'#e11d48', bg:'#fff1f2' },
];

const steps = [
  { n:'01', title:'Enter Your URL',        desc:'Paste any webpage URL into SEO Copilot — no setup or integrations required.' },
  { n:'02', title:'AI Runs the Audit',     desc:'Gemini AI analyses 32+ signals across SEO, AEO and GEO in under 10 seconds.' },
  { n:'03', title:'Get Actionable Fixes',  desc:'Receive prioritised recommendations with copy-paste code snippets for every issue.' },
];

const stats = [
  { value:'16+', label:'SEO Checks',    sub:'Per audit' },
  { value:'10+', label:'AEO Signals',   sub:'AI readiness' },
  { value:'6+',  label:'GEO Factors',   sub:'LLM citations' },
  { value:'<10s',label:'Audit Time',    sub:'Average speed' },
];

const testimonials = [
  { name:'Sarah Chen',      role:'SEO Lead, TechFlow',       stars:5, quote:'The first tool that covers AI search. AEO analysis alone saved us weeks of manual work.' },
  { name:'Marcus Rodriguez',role:'Founder, GrowthAgency',    stars:5, quote:'We reduced 80 % of manual SEO work. AI recommendations with copy-paste snippets are a game changer.' },
  { name:'Priya Nair',      role:'Head of Marketing, SaaSify',stars:5, quote:'Finally a tool that audits for ChatGPT visibility. Our GEO score jumped 30 points in a month.' },
];

const avatarColors = ['#3B82F6','#8B5CF6','#EC4899','#10B981'];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans">

      {/* ── Navbar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
              <Search className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg">SEO <span className="text-blue-600">Copilot</span></span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {['#features','#how-it-works','#testimonials'].map((href, i) => (
              <a key={href} href={href} className="text-sm text-slate-600 hover:text-slate-900 transition-colors font-medium">
                {['Features','How It Works','Reviews'][i]}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-600 hover:text-slate-900 font-medium transition-colors" id="nav-login">Login</Link>
            <Link href="/login" id="nav-cta" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm">
              Try for free
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="relative py-20 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/70 via-white to-violet-50/40 pointer-events-none" />
        <div className="relative max-w-7xl mx-auto grid lg:grid-cols-2 gap-14 items-center">

          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-6 border border-blue-100">
              <Zap className="w-3 h-3" /> Powered by Google Gemini AI
            </div>
            <p className="text-blue-600 font-semibold text-base mb-3 tracking-wide">Audit. Optimize. Rank.</p>
            <h1 className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold text-slate-900 leading-[1.1] tracking-tight mb-6">
              Your AI-Powered{' '}
              <span className="bg-blue-600 text-white px-3 py-1 rounded-xl inline-block">SEO</span>
              {' '}Audit Platform
            </h1>
            <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-xl">
              The only platform that audits across traditional search, AI answer engines (ChatGPT, Perplexity), and generative AI citations — in under 10 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/login" id="hero-start" className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-7 py-3.5 rounded-lg transition-colors text-base shadow-md shadow-blue-500/20">
                Start Free Audit <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold px-7 py-3.5 rounded-lg border border-slate-200 transition-colors text-base">
                See How It Works
              </a>
            </div>
            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {['S','M','P','A'].map((l, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs font-bold text-white" style={{ background: avatarColors[i] }}>{l}</div>
                ))}
              </div>
              <p className="text-sm text-slate-500"><span className="font-semibold text-slate-800">500+</span> teams already auditing</p>
            </div>
          </div>

          {/* Dashboard Mockup */}
          <div className="relative">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-slate-400 border border-slate-200 font-mono">
                  app.seocopilot.ai/audit
                </div>
              </div>
              {/* Body */}
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Audit complete for</p>
                    <p className="font-semibold text-slate-800 text-sm">yourwebsite.com</p>
                  </div>
                  <span className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-2.5 py-1 font-medium">✓ Done in 7.2s</span>
                </div>
                {/* Scores */}
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{ label:'SEO', score:87, bg:'#eff6ff', color:'#1d4ed8' }, { label:'AEO', score:74, bg:'#f5f3ff', color:'#6d28d9' }, { label:'GEO', score:61, bg:'#ecfeff', color:'#0e7490' }].map(s => (
                    <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: s.bg }}>
                      <p className="text-2xl font-extrabold" style={{ color: s.color }}>{s.score}</p>
                      <p className="text-xs font-semibold mt-0.5 text-slate-500">{s.label} Score</p>
                    </div>
                  ))}
                </div>
                {/* Checks */}
                <div className="space-y-2 mb-4">
                  {[
                    { label:'Meta Title & Description', status:'pass' },
                    { label:'Schema Markup (JSON-LD)',  status:'pass' },
                    { label:'Core Web Vitals',          status:'warn' },
                    { label:'FAQ & Question Headings',  status:'pass' },
                    { label:'GEO Entity Coverage',      status:'fail' },
                  ].map(c => (
                    <div key={c.label} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${c.status==='pass'?'bg-green-500':c.status==='warn'?'bg-yellow-500':'bg-red-400'}`} />
                        <span className="text-xs text-slate-700">{c.label}</span>
                      </div>
                      <span className={`text-xs font-semibold ${c.status==='pass'?'text-green-600':c.status==='warn'?'text-yellow-600':'text-red-500'}`}>
                        {c.status==='pass'?'Pass':c.status==='warn'?'Warn':'Fix'}
                      </span>
                    </div>
                  ))}
                </div>
                {/* AI Tip */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-[9px] font-bold">AI</span>
                    </div>
                    <span className="text-xs font-semibold text-blue-800">Gemini Recommendation</span>
                  </div>
                  <p className="text-xs text-blue-700 leading-relaxed">Add FAQ schema to boost AEO score by ~15 pts. Ready-to-paste JSON-LD snippet available ↓</p>
                </div>
              </div>
            </div>
            {/* Floating badges */}
            <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-lg shadow-blue-500/30">+23% Traffic ↑</div>
            <div className="absolute -bottom-3 -left-3 bg-white text-slate-800 text-xs font-semibold px-3.5 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Audit running…
            </div>
          </div>

        </div>
      </section>

      {/* ── Pain Points ──────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white border-t border-slate-100">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 mb-5">SEO is getting harder</h2>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto mb-14">AI search, answer engines and generative citations add complexity to an already difficult discipline.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {painPoints.map((p, i) => (
              <span key={i} className={`text-sm px-4 py-2.5 rounded-full border font-medium select-none ${i%3===0?'bg-slate-900 text-white border-slate-900':i%3===1?'bg-white text-slate-600 border-slate-300':'bg-slate-50 text-slate-400 border-slate-100'}`}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────── */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3.5 py-1.5 rounded-full mb-4 border border-blue-100">
              <CheckCircle className="w-3 h-3" /> Everything in one platform
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">One platform to <span className="text-blue-600">audit, optimize & rank</span></h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-lg">Full visibility spectrum — traditional SEO, AI answer engines, and generative AI citations.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-100 hover:border-blue-100 hover:shadow-md transition-all duration-300">
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ background: f.bg }}>
                  <f.icon className="w-5 h-5" style={{ color: f.color }} />
                </div>
                <h3 className="font-bold text-slate-900 text-base mb-2">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Up and running in <span className="text-blue-600">3 steps</span></h2>
          <p className="text-slate-500 text-lg">No setup, no integrations required. Just paste a URL and go.</p>
        </div>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-8">
          {steps.map((s, i) => (
            <div key={s.n} className="relative text-center">
              {i < steps.length - 1 && <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-slate-200" />}
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-blue-500/20">
                <span className="text-white font-extrabold text-lg">{s.n}</span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-2">{s.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Stats ────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-blue-600">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(s => (
            <div key={s.label}>
              <p className="text-4xl font-extrabold text-white mb-1">{s.value}</p>
              <p className="text-blue-100 font-semibold text-sm">{s.label}</p>
              <p className="text-blue-200 text-xs mt-0.5">{s.sub}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">Loved by SEO teams</h2>
            <p className="text-slate-500 text-lg">Real results from teams using SEO Copilot every day.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.name} className="bg-white rounded-2xl p-7 border border-slate-100 hover:shadow-md transition-shadow">
                <div className="flex mb-4">
                  {Array.from({length:t.stars}).map((_,i) => <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}
                </div>
                <p className="text-slate-700 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">{t.name[0]}</div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-slate-400 text-xs">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4">
            Ready to rank on every <span className="text-blue-600">search engine?</span>
          </h2>
          <p className="text-slate-500 text-lg mb-8">Sign in with Google and run your first audit in under 30 seconds. No credit card required.</p>
          <Link href="/login" id="cta-btn" className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-9 py-4 rounded-xl text-lg transition-colors shadow-xl shadow-blue-500/20">
            Start Free Audit <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-slate-400 text-sm mt-4">Free forever · No credit card · Powered by Gemini AI</p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-slate-100 bg-slate-50 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
              <Search className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-slate-900">SEO <span className="text-blue-600">Copilot</span></span>
          </div>
          <p className="text-sm text-slate-400 text-center">© 2026 SEO Copilot · Built by Abid Shaikh · Powered by Google Gemini</p>
          <div className="flex items-center gap-5">
            <a href="#features"     className="text-sm text-slate-400 hover:text-slate-700 transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-slate-400 hover:text-slate-700 transition-colors">How It Works</a>
            <Link href="/login"     className="text-sm text-slate-400 hover:text-slate-700 transition-colors">Login</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
