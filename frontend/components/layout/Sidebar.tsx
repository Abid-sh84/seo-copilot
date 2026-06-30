'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import {
  BarChart3, LogOut, PenLine, Search,
  Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
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

const STORAGE_KEY = 'seo-copilot-sidebar-collapsed';

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Restore persisted state after mount (avoid SSR mismatch)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'true') setCollapsed(true);
    setMounted(true);
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem(STORAGE_KEY, String(!prev));
      return !prev;
    });
  };

  return (
    <aside
      id="dashboard-sidebar"
      className={cn(
        'relative flex flex-col bg-white border-r border-slate-200 shrink-0 transition-[width] duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* ── Header ── */}
      <div className="h-16 flex items-center border-b border-slate-200 shrink-0 overflow-hidden">
        {/* Logo area */}
        <Link
          href="/"
          id="sidebar-home-link"
          className={cn(
            'flex items-center gap-2.5 group transition-opacity hover:opacity-80 min-w-0',
            collapsed ? 'px-4 justify-center w-full' : 'px-5'
          )}
        >
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-sm shrink-0">
            <Search className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <span className="font-bold text-base text-slate-900 whitespace-nowrap">
              SEO <span className="text-blue-600">Copilot</span>
            </span>
          )}
        </Link>
      </div>

      {/* Toggle button — lives OUTSIDE overflow-hidden containers so it's never clipped */}
      <button
        id="sidebar-toggle"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={cn(
          'absolute -right-3.5 top-[30px] z-30',
          'w-7 h-7 rounded-full bg-white border-2 border-slate-200 shadow-md',
          'flex items-center justify-center text-slate-500',
          'hover:text-blue-600 hover:border-blue-400 hover:shadow-blue-100',
          'transition-all duration-150',
          !mounted && 'opacity-0'
        )}
      >
        {collapsed
          ? <ChevronRight className="w-4 h-4" />
          : <ChevronLeft  className="w-4 h-4" />
        }
      </button>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard' || pathname.startsWith('/audit/')
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              id={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              title={collapsed ? item.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                collapsed ? 'justify-center' : '',
                isActive
                  ? 'bg-blue-50 text-blue-600 border border-blue-100'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* ── User Profile ── */}
      <div className="p-2 border-t border-slate-200 shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-3 px-2 py-2 mb-2 rounded-lg bg-slate-50">
            {user.image ? (
              <img
                src={user.image}
                alt={user.name ?? 'User'}
                className="w-8 h-8 rounded-full ring-1 ring-slate-200 shrink-0"
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
        )}

        {/* Sign out — icon-only when collapsed */}
        <button
          id="sidebar-signout-btn"
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Sign out' : undefined}
          className={cn(
            'w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-500',
            'hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium',
            collapsed ? 'justify-center' : ''
          )}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && 'Sign Out'}
        </button>
      </div>
    </aside>
  );
}
