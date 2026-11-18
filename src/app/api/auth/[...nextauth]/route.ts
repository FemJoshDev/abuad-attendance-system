// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { verifyPassword } from '@/lib/auth';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please enter both email and password.');
        }

        try {
          const user = await db.user.findUnique({
            where: { email: credentials.email.trim().toLowerCase() },
          });

          if (!user || !user.passwordHash) {
            throw new Error('Invalid email or password.');
          }

          const isValidPassword = await verifyPassword(
            credentials.password,
            user.passwordHash
          );

          if (!isValidPassword) {
            throw new Error('Invalid email or password.');
          }

          // Return user details including their database role (STUDENT, LECTURER, or ADMIN)
          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
          };
        } catch (error: any) {
          console.error('AUTH_AUTHORIZE_ERROR:', error.message);

          if (
            error.message.includes("Can't reach database") ||
            error.message.includes('Authentication failed') ||
            error.message.includes('Timed out') ||
            error.message.includes('invocation')
          ) {
            throw new Error('Unable to connect to the authentication server. Please try again later.');
          }

          throw new Error(error.message || 'An unexpected error occurred.');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role;
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.id;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'abuad_secure_attendance_secret_key_2026_xyz',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };