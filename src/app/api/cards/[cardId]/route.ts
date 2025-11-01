import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cleanContent } from "@/lib/sanitize";
import { cardUpdateSchema } from "@/lib/validators";

interface RouteContext {
  params: Promise<{
    cardId: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { cardId } = await context.params;

  try {
    const body = await request.json();
    const parsed = cardUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        deck: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!card || card.deck.ownerId !== guard.session.user.id) {
      return jsonError("Card not found.", 404);
    }

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        front: parsed.data.front
          ? cleanContent(parsed.data.front)
          : undefined,
        back: parsed.data.back ? cleanContent(parsed.data.back) : undefined,
        imageUrl:
          parsed.data.imageUrl !== undefined
            ? parsed.data.imageUrl === null
              ? null
              : parsed.data.imageUrl
            : undefined,
      },
    });

    return jsonOk(updated);
  } catch (error) {
    console.error(error);
    return jsonError("Failed to update card.", 500);
  }
}

export async function DELETE(_: NextRequest, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { cardId } = await context.params;

  try {
    const card = await prisma.card.findUnique({
      where: { id: cardId },
      include: {
        deck: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!card || card.deck.ownerId !== guard.session.user.id) {
      return jsonError("Card not found.", 404);
    }

    await prisma.card.delete({
      where: { id: cardId },
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to delete card.", 500);
  }
}
