import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { generateCardSuggestions } from "@/lib/card-suggestions";
import { prisma } from "@/lib/prisma";
import { cleanContent } from "@/lib/sanitize";
import { cardSuggestionRequestSchema } from "@/lib/validators";

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

  let parsedBody:
    | {
        description: string;
        count: number;
      }
    | null = null;

  try {
    const body = await request.json();
    const parsed = cardSuggestionRequestSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }
    parsedBody = parsed.data;
  } catch (error) {
    console.error(error);
    return jsonError("Invalid payload.", 400);
  }

  try {
    const deck = await prisma.deck.findUnique({
      where: { id: deckId },
      select: {
        ownerId: true,
        title: true,
        description: true,
        language: true,
      },
    });

    if (!deck || deck.ownerId !== guard.session.user.id) {
      return jsonError("Deck not found.", 404);
    }

    const suggestions = await generateCardSuggestions({
      description: parsedBody.description,
      count: parsedBody.count,
      context: {
        title: deck.title,
        description: deck.description,
        language: deck.language,
      },
    });

    const sanitized = suggestions
      .map((suggestion) => {
        const front = cleanContent(suggestion.front).slice(0, 400);
        const back = cleanContent(suggestion.back).slice(0, 400);
        return front && back
          ? {
              front,
              back,
            }
          : null;
      })
      .filter(
        (
          suggestion,
        ): suggestion is {
          front: string;
          back: string;
        } => suggestion !== null,
      );

    if (sanitized.length === 0) {
      return jsonError(
        "The AI response did not produce any usable card suggestions.",
        502,
      );
    }

    const createdCards = await prisma.$transaction(
      sanitized.map((suggestion) =>
        prisma.card.create({
          data: {
            deckId,
            front: suggestion.front,
            back: suggestion.back,
          },
        }),
      ),
    );

    return jsonOk(
      {
        cards: createdCards,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Unable to generate card suggestions.";
    return jsonError(message, 502);
  }
}
