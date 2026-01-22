import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || ''
    })
    // TODO: Add Line provider
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;

      try {
        // 更新或建立管理員記錄
        await prisma.adminUser.upsert({
          where: {
            provider_providerId: {
              provider: account.provider,
              providerId: account.providerAccountId
            }
          },
          update: {
            lastLoginAt: new Date()
          },
          create: {
            email: user.email!,
            name: user.name || 'Admin',
            provider: account.provider,
            providerId: account.providerAccountId,
            role: 'admin'
          }
        });

        return true;
      } catch (error) {
        console.error('Sign in error:', error);
        return false;
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        (session.user as any).id = token.sub;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login'
  }
});

export { handler as GET, handler as POST };
