'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { BarChart3, LogOut, PenLine, Search, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

const navItems = [
  { href: '/dashboard', icon: BarChart3, label: 'Dashboard' },
  { href: '/blog',      icon: PenLine,   label: 'Blog Generator' },
  { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
];

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      id="dashboard-sidebar"
      className="w-64 border-r border-slate-200 flex flex-col bg-white shrink-0"
    >
      {/* Logo — clicking navigates to home page */}
      <Link
        href="/"
        id="sidebar-home-link"
        className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-200 flex-shrink-0 group transition-opacity hover:opacity-80"
      >
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm">
          <Search className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-base text-slate-900">
          SEO <span className="text-blue-600">Copilot</span>
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname.startsWith('/audit/')
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-slate-200 shrink-0">
        <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-slate-50">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ?? 'User'}
              className="w-8 h-8 rounded-full ring-1 ring-slate-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-slate-900">{user.name ?? 'User'}</p>
            <p className="text-xs text-slate-500 truncate">{user.email ?? ''}</p>
          </div>
        </div>
        <button
          id="sidebar-signout-btn"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
