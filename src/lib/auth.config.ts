// lib/auth.config.ts
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import type { NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';

export const authConfig: NextAuthConfig = {
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true;
      if (!user.email) return false;

      let dbUser = await prisma.user.findUnique({ where: { email: user.email } });

      if (dbUser) {
        // Link the Google account if not already linked
        const linked = await prisma.account.findUnique({
          where: {
            provider_providerAccountId: {
              provider: 'google',
              providerAccountId: account.providerAccountId,
            },
          },
        });
        if (!linked) {
          await prisma.account.create({
            data: {
              userId: dbUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              refresh_token: account.refresh_token ?? null,
              access_token: account.access_token ?? null,
              expires_at: account.expires_at ?? null,
              token_type: account.token_type ?? null,
              scope: account.scope ?? null,
              id_token: account.id_token ?? null,
              session_state: (account.session_state as string) ?? null,
            },
          });
        }
        if (!dbUser.image && user.image) {
          await prisma.user.update({ where: { id: dbUser.id }, data: { image: user.image } });
        }
      } else {
        // First time Google sign-in — create user + student profile
        const [firstName = 'User', ...rest] = (user.name ?? '').split(' ');
        const lastName = rest.join(' ');

        dbUser = await prisma.user.create({
          data: {
            email: user.email,
            passwordHash: null as unknown as string, // nullable after schema migration
            role: 'STUDENT',
            isActive: true,
            isVerified: true,
            emailVerified: new Date(),
            image: user.image ?? null,
            studentProfile: { create: { firstName, lastName } },
            accounts: {
              create: {
                type: account.type,
                provider: account.provider,
                providerAccountId: account.providerAccountId,
                refresh_token: account.refresh_token ?? null,
                access_token: account.access_token ?? null,
                expires_at: account.expires_at ?? null,
                token_type: account.token_type ?? null,
                scope: account.scope ?? null,
                id_token: account.id_token ?? null,
                session_state: (account.session_state as string) ?? null,
              },
            },
          },
        });
      }

      // Inject our DB fields so the jwt callback can read them
      const u = user as unknown as { id: string; role: string; isVerified: boolean };
      u.id = dbUser.id;
      u.role = dbUser.role;
      u.isVerified = dbUser.isVerified;
      return true;
    },

    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id?: string; role?: string; isVerified?: boolean };
        token.id = u.id!;
        token.role = u.role ?? 'STUDENT';
        token.isVerified = u.isVerified ?? true;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.isVerified = token.isVerified as boolean;
      return session;
    },
  },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
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
