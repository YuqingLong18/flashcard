"use client";

import { cn } from "@/lib/utils";
import { useLanguage, useTranslations } from "@/components/providers/language-provider";

export function LanguageToggle() {
  const { language, setLanguage, isChanging } = useLanguage();
  const t = useTranslations();

  return (
    <div
      className="fixed right-4 top-4 z-50 flex items-center gap-2 rounded-full border border-neutral-200 bg-white/90 px-4 py-2 text-xs font-medium text-neutral-600 shadow-lg backdrop-blur"
      aria-label={t("language.ariaLabel")}
    >
      <span className="hidden text-[10px] uppercase tracking-wide text-neutral-400 sm:inline">
        {t("language.toggleLabel")}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => setLanguage("zh")}
          disabled={language === "zh" || isChanging}
          className={cn(
            "rounded-full px-3 py-1 transition",
            language === "zh"
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          中文
        </button>
        <span className="text-neutral-400">/</span>
        <button
          type="button"
          onClick={() => setLanguage("en")}
          disabled={language === "en" || isChanging}
          className={cn(
            "rounded-full px-3 py-1 transition",
            language === "en"
              ? "bg-neutral-900 text-white"
              : "text-neutral-600 hover:text-neutral-900",
          )}
        >
          English
        </button>
      </div>
    </div>
  );
}
