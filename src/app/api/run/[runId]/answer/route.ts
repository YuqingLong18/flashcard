import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { answerSchema } from "@/lib/validators";
import type { Prisma } from "@prisma/client";

interface RouteContext {
  params: Promise<{
    runId: string;
  }>;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const body = await request.json();
    const parsed = answerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const { runId } = await context.params;
    const { playerId, cardId, label } = parsed.data;

    const run = await prisma.deckRun.findUnique({
      where: { id: runId },
      select: {
        id: true,
        status: true,
        expiresAt: true,
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
      select: { runId: true },
    });

    if (!player || player.runId !== run.id) {
      return jsonError("Player not found in this run.", 404);
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const state = await tx.playerCardState.findUnique({
        where: {
          playerId_cardId: {
            playerId,
            cardId,
          },
        },
      });

      if (!state) {
        throw new Error("STATE_NOT_FOUND");
      }

      let knowCount = state.knowCount;
      let refresherCount = state.refresherCount;
      let weight = state.weight;

      if (label === "KNOW") {
        knowCount += 1;
        weight = Math.max(0.2, weight * 0.5);
      } else {
        refresherCount += 1;
        weight = Math.min(5.0, weight + 0.75);
      }

      const mastered = knowCount >= 3;

      const updated = await tx.playerCardState.update({
        where: {
          playerId_cardId: {
            playerId,
            cardId,
          },
        },
        data: {
          knowCount,
          refresherCount,
          weight,
          mastered,
        },
      });

      await tx.response.create({
        data: {
          playerId,
          cardId,
          label,
        },
      });

      const [masteredCount, total] = await Promise.all([
        tx.playerCardState.count({
          where: {
            playerId,
            mastered: true,
          },
        }),
        tx.playerCardState.count({
          where: {
            playerId,
          },
        }),
      ]);

      return {
        updated,
        masteredCount,
        total,
      };
    });

    const finished = result.masteredCount >= result.total && result.total > 0;

    return jsonOk({
      mastered: result.updated.mastered,
      progress: {
        masteredCount: result.masteredCount,
        total: result.total,
        finished,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "STATE_NOT_FOUND") {
      return jsonError("Card state not found for player.", 404);
    }
    console.error(error);
    return jsonError("Failed to record answer.", 500);
  }
}
