"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { syncRoleToAppMetadata } from "@/lib/supabase/admin";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { headers } from "next/headers";

function normalizeOmanPhoneToE164(input: string | null | undefined): string | null {
  const raw = (input ?? "").trim();
  if (!raw) return null;

  // Keep already-E.164 values (best effort).
  if (raw.startsWith("+")) return raw;

  // Remove spaces/dashes/etc.
  const digitsOnly = raw.replace(/\D/g, "");

  // Common cases
  if (digitsOnly.length === 8) return `+968${digitsOnly}`;
  if (digitsOnly.startsWith("968") && digitsOnly.length === 11) return `+${digitsOnly}`;
  if (digitsOnly.startsWith("00968") && digitsOnly.length === 14) return `+${digitsOnly.slice(2)}`;

  // Fallback: store as-is (server-side validation can be added later).
  return raw;
}

function getSafeLocale(formData: FormData) {
  const rawLocale = (formData.get("locale") as string) || "en";
  return rawLocale === "ar" ? "ar" : "en";
}

async function getRequestOrigin() {
  const headerStore = await headers();
  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost ?? headerStore.get("host");
  const proto = forwardedProto ?? (host?.startsWith("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.royalacadeymct.com";
}

export async function signUp(formData: FormData) {
  const email     = formData.get("email")     as string;
  const password  = formData.get("password")  as string;
  const firstName = formData.get("firstName") as string;
  const lastName  = formData.get("lastName")  as string;
  const phoneRaw  = formData.get("phone")     as string | null;
  const phone     = normalizeOmanPhoneToE164(phoneRaw);
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
      phone,
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
  try {
    await syncRoleToAppMetadata(data.user.id, "STUDENT");
  } catch {
    // Non-fatal in dev; role can be re-synced later.
  }

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
  console.log('data', data)

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
    console.log('dbUser', JSON.stringify(dbUser))
    const currentRole = (data.user.app_metadata?.role as string | undefined) ?? null;
    console.log('currentRole', currentRole)
    if (dbUser.role !== currentRole) {
      try {
        await syncRoleToAppMetadata(data.user.id, dbUser.role);
      } catch {
        // Non-fatal in dev; avoids breaking login if service role key is missing/misconfigured.
      }
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

export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const locale = getSafeLocale(formData);

  if (!email) return { error: "Please enter your email." };

  const supabase = await createClient();

  // NOTE: Don't leak whether an email exists.
  const origin = await getRequestOrigin();
  const redirectTo = `${origin}/api/auth/callback?next=/${locale}/update-password`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  if (error) {
    // Keep the same generic behavior; still return an error string for obvious misconfig.
    return { error: error.message };
  }

  return { success: true };
}

export async function updatePassword(formData: FormData) {
  const password = (formData.get("password") as string | null) ?? "";
  const locale = getSafeLocale(formData);

  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your reset link may have expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };

  // Optional: sign out so user re-authenticates with new password.
  await supabase.auth.signOut();
  redirect(`/${locale}/login?passwordUpdated=true`);
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