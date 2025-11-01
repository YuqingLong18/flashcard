import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireSessionUser() {
  const session = await getCurrentSession();

  if (!session?.user) {
    return { session: null, userId: null };
  }

  let userId = session.user.id ?? null;

  if (!userId && session.user.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email.toLowerCase() },
      select: { id: true, role: true },
    });

    if (user) {
      userId = user.id;
      session.user.id = user.id;
      session.user.role = user.role;
    }
  }

  return { session, userId };
}
