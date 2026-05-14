// lib/auth.ts
import NextAuth from 'next-auth';
import { redirect } from 'next/navigation';
import { authConfig } from './auth.config';

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

/** Throws/redirects if the caller is not authenticated. Returns the session user. */
export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  return session.user;
}
