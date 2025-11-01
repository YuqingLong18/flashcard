import { jsonError, jsonOk } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { cleanContent } from "@/lib/sanitize";
import { runJoinSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = runJoinSchema.safeParse(body);

    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const code = parsed.data.code.toUpperCase();
    const run = await prisma.deckRun.findUnique({
      where: { code },
      include: {
        deck: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!run) {
      return jsonError("Invalid or expired code.", 404);
    }

    if (run.status !== "ACTIVE") {
      return jsonError("Run is no longer active.", 400);
    }

    if (run.expiresAt.getTime() < Date.now()) {
      await prisma.deckRun.update({
        where: { id: run.id },
        data: { status: "EXPIRED" },
      });
      return jsonError("This run has expired.", 400);
    }

    const nickname = parsed.data.nickname
      ? cleanContent(parsed.data.nickname)
      : undefined;

    const player = await prisma.$transaction(async (tx) => {
      const createdPlayer = await tx.player.create({
        data: {
          runId: run.id,
          nickname,
        },
        select: {
          id: true,
          runId: true,
        },
      });

      if (run.snapshotCardIds.length > 0) {
        await tx.playerCardState.createMany({
          data: run.snapshotCardIds.map((cardId) => ({
            playerId: createdPlayer.id,
            cardId,
          })),
          skipDuplicates: true,
        });
      }

      return createdPlayer;
    });

    return jsonOk({
      runId: player.runId,
      playerId: player.id,
      deck: {
        title: run.deck.title,
      },
    });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to join run.", 500);
  }
}
