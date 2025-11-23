"use client";

import Link from "next/link";
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

interface SummaryCard {
  id: string;
  front: string;
  back: string;
  imageUrl: string | null;
}

export function PlayClient({ runId, playerId, deckTitle }: PlayClientProps) {
  const [card, setCard] = useState<NextCardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBack, setShowBack] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [finished, setFinished] = useState(false);
  const [progress, setProgress] = useState<ProgressResponse | null>(null);
  const [summaryCards, setSummaryCards] = useState<SummaryCard[] | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const response = await fetch(
        `/api/run/${runId}/summary?playerId=${playerId}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error(payload?.error ?? "Unable to load summary.");
        setSummaryCards([]);
        return;
      }
      const payload = await response.json();
      const data = payload.data ?? payload;
      if (Array.isArray(data.cards)) {
        setSummaryCards(data.cards as SummaryCard[]);
      } else {
        setSummaryCards([]);
      }
    } catch (error) {
      console.error(error);
      toast.error("Unable to load summary.");
      setSummaryCards([]);
    } finally {
      setSummaryLoading(false);
    }
  }, [playerId, runId]);

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

  useEffect(() => {
    if (finished && summaryCards === null && !summaryLoading) {
      void loadSummary();
    }
  }, [finished, loadSummary, summaryCards, summaryLoading]);

  if (loading && !card && !finished) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <div className="h-32 w-72 animate-pulse rounded-3xl bg-[#efe4ff]" />
        <p className="text-sm text-[#6c5aa8]">Loading your first card…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center gap-10 rounded-3xl border border-[#ddccff] bg-gradient-to-br from-[#faf7ff] via-[#f4edff] to-[#efe4ff] px-6 py-12 shadow-[0_20px_60px_-38px_rgba(120,80,185,0.6)]">
      <div className="w-full space-y-3 text-center">
        <p className="text-xs uppercase tracking-wide text-[#7a68b6]">
          Playing deck
        </p>
        <h1 className="text-2xl font-semibold text-[#362773]">{deckTitle}</h1>
        {progress && (
          <div className="space-y-2">
            <Progress value={masteredPercent} />
            <p className="text-sm text-[#6c5aa8]">
              Mastered {progress.masteredCount} of {progress.total} cards
            </p>
          </div>
        )}
      </div>

      {finished ? (
        <div className="flex w-full flex-col gap-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <p className="text-3xl font-semibold text-[#362773]">
              🎉 All cards mastered!
            </p>
            <p className="text-sm text-[#6c5aa8]">
              Great job! Review what you just practiced below.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button asChild variant="outline">
                <Link href="/join">Join another session</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-[#ddccff] bg-white/70 p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-[#e9e0ff] pb-3">
              <div>
                <p className="text-sm font-semibold text-[#3b2a7b]">Your cards</p>
                <p className="text-xs text-[#7a68b6]">
                  Front, back, and any visuals you saw during practice.
                </p>
              </div>
              {summaryLoading && (
                <span className="text-xs text-[#7a68b6]">Loading…</span>
              )}
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {(summaryCards ?? []).map((summary) => (
                <div
                  key={summary.id}
                  className="flex flex-col gap-3 rounded-xl border border-[#e7defd] bg-gradient-to-br from-[#faf7ff] to-[#f2ebff] p-4 shadow-[0_8px_20px_-14px_rgba(120,80,185,0.45)]"
                >
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-[#7a68b6]">
                      Front
                    </p>
                    <p className="whitespace-pre-wrap text-sm font-semibold text-[#2f1d59]">
                      {summary.front}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-[#7a68b6]">
                      Back
                    </p>
                    <p className="whitespace-pre-wrap text-sm text-[#5a46a5]">
                      {summary.back}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-[#7a68b6]">
                      Image
                    </p>
                    {summary.imageUrl ? (
                      <button
                        type="button"
                        onClick={() => setSelectedImage(summary.imageUrl)}
                        className="group relative overflow-hidden rounded-lg border border-[#ddccff] bg-white p-2 transition hover:-translate-y-0.5 hover:shadow-md"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={summary.imageUrl}
                          alt={summary.front}
                          className="h-32 w-full object-contain"
                        />
                        <span className="absolute inset-0 bg-black/10 opacity-0 transition group-hover:opacity-100" />
                      </button>
                    ) : (
                      <p className="text-xs text-[#8f7cc8]">No image attached.</p>
                    )}
                  </div>
                </div>
              ))}
              {!summaryLoading && (summaryCards ?? []).length === 0 && (
                <div className="rounded-xl border border-dashed border-[#ddccff] bg-[#f7f2ff] p-6 text-center text-sm text-[#7a68b6]">
                  No cards to show. Try refreshing the page if this seems wrong.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : card ? (
        <>
          <Card className="w-full max-w-2xl p-0 shadow-xl">
            <CardContent className="grid gap-6 p-8">
              {card.card.imageUrl && (
                <div className="mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-2xl bg-[#f3ecff]">
                  <div className="flex h-full w-full items-center justify-center p-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.card.imageUrl}
                      alt={card.card.front}
                      className="h-full w-full object-contain"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-3 text-center">
                <p className="text-xs uppercase tracking-wide text-[#7a68b6]">
                  {showBack ? "Answer" : "Prompt"}
                </p>
                <p className="whitespace-pre-wrap text-2xl font-medium text-[#2f1d59]">
                  {showBack ? card.card.back : card.card.front}
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 text-xs text-[#7a68b6]">
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
          <p className="text-lg text-[#6c5aa8]">
            Waiting for cards… If this message persists, the run may have ended.
          </p>
          <Button onClick={() => loadNextCard()}>Try again</Button>
        </div>
      )}

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selectedImage}
              alt="Card image full view"
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
