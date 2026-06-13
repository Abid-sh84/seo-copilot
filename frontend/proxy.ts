import { auth } from '@/lib/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  // Protected routes
  const protectedPaths = ['/dashboard', '/blog', '/audit'];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !session?.user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Already logged in trying to visit login page
  if (pathname === '/login' && session?.user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/blog/:path*',
    '/audit/:path*',
    '/login',
  ],
};
