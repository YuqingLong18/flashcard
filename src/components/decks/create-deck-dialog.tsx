"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deckCreateSchema } from "@/lib/validators";
import { useTranslations } from "@/components/providers/language-provider";

type FormInput = z.input<typeof deckCreateSchema>;

export function CreateDeckDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const t = useTranslations();
  const schema = useMemo(
    () =>
      deckCreateSchema.extend({
        title: z
          .string()
          .min(3, t("deck.create.validation.short"))
          .max(120, t("deck.create.validation.long"))
          .transform((value) => value.trim()),
      }),
    [t],
  );

  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: "",
      description: undefined,
      language: undefined,
    },
  });

  const onSubmit = async (values: FormInput) => {
    setIsSubmitting(true);
    const parsed = schema.parse(values);
    const response = await fetch("/api/decks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error((payload as { error?: string } | null)?.error ?? t("deck.create.error"));
      return;
    }

    toast.success(t("deck.create.success"));
    form.reset();
    setOpen(false);
    router.refresh();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-neutral-900 text-white hover:bg-neutral-800">
          {t("deck.create.openButton")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("deck.create.dialogTitle")}</DialogTitle>
          <DialogDescription>{t("deck.create.dialogDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.create.titleLabel")}</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={t("deck.create.titlePlaceholder")} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.create.descriptionLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t("deck.create.descriptionPlaceholder")}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="language"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.create.languageLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      placeholder={t("deck.create.languagePlaceholder")}
                      maxLength={10}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("deck.create.submitting") : t("deck.create.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
