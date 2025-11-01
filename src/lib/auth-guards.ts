import { jsonError } from "@/lib/api";
import { getCurrentSession } from "@/lib/auth";

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

  return { session };
}

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session?.user) {
    return {
      error: jsonError("Unauthorized", 401),
    };
  }
  return { session };
}
