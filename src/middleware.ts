import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip API routes entirely
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Run intl middleware first
  const intlResponse = intlMiddleware(request);
  const response = intlResponse || NextResponse.next({ request });

  // Set up Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user (also refreshes session if expired)
  const { data: { user } } = await supabase.auth.getUser();

  // Detect current locale from pathname
  const locale = pathname.startsWith("/ar") ? "ar" : "en";

  const isAuthPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify-email");

  const isProtected =
    pathname.includes("/profile") ||
    pathname.includes("/my-classes") ||
    pathname.includes("/payments");

  // Unverified user trying to access non-auth pages
  if (user && !user.email_confirmed_at && !isAuthPage) {
    return NextResponse.redirect(
      new URL(`/${locale}/verify-email`, request.url)
    );
  }

  // Unauthenticated user trying to access protected pages
  if (!user && isProtected) {
    return NextResponse.redirect(
      new URL(`/${locale}/login`, request.url)
    );
  }

  // Already logged in and verified — redirect away from auth pages
  // if (user && user.email_confirmed_at && isAuthPage) {
  //   return NextResponse.redirect(
  //     new URL(`/${locale}`, request.url)
  //   );
  // }

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};