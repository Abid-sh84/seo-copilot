import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { Sidebar } from '@/components/layout/Sidebar';

export const metadata: Metadata = {
  title: 'Blog Generator — SEO Copilot',
  description: 'Generate SEO + AEO + GEO optimized blog content with Google Gemini AI.',
};

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar user={session.user} />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
