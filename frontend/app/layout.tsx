import type { Metadata } from 'next';
import { Inter, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: {
    default: 'SEO Copilot — AI-Powered SEO, AEO & GEO Audit Platform',
    template: '%s | SEO Copilot',
  },
  description:
    'The AI-Powered SEO Operating System. Audit your website for SEO, AEO & GEO with Google Gemini AI. Rank on Google, ChatGPT, Perplexity & AI Overviews.',
  keywords: ['SEO audit', 'AEO', 'GEO', 'AI SEO tool', 'website audit', 'SEO score', 'AI search optimization'],
  authors: [{ name: 'Abid Shaikh' }],
  openGraph: {
    type: 'website',
    title: 'SEO Copilot — AI-Powered SEO Operating System',
    description: 'Audit, Optimize & Rank across Google, ChatGPT, Perplexity and all AI search engines.',
    siteName: 'SEO Copilot',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SEO Copilot — AI SEO Operating System',
    description: 'Rank on every search engine — traditional and AI-powered.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${geistMono.variable} font-sans antialiased min-h-screen bg-background`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
