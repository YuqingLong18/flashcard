import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { DeckBuilder } from "@/components/decks/deck-builder";
import { PlayDeckButton } from "@/components/decks/play-deck-button";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireSessionUser } from "@/lib/session";
import { formatDistanceToNow } from "date-fns";

export const dynamic = "force-dynamic";

interface BuildPageProps {
  params: Promise<{
    deckId: string;
  }>;
}

export default async function DeckBuildPage({ params }: BuildPageProps) {
  const { deckId } = await params;
  const { session, userId } = await requireSessionUser();

  if (!session?.user || !userId) {
    redirect("/login");
  }

  if (!deckId) {
    notFound();
  }

  const deck = await prisma.deck.findUnique({
    where: { id: deckId },
    include: {
      cards: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!deck || deck.ownerId !== userId) {
    notFound();
  }

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-neutral-900">
            {deck.title}
          </h1>
          <p className="text-sm text-neutral-500">
            Updated {formatDistanceToNow(deck.updatedAt, { addSuffix: true })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlayDeckButton deckId={deck.id} disabled={!deck.isPublished} />
          <Button asChild variant="outline" size="sm">
            <Link href={`/deck/${deck.id}/analytics`}>Analytics</Link>
          </Button>
        </div>
      </header>
      <DeckBuilder
        deck={{
          id: deck.id,
          title: deck.title,
          description: deck.description,
          language: deck.language,
          isPublished: deck.isPublished,
          createdAt: deck.createdAt.toISOString(),
          updatedAt: deck.updatedAt.toISOString(),
          cards: deck.cards.map((card) => ({
            id: card.id,
            front: card.front,
            back: card.back,
            imageUrl: card.imageUrl,
            createdAt: card.createdAt.toISOString(),
            updatedAt: card.updatedAt.toISOString(),
          })),
        }}
      />
    </section>
  );
}
