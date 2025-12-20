"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLanguage, useTranslations } from "@/components/providers/language-provider";

interface Props {
  deckId: string;
  disabled?: boolean;
}

export function PlayDeckButton({ deckId, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const { language } = useLanguage();
  const t = useTranslations();
  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(language === "zh" ? "zh-CN" : "en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }),
    [language],
  );

  const launchRun = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/decks/${deckId}/run`, {
      method: "POST",
    });
    setIsLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error((payload as { error?: string } | null)?.error ?? t("deck.play.error"));
      return;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;
    setCode(data.code);
    setExpiresAt(data.expiresAt);
    setOpen(true);
    toast.success(t("deck.play.success"));
  };

  return (
    <>
      <Button
        size="sm"
        className="bg-neutral-900 text-white hover:bg-neutral-800"
        disabled={disabled || isLoading}
        onClick={launchRun}
      >
        {isLoading ? t("deck.play.starting") : t("deck.play.button")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("deck.play.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("deck.play.dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-100 px-6 py-8 text-center">
              <p className="text-sm uppercase tracking-wide text-neutral-500">
                {t("deck.play.shareLabel")}
              </p>
              <p className="mt-4 font-mono text-4xl font-semibold tracking-[0.4rem] text-neutral-900">
                {code}
              </p>
            </div>
            {expiresAt && (
              <p className="text-sm text-neutral-500">
                {t("deck.play.expires", { time: dateFormatter.format(new Date(expiresAt)) })}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
