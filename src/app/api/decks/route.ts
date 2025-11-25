import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cleanContent } from "@/lib/sanitize";
import { deckCreateSchema } from "@/lib/validators";

export async function GET() {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  const decks = await prisma.deck.findMany({
    where: { ownerId: guard.session.user.id },
    include: {
      _count: {
        select: { cards: true },
      },
    },
    orderBy: [{ updatedAt: "desc" }],
  });

  type DeckWithCount = {
    id: string;
    title: string;
    description: string | null;
    language: string | null;
    isPublished: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      cards: number;
    };
  };

  return jsonOk(
    (decks as DeckWithCount[]).map((deck) => ({
      id: deck.id,
      title: deck.title,
      description: deck.description,
      language: deck.language,
      isPublished: deck.isPublished,
      createdAt: deck.createdAt,
      updatedAt: deck.updatedAt,
      cardCount: deck._count.cards,
    })),
  );
}

export async function POST(request: NextRequest) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  try {
    const body = await request.json();
    const parsed = deckCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const existing = await prisma.deck.findFirst({
      where: {
        ownerId: guard.session.user.id,
        title: cleanContent(parsed.data.title),
      },
    });

    if (existing) {
      return jsonError("You already have a deck with that title.", 409);
    }

    const deck = await prisma.deck.create({
      data: {
        ownerId: guard.session.user.id,
        title: cleanContent(parsed.data.title),
        description: parsed.data.description
          ? cleanContent(parsed.data.description)
          : undefined,
        language: parsed.data.language
          ? cleanContent(parsed.data.language)
          : undefined,
      },
    });

    return jsonOk(deck, { status: 201 });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to create deck.", 500);
  }
}
