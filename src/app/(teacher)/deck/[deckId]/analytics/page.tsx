import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { prisma } from "@/lib/prisma";

interface AnalyticsPageProps {
  params: {
    deckId: string;
  };
}

export default async function DeckAnalyticsPage({ params }: AnalyticsPageProps) {
  const deck = await prisma.deck.findUnique({
    where: { id: params.deckId },
    include: {
      cards: {
        orderBy: [{ createdAt: "asc" }],
      },
    },
  });

  if (!deck) {
    notFound();
  }

  const states = await prisma.playerCardState.findMany({
    where: {
      card: {
        deckId: deck.id,
      },
    },
    select: {
      cardId: true,
      playerId: true,
      knowCount: true,
      refresherCount: true,
      mastered: true,
    },
  });

  const playerIds = new Set(states.map((state) => state.playerId));
  const totalsByCard = new Map<string, {
    totalKnow: number;
    totalRefresher: number;
    masteredPlayers: number;
    totalPlayers: number;
    masteredKnowSum: number;
  }>();

  for (const state of states) {
    const bucket = totalsByCard.get(state.cardId) ?? {
      totalKnow: 0,
      totalRefresher: 0,
      masteredPlayers: 0,
      totalPlayers: 0,
      masteredKnowSum: 0,
    };
    bucket.totalKnow += state.knowCount;
    bucket.totalRefresher += state.refresherCount;
    bucket.totalPlayers += 1;
    if (state.mastered) {
      bucket.masteredPlayers += 1;
      bucket.masteredKnowSum += state.knowCount;
    }
    totalsByCard.set(state.cardId, bucket);
  }

  const responseTotal = states.reduce(
    (sum, state) => sum + state.knowCount + state.refresherCount,
    0,
  );

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold text-neutral-900">{deck.title}</h1>
          <p className="text-sm text-neutral-500">Session analytics</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href={`/deck/${deck.id}/build`}>Back to builder</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-neutral-500">
              Students participated
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-neutral-900">
            {playerIds.size}
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-neutral-500">
              Total responses
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-neutral-900">
            {responseTotal}
          </CardContent>
        </Card>
        <Card className="border-neutral-200">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-wide text-neutral-500">
              Cards
            </CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-semibold text-neutral-900">
            {deck.cards.length}
          </CardContent>
        </Card>
      </div>

      <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/3">Card</TableHead>
              <TableHead className="w-1/6 text-center">Mastered</TableHead>
              <TableHead className="w-1/6 text-center">Avg knows</TableHead>
              <TableHead className="w-1/6 text-center">Refresher clicks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {deck.cards.map((card) => {
              const totals = totalsByCard.get(card.id);
              const masteredRate = totals?.totalPlayers
                ? Math.round((totals.masteredPlayers / totals.totalPlayers) * 100)
                : 0;
              const avgKnow = totals?.masteredPlayers
                ? (totals.masteredKnowSum / totals.masteredPlayers).toFixed(2)
                : "-";
              const refresherAvg = totals?.totalPlayers
                ? (totals.totalRefresher / totals.totalPlayers).toFixed(2)
                : "-";

              return (
                <TableRow key={card.id} className="align-top">
                  <TableCell>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-neutral-900">
                        {card.front}
                      </p>
                      <p className="text-xs text-neutral-500">{card.back}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={masteredRate >= 70 ? "default" : "secondary"}>
                      {masteredRate}%
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center text-sm text-neutral-700">
                    {avgKnow}
                  </TableCell>
                  <TableCell className="text-center text-sm text-neutral-700">
                    {refresherAvg}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}
