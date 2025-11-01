import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcrypt";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Adapter } from "next-auth/adapters";
import type { Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Email and Password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.password) {
          return null;
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.name,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as { id: string }).id;
        token.role = (user as { role?: Role }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        if (token.role) {
          session.user.role = token.role as Role;
        }
      }

      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "local-dev-secret-change-me",
};

export function getCurrentSession() {
  return getServerSession(authOptions);
}
