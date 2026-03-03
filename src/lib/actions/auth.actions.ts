"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncRoleToAppMetadata } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function getSafeLocale(formData: FormData) {
  const rawLocale = (formData.get("locale") as string) || "en";
  return rawLocale === "ar" ? "ar" : "en";
}

export async function signUp(formData: FormData) {
  const email     = formData.get("email")     as string;
  const password  = formData.get("password")  as string;
  const firstName = formData.get("firstName") as string;
  const lastName  = formData.get("lastName")  as string;
  const phone     = formData.get("phone")     as string;
  const locale    = getSafeLocale(formData);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
      // user_metadata is fine for non-sensitive display info only
      data: { firstName, lastName },
    },
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Could not create user. Please try again." };
  if (data.user.identities?.length === 0) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.create({
    data: {
      id: data.user.id,
      email,
      phone: phone || null,
      passwordHash,
      role: "STUDENT",
      isActive: true,
      isVerified: false,
      studentProfile: {
        create: { firstName, lastName },
      },
    },
  });

  // ✅ Write role to app_metadata (tamper-proof) via service role key
  await syncRoleToAppMetadata(data.user.id, "STUDENT");

  redirect(`/${locale}/verify-email`);
}

export async function signIn(formData: FormData) {
  const email      = formData.get("email")      as string;
  const password   = formData.get("password")   as string;
  const redirectTo = formData.get("redirectTo") as string | null;
  const locale     = getSafeLocale(formData);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };
  if (!data.user) return { error: "Login failed. Please try again." };

  if (!data.user.email_confirmed_at) {
    await supabase.auth.resend({ type: "signup", email });
    return {
      error: "Please confirm your email first. We sent a new confirmation link.",
    };
  }

  // ✅ Sync role from Prisma → app_metadata on every login.
  // Ensures manual DB promotions (STUDENT → ADMIN) take effect
  // on the very next sign-in without any extra manual step.
  const dbUser = await prisma.user.findUnique({
    where: { id: data.user.id },
    select: { role: true },
  });

  if (dbUser) {
    const currentRole = data.user.app_metadata?.role;
    if (dbUser.role !== currentRole) {
      await syncRoleToAppMetadata(data.user.id, dbUser.role);
    }
  }

  const fallback = `/${locale}`;
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : fallback;

  redirect(safeRedirect);
}

export async function signOut(formData: FormData) {
  const locale   = getSafeLocale(formData);
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect(`/${locale}`);
}

export async function resendVerification(email: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });
  if (error) return { error: error.message };
  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Helper for Server Components / Actions that need to verify
// the current user is ADMIN.
// ─────────────────────────────────────────────────────────────
export async function getAdminSession() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, role: null };

  // app_metadata is server-signed — cannot be spoofed from the browser
  const role = (user.app_metadata?.role as string) ?? null;
  return { user, role };
}