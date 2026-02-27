"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function signUp(formData: FormData) {
  const email     = formData.get("email")     as string;
  const password  = formData.get("password")  as string;
  const firstName = formData.get("firstName") as string;
  const lastName  = formData.get("lastName")  as string;
  const phone     = formData.get("phone")     as string;

  const supabase = await createClient();

  // Tell Supabase where to redirect after email confirmation
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  });

  if (error) return { error: error.message };

  // Check if user already exists but is unconfirmed
  if (data.user && data.user.identities?.length === 0) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Create in Prisma — isVerified false until email confirmed
  await prisma.user.create({
    data: {
      id:          data.user!.id,
      email,
      phone:       phone || null,
      passwordHash,
      role:        "STUDENT",
      isActive:    true,
      isVerified:  false, // becomes true after callback
      studentProfile: {
        create: { firstName, lastName },
      },
    },
  });

  redirect("/en/verify-email");
}

export async function signIn(formData: FormData) {
  const email    = formData.get("email")    as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) return { error: error.message };

  // Check if email is confirmed in Supabase
  if (!data.user.email_confirmed_at) {
    // Resend confirmation email
    await supabase.auth.resend({ type: "signup", email });
    return { error: "Please confirm your email first. We sent a new confirmation link." };
  }

  redirect("/en");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/en");
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