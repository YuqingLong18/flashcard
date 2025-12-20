import { JoinForm } from "@/components/run/join-form";
import { createTranslator } from "@/lib/i18n";
import { getRequestLanguage } from "@/lib/i18n-server";

export default function JoinPage() {
  const language = getRequestLanguage();
  const t = createTranslator(language);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-16">
      <div className="w-full space-y-4 text-center">
        <p className="text-sm uppercase tracking-wide text-neutral-500">
          {t("join.page.badge")}
        </p>
        <h1 className="text-3xl font-semibold text-neutral-900">
          {t("join.page.title")}
        </h1>
        <p className="text-sm text-neutral-500">{t("join.page.description")}</p>
      </div>
      <div className="w-full rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
        <JoinForm />
      </div>
      <p className="text-xs text-neutral-400">{t("join.page.notice")}</p>
    </main>
  );
}
