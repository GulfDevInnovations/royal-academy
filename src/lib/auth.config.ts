// lib/auth.config.ts
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!; // ← add ! to assert non-null
        token.role = user.role;
        token.isVerified = user.isVerified;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.isVerified = token.isVerified as boolean;
      // session.user.name is already handled by NextAuth by default
      return session;
    },
  },
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          include: {
            studentProfile: true,
            teacherProfile: true,
            adminProfile: true,
          },
        });

        if (!user || !user.passwordHash) return null;

        const passwordMatch = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );

        if (!passwordMatch) return null;

        // Pick name from whichever profile exists
        const profile =
          user.adminProfile ?? user.teacherProfile ?? user.studentProfile;
        const name = profile
          ? `${profile.firstName} ${profile.lastName}`
          : user.email.split('@')[0];

        return {
          id: user.id,
          email: user.email,
          name,
          role: user.role,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
};
