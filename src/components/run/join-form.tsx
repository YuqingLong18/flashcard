"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { runJoinSchema } from "@/lib/validators";
import { useTranslations } from "@/components/providers/language-provider";

type FormInput = z.infer<typeof runJoinSchema>;

export function JoinForm() {
  const router = useRouter();
  const t = useTranslations();
  const schema = useMemo(
    () =>
      z.object({
        code: z
          .string()
          .trim()
          .min(4, t("join.form.validation.codeMin"))
          .max(12, t("join.form.validation.codeMax"))
          .transform((value) => value.toUpperCase()),
        nickname: z
          .string()
          .trim()
          .min(1, t("join.form.validation.nickname"))
          .max(32)
          .optional()
          .transform((value) => (value && value.length > 0 ? value : undefined)),
      }),
    [t],
  );
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      nickname: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormInput) => {
    setIsSubmitting(true);
    const parsed = schema.parse(values);
    const response = await fetch("/api/run/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error((payload as { error?: string } | null)?.error ?? t("join.form.error"));
      return;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;
    const deckLabel = data.deck?.title ?? t("join.form.defaultDeck");
    toast.success(t("join.form.success", { deck: deckLabel }));
    router.push(`/play/${data.runId}?playerId=${data.playerId}`);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="join-form"
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("join.form.codeLabel")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("join.form.codePlaceholder")}
                  maxLength={12}
                  onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("join.form.nicknameLabel")}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t("join.form.nicknamePlaceholder")} maxLength={32} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? t("join.form.submitting") : t("join.form.submit")}
        </Button>
      </form>
    </Form>
  );
}
