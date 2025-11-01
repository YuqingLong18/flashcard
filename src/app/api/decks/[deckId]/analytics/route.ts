import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";

interface RouteContext {
  params: {
    deckId: string;
  };
}

export async function GET(_: Request, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { deckId } = context.params;

  const deck = await prisma.deck.findFirst({
    where: { id: deckId, ownerId: guard.session.user.id },
    select: { id: true },
  });

  if (!deck) {
    return jsonError("Deck not found.", 404);
  }

  const [cards, states] = await Promise.all([
    prisma.card.findMany({
      where: { deckId },
      select: {
        id: true,
        front: true,
        back: true,
        imageUrl: true,
      },
      orderBy: [{ createdAt: "asc" }],
    }),
    prisma.playerCardState.findMany({
      where: {
        card: {
          deckId,
        },
      },
      select: {
        cardId: true,
        playerId: true,
        knowCount: true,
        refresherCount: true,
        mastered: true,
      },
    }),
  ]);

  const aggregates = new Map<
    string,
    {
      totalKnow: number;
      totalRefresher: number;
      masteredPlayers: number;
      totalPlayers: number;
      masteredKnowSum: number;
    }
  >();

  for (const state of states) {
    const bucket =
      aggregates.get(state.cardId) ??
      {
        totalKnow: 0,
        totalRefresher: 0,
        masteredPlayers: 0,
        totalPlayers: 0,
        masteredKnowSum: 0,
      };
    bucket.totalKnow += state.knowCount;
    bucket.totalRefresher += state.refresherCount;
    bucket.totalPlayers += 1;
    if (state.mastered) {
      bucket.masteredPlayers += 1;
      bucket.masteredKnowSum += state.knowCount;
    }
    aggregates.set(state.cardId, bucket);
  }

  const results = cards.map((card) => {
    const bucket = aggregates.get(card.id);
    if (!bucket) {
      return {
        card,
        metrics: {
          totalKnow: 0,
          totalRefresher: 0,
          masteredPlayers: 0,
          totalPlayers: 0,
          averageKnowToMastery: null as number | null,
        },
      };
    }

    return {
      card,
      metrics: {
        totalKnow: bucket.totalKnow,
        totalRefresher: bucket.totalRefresher,
        masteredPlayers: bucket.masteredPlayers,
        totalPlayers: bucket.totalPlayers,
        averageKnowToMastery:
          bucket.masteredPlayers > 0
            ? Number(
                (bucket.masteredKnowSum / bucket.masteredPlayers).toFixed(2),
              )
            : null,
      },
    };
  });

  const playerIds = new Set<string>();
  for (const state of states) {
    playerIds.add(state.playerId);
  }

  const responseTotal = states.reduce(
    (sum, state) => sum + state.knowCount + state.refresherCount,
    0,
  );

  return jsonOk({
    cards: results,
    totals: {
      players: playerIds.size,
      responses: responseTotal,
    },
  });
}
