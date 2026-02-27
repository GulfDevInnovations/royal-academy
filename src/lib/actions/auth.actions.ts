"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

function getSafeLocale(formData: FormData) {
  const rawLocale = (formData.get("locale") as string) || "en";
  return rawLocale === "ar" ? "ar" : "en";
}

export async function signUp(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const firstName = formData.get("firstName") as string;
  const lastName = formData.get("lastName") as string;
  const phone = formData.get("phone") as string;
  const locale = getSafeLocale(formData);

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
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

  redirect(`/${locale}/verify-email`);
}

export async function signIn(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const redirectTo = formData.get("redirectTo") as string | null;
  const locale = getSafeLocale(formData);

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

  const fallback = `/${locale}`;
  const safeRedirect =
    redirectTo && redirectTo.startsWith("/") && !redirectTo.startsWith("//")
      ? redirectTo
      : fallback;

  redirect(safeRedirect);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
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
