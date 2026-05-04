'use server';
import {
  auth,
  signIn as nextAuthSignIn,
  signOut as nextAuthSignOut,
} from '@/lib/auth';
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { redirect } from 'next/navigation';

function normalizeOmanPhoneToE164(
  input: string | null | undefined,
): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;
  if (raw.startsWith('+')) return raw;
  const digitsOnly = raw.replace(/\D/g, '');
  if (digitsOnly.length === 8) return `+968${digitsOnly}`;
  if (digitsOnly.startsWith('968') && digitsOnly.length === 11)
    return `+${digitsOnly}`;
  if (digitsOnly.startsWith('00968') && digitsOnly.length === 14)
    return `+${digitsOnly.slice(2)}`;
  return raw;
}

function getSafeLocale(formData: FormData) {
  const rawLocale = (formData.get('locale') as string) || 'en';
  return rawLocale === 'ar' ? 'ar' : 'en';
}

// ─────────────────────────────────────────────────────────────
// SIGN UP
// ─────────────────────────────────────────────────────────────
export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phoneRaw = formData.get('phone') as string | null;
  const phone = normalizeOmanPhoneToE164(phoneRaw);
  const locale = getSafeLocale(formData);

  // Check if email already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { error: 'An account with this email already exists.' };

  const passwordHash = await bcrypt.hash(password, 12);

  // Generate email verification token
  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24 hours

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash,
      role: 'STUDENT',
      isActive: true,
      isVerified: false,
      resetToken: verifyToken,
      resetTokenExpiry: verifyTokenExpiry,
      studentProfile: {
        create: { firstName, lastName },
      },
    },
  });

  // Send verification email via Resend
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify-email?token=${verifyToken}&userId=${user.id}&locale=${locale}`;

  await sendVerificationEmail({ email, firstName, verifyUrl });

  redirect(`/${locale}/verify-email?email=${encodeURIComponent(email)}`);
}

// resend verification
export async function resendVerification(email: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: true }; // don't leak whether email exists

  if (user.isVerified) return { error: 'This account is already verified.' };

  const verifyToken = crypto.randomBytes(32).toString('hex');
  const verifyTokenExpiry = new Date(Date.now() + 1000 * 60 * 60 * 24);

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: verifyToken, resetTokenExpiry: verifyTokenExpiry },
  });

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
  });

  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/verify-email?token=${verifyToken}&userId=${user.id}&locale=en`;

  await sendVerificationEmail({
    email,
    firstName: profile?.firstName ?? 'there',
    verifyUrl,
  });

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// SIGN IN
// ─────────────────────────────────────────────────────────────
export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const redirectTo = formData.get('redirectTo') as string | null;
  const locale = getSafeLocale(formData);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.passwordHash)
    return { error: 'Invalid email or password.' };

  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) return { error: 'Invalid email or password.' };

  if (!user.isVerified) {
    return { error: 'Please verify your email before logging in.' };
  }

  if (!user.isActive) {
    return {
      error: 'Your account has been deactivated. Please contact support.',
    };
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  // Trigger NextAuth sign in
  try {
    await nextAuthSignIn('credentials', {
      email,
      password,
      redirect: false,
    });
  } catch {
    return { error: 'Login failed. Please try again.' };
  }

  const fallback = `/${locale}`;
  const safeRedirect =
    redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : fallback;

  return { redirectTo: safeRedirect };
}

// ─────────────────────────────────────────────────────────────
// SIGN OUT
// ─────────────────────────────────────────────────────────────
export async function signOut(formData: FormData) {
  const locale = getSafeLocale(formData);
  await nextAuthSignOut({ redirect: false });
  redirect(`/${locale}`);
}

// ─────────────────────────────────────────────────────────────
// REQUEST PASSWORD RESET
// ─────────────────────────────────────────────────────────────
export async function requestPasswordReset(formData: FormData) {
  const email = (formData.get('email') as string | null)?.trim() ?? '';
  const locale = getSafeLocale(formData);

  if (!email) return { error: 'Please enter your email.' };

  // Don't leak whether email exists — always return success
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: true };

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

  // Store token in DB — add resetToken + resetTokenExpiry fields to your User model
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken,
      resetTokenExpiry: resetExpiry,
    },
  });

  const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${locale}/update-password?token=${resetToken}`;
  await sendPasswordResetEmail({ email, resetUrl });

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// UPDATE PASSWORD
// ─────────────────────────────────────────────────────────────
export async function updatePassword(formData: FormData) {
  const password = (formData.get('password') as string | null) ?? '';
  const locale = getSafeLocale(formData);

  if (password.length < 8)
    return { error: 'Password must be at least 8 characters.' };

  const session = await auth();
  if (!session?.user) {
    return {
      error: 'Your reset link may have expired. Please request a new one.',
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.update({
    where: { id: session.user.id },
    data: { passwordHash },
  });

  await nextAuthSignOut({ redirect: false });

  return { redirectTo: `/${locale}/login?passwordUpdated=true` };
}

// ─────────────────────────────────────────────────────────────
// GET ADMIN SESSION
// ─────────────────────────────────────────────────────────────
export async function getAdminSession() {
  const session = await auth();
  if (!session?.user) return { user: null, role: null };
  return { user: session.user, role: session.user.role };
}
