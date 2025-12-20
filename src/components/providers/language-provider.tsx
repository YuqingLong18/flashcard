"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { createTranslator, DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, resolveLanguage, type Language } from "@/lib/i18n";

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  isChanging: boolean;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({
  children,
  initialLanguage,
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const router = useRouter();
  const [language, setLanguageState] = useState<Language>(initialLanguage ?? DEFAULT_LANGUAGE);
  const [isPending, startTransition] = useTransition();

  const persistLanguage = useCallback((value: Language) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("preferred-language", value);
    }
    if (typeof document !== "undefined") {
      document.cookie = `${LANGUAGE_COOKIE_NAME}=${value}; path=/; max-age=31536000; SameSite=Lax`;
      document.documentElement.lang = value;
    }
  }, []);

  const changeLanguage = useCallback(
    (next: Language) => {
      const resolved = resolveLanguage(next);
      setLanguageState((prev) => {
        if (prev === resolved) {
          persistLanguage(resolved);
          return prev;
        }
        persistLanguage(resolved);
        startTransition(() => {
          router.refresh();
        });
        return resolved;
      });
    },
    [persistLanguage, router],
  );

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
    }
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: changeLanguage,
      isChanging: isPending,
    }),
    [changeLanguage, isPending, language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}

export function useTranslations() {
  const { language } = useLanguage();
  return useMemo(() => createTranslator(language), [language]);
}
