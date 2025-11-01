"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface PlayClientProps {
  runId: string;
  playerId: string;
  deckTitle: string;
}

interface NextCardResponse {
  card: {
    id: string;
    front: string;
    back: string;
    imageUrl?: string | null;
  };
  stats: {
    knowCount: number;
    refresherCount: number;
  };
}

interface ProgressResponse {
  masteredCount: number;
  total: number;
  finished: boolean;
}

export function PlayClient({ runId, playerId, deckTitle }: PlayClientProps) {
  const [card, setCard] = useState<NextCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBack, setShowBack] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);

  const masteredPercent = useMemo(() => {
    if (!progress || progress.total === 0) return 0;
    return Math.round((progress.masteredCount / progress.total) * 100);
  }, [progress]);

  const loadProgress = useCallback(async () => {
    const response = await fetch(
      `/api/run/${runId}/progress?playerId=${playerId}`,
      { cache: "no-store" },
    );
    if (!response.ok) return;
    const payload = await response.json();
    const data = payload.data ?? payload;
    setProgress(data);
    if (data.finished) {
      setFinished(true);
    }
  }, [playerId, runId]);

  const loadNextCard = useCallback(async () => {
    setLoading(true);
    const response = await fetch(
      `/api/run/${runId}/next?playerId=${playerId}`,
      { cache: "no-store" },
    );
    setLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error ?? "Unable to load next card.");
      return;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;

    if (data.finished) {
      setFinished(true);
      setCard(null);
    } else {
      setCard(data as NextCardResponse);
      setShowBack(false);
    }

    await loadProgress();
  }, [playerId, runId, loadProgress]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await Promise.resolve();
      if (!cancelled) {
        await loadNextCard();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadNextCard]);

  const submitAnswer = useCallback(
    async (label: "KNOW" | "REFRESHER") => {
      if (!card) return;
      setIsAnswering(true);
      const response = await fetch(`/api/run/${runId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId,
          cardId: card.card.id,
          label,
        }),
      });
      setIsAnswering(false);

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? "Could not record answer.");
        return;
      }

      const payload = await response.json();
      const data = payload.data ?? payload;
      setFinished(data.progress?.finished ?? false);

      if (data.progress?.finished) {
        setCard(null);
      } else {
        await loadNextCard();
      }

      await loadProgress();
    },
    [card, playerId, runId, loadNextCard, loadProgress],
  );

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        submitAnswer("KNOW");
      } else if (event.key.toLowerCase() === "r") {
        event.preventDefault();
        submitAnswer("REFRESHER");
      } else if (event.key === " ") {
        event.preventDefault();
        setShowBack((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [submitAnswer]);

  if (loading && !card && !finished) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="h-32 w-72 animate-pulse rounded-3xl bg-neutral-200" />
        <p className="text-sm text-neutral-500">Loading your first card…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-10 px-4 py-12">
      <div className="w-full space-y-3 text-center">
        <p className="text-xs uppercase tracking-wide text-neutral-500">
          Playing deck
        </p>
        <h1 className="text-2xl font-semibold text-neutral-900">{deckTitle}</h1>
        {progress && (
          <div className="space-y-2">
            <Progress value={masteredPercent} className="h-2" />
            <p className="text-sm text-neutral-500">
              Mastered {progress.masteredCount} of {progress.total} cards
            </p>
          </div>
        )}
      </div>

      {finished ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-3xl font-semibold text-neutral-900">
            🎉 All cards mastered!
          </p>
          <p className="text-sm text-neutral-500">
            Great job! Let your teacher know you&apos;re ready for the next challenge.
          </p>
        </div>
      ) : card ? (
        <>
          <Card className="w-full max-w-2xl border-none bg-white p-0 shadow-xl">
            <CardContent className="grid gap-6 p-8">
              {card.card.imageUrl && (
                <div className="relative mx-auto h-52 w-full max-w-sm overflow-hidden rounded-2xl bg-neutral-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={card.card.imageUrl}
                    alt={card.card.front}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <div className="space-y-3 text-center">
                <p className="text-xs uppercase tracking-wide text-neutral-500">
                  {showBack ? "Answer" : "Prompt"}
                </p>
                <p className="whitespace-pre-wrap text-2xl font-medium text-neutral-900">
                  {showBack ? card.card.back : card.card.front}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-neutral-400">
                <span>Know: {card.stats.knowCount}</span>
                <span>Refresher: {card.stats.refresherCount}</span>
              </div>
            </CardContent>
          </Card>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setShowBack((prev) => !prev)}
            >
              {showBack ? "Show front" : "Flip card"} (Space)
            </Button>
            <Button
              size="lg"
              variant="secondary"
              onClick={() => submitAnswer("REFRESHER")}
              disabled={isAnswering}
            >
              {isAnswering ? "Saving…" : "I need a refresher…"} (R)
            </Button>
            <Button
              size="lg"
              className="bg-emerald-600 text-white hover:bg-emerald-500"
              onClick={() => submitAnswer("KNOW")}
              disabled={isAnswering}
            >
              {isAnswering ? "Saving…" : "I know!"} (K)
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-4 text-center">
          <p className="text-lg text-neutral-600">
            Waiting for cards… If this message persists, the run may have ended.
          </p>
          <Button onClick={() => loadNextCard()}>Try again</Button>
        </div>
      )}
    </div>
  );
}
