import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: {
    runId: string;
  };
}

export async function POST(_: Request, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { runId } = context.params;

  try {
    const run = await prisma.deckRun.findFirst({
      where: {
        id: runId,
        deck: {
          ownerId: guard.session.user.id,
        },
      },
    });

    if (!run) {
      return jsonError("Run not found.", 404);
    }

    const updated = await prisma.deckRun.update({
      where: { id: runId },
      data: {
        status: "ENDED",
      },
    });

    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to end run.", 500);
  }
}
