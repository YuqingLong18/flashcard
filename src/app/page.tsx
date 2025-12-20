import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRequestLanguage } from "@/lib/i18n-server";
import { createTranslator } from "@/lib/i18n";
import { getCurrentSession } from "@/lib/auth";

export default async function Home() {
  const session = await getCurrentSession();
  const language = getRequestLanguage();
  const t = createTranslator(language);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16 lg:py-24">
      <section className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        <div className="space-y-6">
          <p className="inline-flex rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium uppercase tracking-wide text-neutral-700">
            {t("home.hero.badge")}
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-neutral-900 sm:text-5xl">
            {t("home.hero.heading")}
          </h1>
          <p className="text-lg text-neutral-600">
            {t("home.hero.description")}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="bg-neutral-900 text-white hover:bg-neutral-800"
            >
              <Link href={session?.user ? "/dashboard" : "/login"}>
                {session?.user ? t("home.hero.dashboardCta") : t("home.hero.signInCta")}
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/join">{t("home.hero.joinCta")}</Link>
            </Button>
          </div>
        </div>
        <Card className="border-neutral-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">
              {t("home.snapshot.title")}
            </CardTitle>
            <p className="text-sm text-neutral-500">
              {t("home.snapshot.description")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{t("home.snapshot.cardOne.title")}</span>
                <span className="text-neutral-500">{t("home.snapshot.cardOne.progress")}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-neutral-200">
                <div className="h-2 w-3/5 rounded-full bg-emerald-500" />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span>{t("home.snapshot.cardOne.response")}</span>
                <span>{t("home.snapshot.cardOne.attempts")}</span>
              </div>
            </div>
            <div className="rounded-2xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>{t("home.snapshot.cardTwo.title")}</span>
                <span className="text-neutral-500">{t("home.snapshot.cardTwo.progress")}</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-neutral-200">
                <div className="h-2 w-1/3 rounded-full bg-amber-500" />
              </div>
              <div className="mt-4 flex items-center justify-between text-xs text-neutral-500">
                <span>{t("home.snapshot.cardTwo.weighted")}</span>
                <span>{t("home.snapshot.cardTwo.average")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 rounded-3xl border border-dashed border-neutral-200 bg-white/80 p-8 backdrop-blur">
        <div className="grid gap-2">
          <h2 className="text-2xl font-semibold">{t("home.steps.title")}</h2>
          <p className="text-neutral-600">{t("home.steps.description")}</p>
        </div>
        <div className="grid gap-4 font-mono text-sm text-neutral-700 sm:grid-cols-3">
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {t("home.steps.build.label")}
            </p>
            <p className="mt-2 font-semibold text-neutral-900">
              {t("home.steps.build.description")}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {t("home.steps.share.label")}
            </p>
            <p className="mt-2 font-semibold text-neutral-900">
              {t("home.steps.share.description")}
            </p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              {t("home.steps.coach.label")}
            </p>
            <p className="mt-2 font-semibold text-neutral-900">
              {t("home.steps.coach.description")}
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
