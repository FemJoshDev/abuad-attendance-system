import NextAuth from "next-auth";
import type { NextAuthOptions, Session, User } from "next-auth";
import type { JWT } from "next-auth/jwt";
import CredentialsProvider from "next-auth/providers/credentials";
import type { UserRole } from "@prisma/client";

import { prisma } from "@/src/lib/prisma";
import { verifyPassword } from "@/src/lib/password";

function assertProductionAuthConfig() {
  if (process.env.NODE_ENV === "production" && (!process.env.NEXTAUTH_SECRET || process.env.NEXTAUTH_SECRET === "dev-secret-change-me-in-production" || !process.env.NEXTAUTH_URL?.startsWith("https://"))) {
    throw new Error("NEXTAUTH_SECRET and a public HTTPS NEXTAUTH_URL are required in production.");
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt" as const,
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        assertProductionAuthConfig();
        const identifier = credentials?.email?.trim() ?? "";
        const password = credentials?.password ?? "";

        if (!identifier || !password) {
          return null;
        }

        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { email: { equals: identifier, mode: "insensitive" } },
              { matricNumber: { equals: identifier, mode: "insensitive" } },
            ],
          },
        });

        if (!user || !user.isActive || !user.passwordHash) {
          return null;
        }

        if (user.role === "STUDENT" && identifier.toLowerCase() !== user.matricNumber?.toLowerCase()) {
          return null;
        }

        if (user.role === "LECTURER" && (!user.email.toLowerCase().endsWith("@abuad.edu.ng") || !identifier.toLowerCase().endsWith("@abuad.edu.ng"))) {
          return null;
        }

        const isValid = await verifyPassword(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          role: user.role as UserRole,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      const destination = new URL(url, baseUrl);
      const allowedDestinations = new Set([
        "/student/dashboard",
        "/lecturer/dashboard",
        "/admin/dashboard",
      ]);

      if (destination.origin === baseUrl && allowedDestinations.has(destination.pathname)) {
        return destination.toString();
      }

      return baseUrl;
    },
    async jwt({ token, user }: { token: JWT; user?: User }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as UserRole;
      }

      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) ?? "STUDENT";
      }

      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
