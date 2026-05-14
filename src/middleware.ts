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

  // Read JWT from cookie
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET!,
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
