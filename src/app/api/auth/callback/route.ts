import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

type CookieToSet = {
  name: string;
  value: string;
  options: Parameters<Awaited<ReturnType<typeof cookies>>["set"]>[2];
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  const localeFromNext = next?.startsWith("/ar") ? "ar" : "en";
  const safeNext =
    next && next.startsWith("/") && !next.startsWith("//") ? next : `/${localeFromNext}/login`;

  if (!code) {
    return NextResponse.redirect(`${origin}/${localeFromNext}/login?error=missing_code`);
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet: CookieToSet[]) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/${localeFromNext}/login?error=confirmation_failed`);
  }

  // Password recovery flow: exchange code → set session cookies → redirect to update password.
  if (type === "recovery" || safeNext.includes("/update-password")) {
    return NextResponse.redirect(`${origin}${safeNext}`);
  }

  // Update Prisma — mark as verified
  await prisma.user.update({
    where: { id: data.user.id },
    data: {
      isVerified:    true,
      emailVerified: new Date(),
      isActive:      true,
    },
  });

  // Sign out immediately so they have to log in fresh
  await supabase.auth.signOut();

  return NextResponse.redirect(
    `${origin}/${localeFromNext}/login?verified=true`
  );
}