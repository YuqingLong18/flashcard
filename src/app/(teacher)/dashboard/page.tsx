import Link from "next/link";
import { CreateDeckDialog } from "@/components/decks/create-deck-dialog";
import { PlayDeckButton } from "@/components/decks/play-deck-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { requireSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatDistanceToNow } from "date-fns";

type DeckWithCardCount = {
  id: string;
  title: string;
  description: string | null;
  language: string | null;
  isPublished: boolean;
  updatedAt: Date;
  _count: {
    cards: number;
  };
};

export default async function DashboardPage() {
  const { session, userId } = await requireSessionUser();
  if (!session?.user || !userId) {
    return null;
  }

  const decks: DeckWithCardCount[] = await prisma.deck.findMany({
    where: { ownerId: userId },
    orderBy: [{ updatedAt: "desc" }],
    include: {
      _count: {
        select: { cards: true },
      },
    },
  });

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-neutral-900">
            Your decks
          </h1>
          <p className="text-sm text-neutral-500">
            Build content-rich decks, publish when ready, and launch live runs in
            seconds.
          </p>
        </div>
        <CreateDeckDialog />
      </header>

      {decks.length === 0 ? (
        <Card className="border-dashed border-neutral-200 bg-white/70 text-center">
          <CardHeader>
            <CardTitle className="text-xl">No decks yet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-neutral-500">
            <p>Start by creating a deck. You can add cards individually or import from CSV.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {decks.map((deck) => (
            <Card key={deck.id} className="flex flex-col border-neutral-200">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg font-semibold text-neutral-900">
                      {deck.title}
                    </CardTitle>
                    {deck.language && (
                      <p className="text-xs uppercase tracking-wide text-neutral-500">
                        {deck.language}
                      </p>
                    )}
                  </div>
                  <Badge variant={deck.isPublished ? "default" : "secondary"}>
                    {deck.isPublished ? "Published" : "Draft"}
                  </Badge>
                </div>
                {deck.description && (
                  <p className="text-sm text-neutral-600">{deck.description}</p>
                )}
              </CardHeader>
              <CardContent className="flex-1 space-y-3 text-sm text-neutral-500">
                <div className="flex items-center justify-between">
                  <span>Cards</span>
                  <span className="font-medium text-neutral-900">
                    {deck._count.cards}
                  </span>
                </div>
                <p className="text-xs text-neutral-500">
                  Updated {formatDistanceToNow(deck.updatedAt, { addSuffix: true })}
                </p>
              </CardContent>
              <CardFooter className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex gap-2">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/deck/${deck.id}/build`}>Build</Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/deck/${deck.id}/analytics`}>Analytics</Link>
                  </Button>
                </div>
                <PlayDeckButton deckId={deck.id} disabled={!deck.isPublished} />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}
