import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { publishSchema } from "@/lib/validators";

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
    const parsed = publishSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, ownerId: guard.session.user.id },
    });

    if (!deck) {
      return jsonError("Deck not found.", 404);
    }

    const updated = await prisma.deck.update({
      where: { id: deckId },
      data: {
        isPublished: parsed.data.isPublished,
      },
    });

    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to update publish state.", 500);
  }
}
