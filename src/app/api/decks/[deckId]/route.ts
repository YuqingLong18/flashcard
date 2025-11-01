import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cleanContent } from "@/lib/sanitize";
import { deckUpdateSchema } from "@/lib/validators";

interface RouteContext {
  params: Promise<{
    deckId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { deckId } = await context.params;

  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      ownerId: guard.session.user.id,
    },
    include: {
      cards: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!deck) {
    return jsonError("Deck not found.", 404);
  }

  return jsonOk(deck);
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { deckId } = await context.params;

  try {
    const body = await request.json();
    const parsed = deckUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const existing = await prisma.deck.findFirst({
      where: {
        id: deckId,
        ownerId: guard.session.user.id,
      },
    });

    if (!existing) {
      return jsonError("Deck not found.", 404);
    }

    const deck = await prisma.deck.update({
      where: { id: deckId },
      data: {
        title: parsed.data.title
          ? cleanContent(parsed.data.title)
          : undefined,
        description: parsed.data.description
          ? cleanContent(parsed.data.description)
          : undefined,
        language: parsed.data.language
          ? cleanContent(parsed.data.language)
          : undefined,
      },
    });

    return jsonOk(deck);
  } catch (error) {
    console.error(error);
    if (error instanceof Error && error.message.includes("Record to update")) {
      return jsonError("Deck not found.", 404);
    }
    return jsonError("Failed to update deck.", 500);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { deckId } = await context.params;

  try {
    const existing = await prisma.deck.findFirst({
      where: {
        id: deckId,
        ownerId: guard.session.user.id,
      },
    });

    if (!existing) {
      return jsonError("Deck not found.", 404);
    }

    await prisma.deck.delete({
      where: { id: deckId },
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to delete deck.", 500);
  }
}
