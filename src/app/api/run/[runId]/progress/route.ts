import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: Promise<{
    runId: string;
  }>;
}

export async function GET(request: Request, context: RouteContext) {
  const { searchParams } = new URL(request.url);
  const playerId = searchParams.get("playerId");
  if (!playerId) {
    return jsonError("playerId is required.", 400);
  }

  const { runId } = await context.params;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      runId: true,
    },
  });

  if (!player || player.runId !== runId) {
    return jsonError("Player not found.", 404);
  }

  const [masteredCount, total] = await Promise.all([
    prisma.playerCardState.count({
      where: {
        playerId,
        mastered: true,
      },
    }),
    prisma.playerCardState.count({
      where: {
        playerId,
      },
    }),
  ]);

  const finished = masteredCount >= total && total > 0;

  return jsonOk({
    masteredCount,
    total,
    finished,
  });
}
