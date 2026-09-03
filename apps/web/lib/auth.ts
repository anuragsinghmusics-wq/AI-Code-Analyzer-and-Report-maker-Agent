// apps/web/lib/auth.ts — NextAuth configuration
// GitHub OAuth only. Organizers log in; students do not log in at all.
import type { NextAuthOptions } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import { upsertUserFromGithub } from '@code-analyzer/db';

export const authOptions: NextAuthOptions = {
  providers: [
    GithubProvider({
      clientId: process.env['GITHUB_CLIENT_ID'] ?? '',
      clientSecret: process.env['GITHUB_CLIENT_SECRET'] ?? '',
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'github') return false;
      if (!user.email) return false;
      try {
        await upsertUserFromGithub({
          email: user.email,
          name: user.name ?? undefined,
          githubId: account.providerAccountId,
        });
        return true;
      } catch {
        return false;
      }
    },

    async jwt({ token, account, profile }) {
      if (account?.provider === 'github' && profile) {
        const ghProfile = profile as { login?: string; id?: number };
        token['githubId'] = account.providerAccountId;
        token['githubLogin'] = ghProfile.login ?? '';
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as Record<string, unknown>)['githubId'] = token['githubId'];
        (session.user as Record<string, unknown>)['githubLogin'] = token['githubLogin'];
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  secret: process.env['NEXTAUTH_SECRET'],
};
