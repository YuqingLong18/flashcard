import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/roles";

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

        // Ensure user exists in Prisma database
        // Use the external credential DB ID as the Prisma user ID
        const email = `${userInfo.username}@local`;
        
        // Try to find user by ID first
        let user = await prisma.user.findUnique({
          where: { id: userInfo.id },
        });

        if (!user) {
          // If not found by ID, check if user exists with this email
          const existingByEmail = await prisma.user.findUnique({
            where: { email },
          });

          if (existingByEmail) {
            // User exists with different ID - use existing user
            user = existingByEmail;
          } else {
            // Create new user with the credential DB ID
            user = await prisma.user.create({
              data: {
                id: userInfo.id,
                email: email,
                name: userInfo.username,
                role: "TEACHER" as UserRole,
              },
            });
          }
        } else {
          // Update existing user if needed
          user = await prisma.user.update({
            where: { id: user.id },
            data: {
              name: userInfo.username,
              email: email,
            },
          });
        }

        // Default role to TEACHER for compatibility with existing code
        // You can customize this logic if needed
        return {
          id: user.id,
          username: userInfo.username,
          email: user.email,
          role: user.role,
          name: user.name || userInfo.username,
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
        token.role = (user as { role?: UserRole }).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token?.id) {
        session.user.id = token.id as string;
        if (token.role) {
          session.user.role = token.role as UserRole;
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
