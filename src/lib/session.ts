import { getCurrentSession } from "@/lib/auth";

export async function requireSessionUser() {
  const session = await getCurrentSession();

  if (!session?.user) {
    return { session: null, userId: null };
  }

  // User ID is already set in the JWT token from credential database
  const userId = session.user.id ?? null;

  return { session, userId };
}
