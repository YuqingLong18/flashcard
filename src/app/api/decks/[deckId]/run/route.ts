import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { generateRunCode } from "@/lib/run-code";

interface RouteContext {
  params: {
    deckId: string;
  };
}

const ttlMinutes = Number.parseInt(process.env.RUN_CODE_TTL_MINUTES ?? "120", 10);

export async function POST(_: Request, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { deckId } = context.params;

  try {
    const deck = await prisma.deck.findFirst({
      where: {
        id: deckId,
        ownerId: guard.session.user.id,
      },
      include: {
        cards: {
          select: { id: true },
        },
      },
    });

    if (!deck) {
      return jsonError("Deck not found.", 404);
    }

    if (!deck.isPublished) {
      return jsonError("Deck must be published before starting a run.", 400);
    }

    if (deck.cards.length === 0) {
      return jsonError("Deck requires at least one card.", 400);
    }

    const snapshotCardIds = deck.cards.map((card) => card.id);
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

    let code = "";
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = generateRunCode();
      const existing = await prisma.deckRun.findUnique({
        where: { code: candidate },
      });
      if (!existing) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      return jsonError("Unable to generate a unique run code.", 500);
    }

    const run = await prisma.deckRun.create({
      data: {
        deckId,
        code,
        expiresAt,
        snapshotCardIds,
      },
      select: {
        id: true,
        code: true,
        expiresAt: true,
      },
    });

    return jsonOk(run, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to create run.", 500);
  }
}
