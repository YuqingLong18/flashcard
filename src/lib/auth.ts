import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { Role } from "@prisma/client";

const CREDENTIAL_DB_URL = process.env.CREDENTIAL_DB_URL || "http://localhost:3000";

async function verifyCredentials(username: string, password: string) {
  try {
    const response = await fetch(`${CREDENTIAL_DB_URL}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    if (data.success && data.user) {
      return {
        id: String(data.user.id),
        username: data.user.username,
      };
    }

    return null;
  } catch (error) {
    console.error("Error verifying credentials:", error);
    return null;
  }
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },
  providers: [
    Credentials({
      name: "Username and Password",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        const username = credentials.username.trim();
        const userInfo = await verifyCredentials(username, credentials.password);

        if (!userInfo) {
          return null;
        }

        // Default role to TEACHER for compatibility with existing code
        // You can customize this logic if needed
        return {
          id: userInfo.id,
          username: userInfo.username,
          email: `${userInfo.username}@local`, // Placeholder email for compatibility
          role: "TEACHER" as Role,
          name: userInfo.username,
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
