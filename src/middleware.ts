import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

type CookieToSet = {
  name: string;
  value: string;
  // Next.js' cookie options type is not exported cleanly; use explicit any to
  // avoid implicit-any errors while keeping middleware simple.
  options: any;
};

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
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Get current user (also refreshes session if expired)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Detect current locale from pathname
  const locale = pathname.startsWith("/ar") ? "ar" : "en";

  const noNavPage =
    pathname.includes("/login") ||
    pathname.includes("/signup") ||
    pathname.includes("/verify-email") ||
    pathname.includes("/forgot-password") ||
    pathname.includes("/update-password") ||
    pathname.includes("/admin");
  const isProtected =
    pathname.includes("/profile") ||
    pathname.includes("/my-classes") ||
    pathname.includes("/payments");

  // ✅ Admin route protection
  // Any path segment containing /admin requires ADMIN role
  const isAdminRoute = pathname.includes("/admin");

  if (isAdminRoute) {
    // Not logged in → send to login
    if (!user) {
      return NextResponse.redirect(
        new URL(`/${locale}/login?redirectTo=${pathname}`, request.url)
      );
    }

    // Logged in but not ADMIN → send to home (silent, no error exposed)
    // Role is in app_metadata — server-signed, cannot be spoofed by the user
    const role = user.app_metadata?.role as string | undefined;
    if (role !== "ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}`, request.url));
    }
  }

  // Unverified user trying to access non-auth pages
  if (user && !user.email_confirmed_at && !noNavPage) {
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

  return response;
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};