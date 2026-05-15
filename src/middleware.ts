// middleware.ts
import { getToken } from 'next-auth/jwt';
import createIntlMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './i18n/routing';

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  const intlResponse = intlMiddleware(request);
  const response = intlResponse || NextResponse.next({ request });

  // Auth.js v5 prefers AUTH_SECRET over NEXTAUTH_SECRET. Use the same
  // resolution order here so getToken decrypts with the same key Auth.js used.
  // In production behind a proxy the cookie gets the __Secure- prefix, so
  // secureCookie must be true or getToken looks for the wrong cookie name.
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET!;
  const token = await getToken({
    req: request,
    secret,
    secureCookie: process.env.NODE_ENV === 'production',
  });

  const locale = pathname.startsWith('/ar') ? 'ar' : 'en';

  const noNavPage =
    pathname.includes('/login') ||
    pathname.includes('/signup') ||
    pathname.includes('/verify-email') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/update-password') ||
    pathname.includes('/admin');

  const isProtected =
    pathname.includes('/profile') ||
    pathname.includes('/my-classes') ||
    pathname.includes('/payments');

  const isAdminRoute = pathname.includes('/admin');

  if (isAdminRoute) {
    if (!token) {
      return NextResponse.redirect(
        new URL(`/${locale}/login?redirectTo=${pathname}`, request.url),
      );
    }
    if (token.role !== 'ADMIN') {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // Unverified user
  if (token && !token.isVerified && !noNavPage) {
    return NextResponse.redirect(
      new URL(`/${locale}/verify-email`, request.url),
    );
  }

  // Unauthenticated on protected page
  if (!token && isProtected) {
    return NextResponse.redirect(new URL(`/${locale}/login`, request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
};
