import { jsonError } from "@/lib/api";

export async function POST() {
  return jsonError("Self-service registration is disabled.", 403);
}
