import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cleanContent } from "@/lib/sanitize";
import { cardCreateSchema } from "@/lib/validators";

interface RouteContext {
  params: Promise<{
    deckId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { deckId } = await context.params;

  try {
    const body = await request.json();
    const parsed = cardCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, ownerId: guard.session.user.id },
    });
    if (!deck) {
      return jsonError("Deck not found.", 404);
    }

    // Front should be generated client-side if not provided, but handle edge case
    if (!parsed.data.front || parsed.data.front.trim().length === 0) {
      return jsonError("Front is required. It should be generated automatically if not provided.", 400);
    }

    const card = await prisma.card.create({
      data: {
        deckId,
        front: cleanContent(parsed.data.front),
        back: cleanContent(parsed.data.back),
        imageUrl: parsed.data.imageUrl ?? null,
      },
    });

    return jsonOk(card, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to create card.", 500);
  }
}
