import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { generateImage } from "@/lib/image-gen";
import { prisma } from "@/lib/prisma";
import { buildImagePrompt } from "@/lib/prompts";

interface RouteContext {
  params: Promise<{
    cardId: string;
  }>;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const { cardId } = await context.params;

  let modelId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.modelId === "string" && body.modelId.trim().length > 0) {
      modelId = body.modelId.trim();
    }
  } catch {
    // no-op: body is optional
  }

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

    if (card.imageUrl) {
      return jsonOk({
        skipped: true,
        reason: "Card already has an image.",
        cardId,
      });
    }

    const prompt = buildImagePrompt(card.front, card.back);
    const imageUrl = await generateImage({
      prompt,
      modelId,
    });

    const updateResult = await prisma.card.updateMany({
      where: {
        id: cardId,
        imageUrl: null,
      },
      data: {
        imageUrl,
      },
    });

    if (updateResult.count === 0) {
      return jsonOk({
        skipped: true,
        reason: "Card gained an image before the AI result was saved.",
        cardId,
      });
    }

    return jsonOk({
      skipped: false,
      cardId,
      imageUrl,
    });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to generate an image for this card.";
    return jsonError(message, 502);
  }
}
