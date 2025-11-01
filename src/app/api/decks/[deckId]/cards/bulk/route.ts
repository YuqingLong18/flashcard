import { NextRequest } from "next/server";

import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { cleanContent } from "@/lib/sanitize";
import { bulkImportSchema } from "@/lib/validators";

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
    const parsed = bulkImportSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, ownerId: guard.session.user.id },
    });

    if (!deck) {
      return jsonError("Deck not found.", 404);
    }

    const deduped = parsed.data.rows
      .map((row) => ({
        front: cleanContent(row.front),
        back: cleanContent(row.back),
        imageUrl: row.imageUrl ?? null,
      }))
      .filter((row) => row.front && row.back);

    if (deduped.length === 0) {
      return jsonError("No valid rows to import.", 400);
    }

    await prisma.card.createMany({
      data: deduped.map((row) => ({
        deckId,
        front: row.front,
        back: row.back,
        imageUrl: row.imageUrl,
      })),
    });

    return jsonOk({
      imported: deduped.length,
    });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to import cards.", 500);
  }
}
