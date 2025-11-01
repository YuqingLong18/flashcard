import Link from "next/link";

import { PlayClient } from "@/components/run/play-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";

interface PlayPageProps {
  params: Promise<{
    runId: string;
  }>;
  searchParams: Promise<{
    playerId?: string;
  }>;
}

export default async function PlayPage({ params, searchParams }: PlayPageProps) {
  const [{ runId }, { playerId }] = await Promise.all([params, searchParams]);

  if (!playerId) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="max-w-md border-neutral-200 text-center">
          <CardHeader>
            <CardTitle className="text-xl">Missing player</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-500">
            <p>
              We couldn&apos;t find your session. Return to the join page and enter the
              code again.
            </p>
            <Link href="/join" className="text-neutral-900 underline">
              Back to join
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const run = await prisma.deckRun.findUnique({
    where: { id: runId },
    select: {
      id: true,
      status: true,
      deck: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!run) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="max-w-md border-neutral-200 text-center">
          <CardHeader>
            <CardTitle className="text-xl">Run not found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-500">
            <p>This session may have ended or expired.</p>
            <Link href="/join" className="text-neutral-900 underline">
              Back to join
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    select: { runId: true },
  });

  if (!player || player.runId !== run.id) {
    return (
      <main className="flex flex-1 items-center justify-center px-6 py-16">
        <Card className="max-w-md border-neutral-200 text-center">
          <CardHeader>
            <CardTitle className="text-xl">You left the run</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-neutral-500">
            <p>Ask your teacher for a fresh code to rejoin.</p>
            <Link href="/join" className="text-neutral-900 underline">
              Back to join
            </Link>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="flex flex-1 flex-col">
      <PlayClient runId={run.id} playerId={playerId} deckTitle={run.deck.title} />
    </main>
  );
}
