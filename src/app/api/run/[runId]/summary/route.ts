import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { getImageUrl } from "@/lib/storage";

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
    return jsonError("Player not found in this run.", 404);
  }

  const cards = await prisma.playerCardState.findMany({
    where: { playerId },
    orderBy: { updatedAt: "asc" },
    select: {
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

  type PlayerCardStateWithCard = {
    card: {
      id: string;
      front: string;
      back: string;
      imageUrl: string | null;
    };
  };

  const formatted = cards.map((state: PlayerCardStateWithCard) => {
    const card = state.card;
    return {
      id: card.id,
      front: card.front,
      back: card.back,
      imageUrl: card.imageUrl ? getImageUrl(card.imageUrl) : null,
    };
  });

  return jsonOk({ cards: formatted });
}
