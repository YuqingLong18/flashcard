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

  const run = await prisma.deckRun.findUnique({
    where: { id: runId },
    select: {
      status: true,
      expiresAt: true,
      id: true,
    },
  });

  if (!run) {
    return jsonError("Run not found.", 404);
  }

  if (run.status !== "ACTIVE") {
    return jsonError("Run is no longer active.", 400);
  }

  if (run.expiresAt.getTime() < Date.now()) {
    await prisma.deckRun.update({
      where: { id: run.id },
      data: { status: "EXPIRED" },
    });
    return jsonError("Run has expired.", 400);
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: {
      runId: true,
    },
  });

  if (!player || player.runId !== run.id) {
    return jsonError("Player not found in this run.", 404);
  }

  const states = await prisma.playerCardState.findMany({
    where: {
      playerId,
      mastered: false,
    },
    include: {
      card: {
        select: {
          id: true,
          front: true,
          back: true,
          imageUrl: true,
        },
      },
    },
  });

  if (states.length === 0) {
    return jsonOk({ finished: true });
  }

  const totalWeight = states.reduce((sum, state) => sum + state.weight, 0);
  let roll = Math.random() * totalWeight;
  let selected = states[0];

  for (const state of states) {
    roll -= state.weight;
    if (roll <= 0) {
      selected = state;
      break;
    }
  }

  return jsonOk({
    card: {
      id: selected.card.id,
      front: selected.card.front,
      back: selected.card.back,
      imageUrl: selected.card.imageUrl,
    },
    stats: {
      knowCount: selected.knowCount,
      refresherCount: selected.refresherCount,
    },
  });
}
