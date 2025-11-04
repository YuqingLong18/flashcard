import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentSession } from "@/lib/auth";

export default async function Home() {
  const session = await getCurrentSession();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16 lg:py-24">
      <section className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700">
            Adaptive Flashcards for Modern Classrooms
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            Build decks. Launch live sessions. Coach every student.
          </h1>
          <p className="text-lg text-neutral-600">
            Flashrooms lets teachers create rich flashcard decks, generate
            optional visuals, and run adaptive practice loops that respond to
            every student&apos;s mastery in real time.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <Link href={session?.user ? "/dashboard" : "/login"}>
                {session?.user ? "Go to dashboard" : "Sign in to manage decks"}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/join">Join a session</Link>
            </Button>
          </div>
        </div>
        <Card className="border-neutral-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              Live session snapshot
            </CardTitle>
            <p className="text-sm text-neutral-500">
              Students lean on instant feedback while teachers track mastery.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Photosynthesis</span>
                <span className="text-neutral-500">Mastered: 60%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-neutral-200">
                <div className="h-2 w-3/5 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span>Last response: I need a refresher…</span>
                <span>2 attempts to mastery</span>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Chlorophyll role</span>
                <span className="text-neutral-500">Mastered: 35%</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-neutral-200">
                <div className="h-2 w-1/3 rounded-full bg-amber-500" />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span>Weighted for review 🌱</span>
                <span>Avg 1.8 refresher clicks</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 rounded-3xl border border-dashed border-neutral-200 bg-white/80 p-8 backdrop-blur">
        <div className="grid gap-2">
          <h2 className="text-2xl font-semibold">Run a session in minutes</h2>
          <p className="text-neutral-600">
            Create decks, import terms from CSV, generate visuals, and launch
            adaptive runs with a single code.
          </p>
        </div>
        <div className="grid gap-4 font-mono text-sm text-neutral-700 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              1. Build
            </p>
            <p className="mt-2 font-semibold text-neutral-900">
              Inline card editor with AI image assist.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              2. Share
            </p>
            <p className="mt-2 font-semibold text-neutral-900">
              Publish &amp; generate a 6-char session code.
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              3. Coach
            </p>
            <p className="mt-2 font-semibold text-neutral-900">
              Students loop through cards until mastery unlocks.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
