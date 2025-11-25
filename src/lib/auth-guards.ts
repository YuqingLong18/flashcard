import { jsonError } from "@/lib/api";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/types/roles";

/**
 * Ensures the user from the session exists in the Prisma database.
 * This is necessary because authentication is handled by an external credential database,
 * but we need the user to exist in Prisma for foreign key relationships.
 */
async function ensureUserInPrisma(
  userId: string,
  userRole: UserRole,
  userName?: string | null,
) {
  const email = `${userName || userId}@local`;
  
  try {
    // Try to find user by ID first
    let user = await prisma.user.findUnique({
      where: { id: userId },
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
            id: userId,
            email: email,
            name: userName || undefined,
            role: userRole,
          },
        });
      }
    } else {
      // Update existing user if needed
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          name: userName || user.name,
          email: email,
          role: userRole,
        },
      });
    }

    return user;
  } catch (error) {
    console.error("Failed to ensure user in Prisma:", error);
    // Don't throw - let the calling function handle the error
    return null;
  }
}

export async function requireTeacher() {
  const session = await getCurrentSession();
  if (!session?.user) {
    return {
      error: jsonError("Unauthorized", 401),
    };
  }

  if (!["TEACHER", "ADMIN"].includes(session.user.role)) {
    return {
      error: jsonError("Forbidden", 403),
    };
  }

  // Ensure user exists in Prisma database
  const user = await ensureUserInPrisma(
    session.user.id,
    session.user.role,
    session.user.name || undefined,
  );

  if (!user) {
    return {
      error: jsonError("Failed to sync user account.", 500),
    };
  }

  return { session };
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session?.user) {
    return {
      error: jsonError("Unauthorized", 401),
    };
  }

  // Ensure user exists in Prisma database
  const user = await ensureUserInPrisma(
    session.user.id,
    session.user.role,
    session.user.name || undefined,
  );

  if (!user) {
    return {
      error: jsonError("Failed to sync user account.", 500),
    };
  }

  return { session };
}
