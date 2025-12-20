"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import {
  cardCreateSchema,
  cardUpdateSchema,
  deckUpdateSchema,
} from "@/lib/validators";
import type { DeckWithCards } from "@/types/deck";
import { useLanguage, useTranslations } from "@/components/providers/language-provider";

type DeckUpdateFormInput = z.input<typeof deckUpdateSchema>;
type CardCreateFormInput = z.input<typeof cardCreateSchema>;
type CardUpdateFormInput = z.input<typeof cardUpdateSchema>;
type AiSuggestionFormValues = {
  description: string;
  count: number;
};

interface DeckBuilderProps {
  deck: DeckWithCards;
}

// Builds a safe preview URL using the image proxy, regardless of how the value is stored.
function toPreviewUrl(value?: string | null) {
  if (!value) return null;
  if (value.startsWith("/api/image/proxy")) return value;

  // If it's a relative key (no scheme), proxy directly.
  if (!value.includes("://")) {
    const key = value.replace(/^\/+/, "");
    return `/api/image/proxy?key=${encodeURIComponent(key)}`;
  }

  try {
    const parsed = new URL(value);

    // Already a proxy URL with key param
    if (parsed.pathname.startsWith("/api/image/proxy")) {
      const key = parsed.searchParams.get("key");
      if (key) return `/api/image/proxy?key=${encodeURIComponent(key)}`;
    }

    const parts = parsed.pathname.split("/").filter(Boolean);
    const uploadsIndex = parts.indexOf("uploads");
    if (uploadsIndex >= 0) {
      const key = parts.slice(uploadsIndex).join("/");
      return `/api/image/proxy?key=${encodeURIComponent(key)}`;
    }
  } catch {
    // Fall through to return original value
  }

  return value;
}

export function DeckBuilder({ deck }: DeckBuilderProps) {
  const router = useRouter();
  const { language } = useLanguage();
  const t = useTranslations();
  const [isPublished, setIsPublished] = useState(deck.isPublished);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [bulkImageState, setBulkImageState] = useState<{
    running: boolean;
    total: number;
    completed: number;
    currentFront: string;
  }>({
    running: false,
    total: 0,
    completed: 0,
    currentFront: "",
  });

  const missingImageCount = useMemo(
    () => deck.cards.filter((card) => !card.imageUrl).length,
    [deck.cards],
  );
  const summaryFormatter = useMemo(
    () =>
      new Intl.ListFormat(language === "zh" ? "zh-CN" : "en-US", {
        style: "long",
        type: "conjunction",
      }),
    [language],
  );

  const handleGenerateMissingImages = async () => {
    const cardsWithoutImages = deck.cards.filter((card) => !card.imageUrl);
    if (cardsWithoutImages.length === 0) {
      toast.info(t("deck.builder.images.allHave"));
      return;
    }

    setBulkImageState({
      running: true,
      total: cardsWithoutImages.length,
      completed: 0,
      currentFront: "",
    });

    const summarize = (input: string) =>
      input.replace(/\s+/g, " ").trim().slice(0, 80) || t("deck.builder.images.placeholderFront");

    let generatedCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    for (const [index, card] of cardsWithoutImages.entries()) {
      setBulkImageState((prev) => ({
        ...prev,
        currentFront: card.front,
      }));

      try {
        const response = await fetch(`/api/cards/${card.id}/generate-image`, {
          method: "POST",
        });
        let payload: unknown = null;
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
        const data =
          payload && typeof payload === "object" && "data" in payload
            ? (payload as { data: unknown }).data
            : payload;

        if (!response.ok) {
          failedCount += 1;
          const errorMessage =
            (payload as { error?: string } | null)?.error ??
            t("deck.builder.images.errorGeneral");
          toast.error(t("deck.builder.images.singleFail", { front: summarize(card.front) }), {
            description: errorMessage,
          });
        } else if (data && typeof data === "object" && "skipped" in data) {
          const skipped = Boolean((data as { skipped?: boolean }).skipped);
          if (skipped) {
            skippedCount += 1;
          } else {
            generatedCount += 1;
          }
        } else {
          generatedCount += 1;
        }
      } catch (error) {
        failedCount += 1;
        const message =
          error instanceof Error && error.message
            ? error.message
            : t("deck.builder.images.errorGeneral");
        toast.error(t("deck.builder.images.singleFail", { front: summarize(card.front) }), {
          description: message,
        });
      }

      setBulkImageState((prev) => ({
        ...prev,
        completed: index + 1,
      }));
    }

    setBulkImageState({
      running: false,
      total: 0,
      completed: 0,
      currentFront: "",
    });

    router.refresh();

    if (generatedCount > 0) {
      const summaryParts: string[] = [
        t("deck.builder.images.summary.generated", { count: generatedCount }),
      ];
      if (skippedCount > 0) {
        summaryParts.push(
          t("deck.builder.images.summary.skipped", { count: skippedCount }),
        );
      }
      if (failedCount > 0) {
        summaryParts.push(
          t("deck.builder.images.summary.failed", { count: failedCount }),
        );
      }
      const summaryText = summaryFormatter.format(summaryParts);
      toast.success(
        summaryText
          ? t("deck.builder.images.successWithSummary", { summary: summaryText })
          : t("deck.builder.images.success"),
      );
    } else if (skippedCount > 0 && failedCount === 0) {
      toast.info(t("deck.builder.images.allHave"));
    } else if (failedCount > 0) {
      toast.error(
        failedCount === cardsWithoutImages.length
          ? t("deck.builder.images.failedAll")
          : t("deck.builder.images.failedSome"),
      );
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <aside className="space-y-6">
        <DeckMetadataForm
          deck={deck}
          isPublished={isPublished}
          onPublishChange={(value) => {
            setIsPublished(value);
            router.refresh();
          }}
          onSaved={() => router.refresh()}
        />
        <BulkImportForm deckId={deck.id} onComplete={() => router.refresh()} />
      </aside>
      <section className="space-y-4 rounded-2xl border border-[#dccaFF] bg-[#fbf8ff] p-5 shadow-[0_10px_35px_-30px_rgba(120,80,185,0.55)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#3f2b7f]">
            {t("deck.build.cardsHeading")}
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <AiSuggestionDialog
              deckId={deck.id}
              deckTitle={deck.title}
              deckDescription={deck.description ?? null}
              deckLanguage={deck.language ?? null}
              onComplete={() => router.refresh()}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateMissingImages}
              disabled={bulkImageState.running}
            >
              {bulkImageState.running
                ? t("deck.build.generatingStatus", {
                    completed: bulkImageState.completed,
                    total: bulkImageState.total,
                  })
                : missingImageCount > 0
                  ? t("deck.build.generateImagesCount", { count: missingImageCount })
                  : t("deck.build.generateImages")}
            </Button>
            <AddCardDialog deckId={deck.id} onComplete={() => router.refresh()} />
          </div>
        </div>
        {bulkImageState.running &&
          bulkImageState.currentFront.replace(/\s+/g, " ").trim().length > 0 && (
            <p className="text-xs text-[#7a68b6]">
              {t("deck.build.workingOn", {
                front: bulkImageState.currentFront
                  .replace(/\s+/g, " ")
                  .trim()
                  .slice(0, 80),
              })}
            </p>
          )}
        <CardTable
          cards={deck.cards}
          onChanged={() => router.refresh()}
          onPreviewImage={(url) => setPreviewImage(url)}
        />
      </section>
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-h-[90vh] max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewImage}
              alt={t("play.modal.imageAlt")}
              className="h-full w-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function DeckMetadataForm({
  deck,
  isPublished,
  onPublishChange,
  onSaved,
}: {
  deck: DeckWithCards;
  isPublished: boolean;
  onPublishChange: (next: boolean) => void;
  onSaved: () => void;
}) {
  const router = useRouter();
  const t = useTranslations();
  const form = useForm<DeckUpdateFormInput>({
    resolver: zodResolver(deckUpdateSchema),
    defaultValues: {
      title: deck.title,
      description: deck.description ?? "",
      language: deck.language ?? "",
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const onSubmit = async (values: DeckUpdateFormInput) => {
    const payload: Record<string, string> = {};
    if (values.title) {
      payload.title = values.title.trim();
    }
    if (values.description !== undefined) {
      payload.description = values.description.trim();
    }
    if (values.language !== undefined) {
      payload.language = values.language.trim();
    }

    setIsSaving(true);

    const response = await fetch(`/api/decks/${deck.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSaving(false);

    if (!response.ok) {
      const payloadJson = await response.json().catch(() => null);
      toast.error((payloadJson as { error?: string } | null)?.error ?? t("deck.metadata.toast.updateError"));
      return;
    }

    toast.success(t("deck.metadata.toast.updateSuccess"));
    onSaved();
    form.reset(values);
    router.refresh();
  };

  const togglePublish = async () => {
    setPublishLoading(true);
    const response = await fetch(`/api/decks/${deck.id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublished: !isPublished }),
    });
    setPublishLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error((payload as { error?: string } | null)?.error ?? t("deck.metadata.toast.publishError"));
      return;
    }

    const next = !isPublished;
    onPublishChange(next);
    toast.success(next ? t("deck.metadata.toast.published") : t("deck.metadata.toast.unpublished"));
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#dccaff] bg-[#fbf8ff] p-5 shadow-[0_10px_35px_-30px_rgba(120,80,185,0.6)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#402c7c]">{t("deck.metadata.heading")}</h2>
        <Button
          size="sm"
          variant={isPublished ? "outline" : "default"}
          onClick={togglePublish}
          disabled={publishLoading}
        >
          {publishLoading
            ? t("deck.metadata.publishButton.updating")
            : isPublished
              ? t("deck.metadata.publishButton.unpublish")
              : t("deck.metadata.publishButton.publish")}
        </Button>
      </div>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("deck.metadata.form.titleLabel")}</FormLabel>
                <FormControl>
                  <Input {...field} />
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
                <FormLabel>{t("deck.metadata.form.descriptionLabel")}</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} value={field.value ?? ""} />
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
                <FormLabel>{t("deck.metadata.form.languageLabel")}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t("deck.metadata.form.languagePlaceholder")}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? t("deck.metadata.form.saving") : t("deck.metadata.form.save")}
          </Button>
        </form>
      </Form>
      <p className="text-xs text-[#7a68b6]">
        {t("deck.metadata.notice")}
      </p>
    </div>
  );
}

function BulkImportForm({ deckId, onComplete }: { deckId: string; onComplete: () => void }) {
  const [csv, setCsv] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const t = useTranslations();

  const rows = useMemo(() => parseCsvRows(csv), [csv]);

  const handleImport = async () => {
    if (rows.length === 0) {
      toast.error(t("deck.bulk.error.empty"));
      return;
    }

    setIsImporting(true);
    const response = await fetch(`/api/decks/${deckId}/cards/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    setIsImporting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error((payload as { error?: string } | null)?.error ?? t("deck.bulk.error.failed"));
      return;
    }

    toast.success(t("deck.bulk.success", { count: rows.length }));
    setCsv("");
    onComplete();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-[#d9c8ff] bg-[#f5efff] p-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-[#3f2b7f]">{t("deck.bulk.heading")}</h3>
        <p className="text-xs text-[#7a68b6]">
          {t("deck.bulk.instructions")}
          <code className="rounded bg-[#efe4ff] px-1">front</code>,
          <code className="rounded bg-[#efe4ff] px-1">back</code>,
          <code className="rounded bg-[#efe4ff] px-1">imageUrl</code>
        </p>
      </div>
      <Textarea
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        placeholder={t("deck.bulk.placeholder")}
        rows={6}
      />
      <Button onClick={handleImport} disabled={isImporting || rows.length === 0} className="w-full">
        {isImporting
          ? t("deck.bulk.importing")
          : rows.length === 1
            ? t("deck.bulk.importButton", { count: rows.length })
            : t("deck.bulk.importButtonPlural", { count: rows.length })}
      </Button>
    </div>
  );
}

function parseCsvRows(input: string) {
  return input
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [front, back, imageUrl] = line.split(",").map((part) => part.trim().replace(/^"|"$/g, ""));
      if (!front || !back) {
        return null;
      }
      const normalizedImageUrl = imageUrl && imageUrl.length > 0 ? imageUrl : undefined;
      return {
        front,
        back,
        ...(normalizedImageUrl ? { imageUrl: normalizedImageUrl } : {}),
      };
    })
    .filter((row): row is { front: string; back: string; imageUrl?: string } => row !== null);
}

function AiSuggestionDialog({
  deckId,
  deckTitle,
  deckDescription,
  deckLanguage,
  onComplete,
}: {
  deckId: string;
  deckTitle: string;
  deckDescription: string | null;
  deckLanguage: string | null;
  onComplete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const defaultDescription = (deckDescription ?? "").trim();
  const normalizedLanguage = (deckLanguage ?? "").trim();
  const t = useTranslations();
  const schema = useMemo(
    () =>
      z.object({
        description: z
          .string()
          .trim()
          .min(10, t("deck.builder.ai.descriptionMin"))
          .max(600, t("deck.builder.ai.descriptionMax")),
        count: z
          .number()
          .int(t("deck.builder.ai.countInteger"))
          .min(1, t("deck.builder.ai.countMin"))
          .max(20, t("deck.builder.ai.countMax")),
      }),
    [t],
  );
  const form = useForm<AiSuggestionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      description: defaultDescription,
      count: 5,
    },
  });

  useEffect(() => {
    if (!open) {
      form.reset({
        description: defaultDescription,
        count: 5,
      });
    }
  }, [defaultDescription, form, open]);

  const submit = async (values: AiSuggestionFormValues) => {
    setIsSubmitting(true);
    const response = await fetch(`/api/decks/${deckId}/cards/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: values.description,
        count: values.count,
      }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      const errorMessage =
        (payload as { error?: string } | null)?.error ??
        t("deck.ai.toast.error");
      toast.error(errorMessage);
      return;
    }

    const payload = await response.json().catch(() => null);
    const data =
      payload && typeof payload === "object" && "data" in payload
        ? (payload as { data: unknown }).data
        : payload;

    let createdCount = 0;
    if (
      data &&
      typeof data === "object" &&
      Array.isArray((data as { cards?: unknown[] }).cards)
    ) {
      createdCount = (data as { cards: unknown[] }).cards.length;
    } else if (
      data &&
      typeof data === "object" &&
      typeof (data as { created?: number }).created === "number"
    ) {
      createdCount = (data as { created: number }).created;
    }

    if (createdCount === 0) {
      toast.info(t("deck.ai.toast.empty"));
    } else {
      toast.success(t("deck.ai.toast.success", { count: createdCount }));
    }

    setOpen(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">{t("deck.ai.trigger")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("deck.ai.title")}</DialogTitle>
          <DialogDescription>{t("deck.ai.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1 rounded-lg border border-[#eadfff] bg-[#f8f3ff] p-3 text-xs text-[#6d53ad]">
          <p className="font-medium text-[#3e2f7c]">{deckTitle}</p>
          {defaultDescription && <p className="leading-snug">{defaultDescription}</p>}
          {normalizedLanguage && <p>{t("deck.ai.languageLabel", { language: normalizedLanguage })}</p>}
        </div>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.ai.form.promptLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value)}
                      rows={4}
                      placeholder={t("deck.ai.form.promptPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.ai.form.countLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={1}
                      max={20}
                      value={field.value ?? ""}
                      onChange={(event) => {
                        const value = event.target.value;
                        // Convert string to number for the form
                        const numValue = value === "" ? undefined : Number(value);
                        field.onChange(numValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("deck.ai.submitting") : t("deck.ai.submit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddCardDialog({ deckId, onComplete }: { deckId: string; onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingFront, setIsGeneratingFront] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const t = useTranslations();

  const form = useForm<CardCreateFormInput>({
    resolver: zodResolver(cardCreateSchema),
    defaultValues: {
      front: "",
      back: "",
      imageUrl: undefined,
    },
  });

  const unwrapData = <T,>(payload: unknown): T | null => {
    if (payload && typeof payload === "object" && "data" in payload) {
      return ((payload as { data: unknown }).data as T) ?? null;
    }
    return (payload as T) ?? null;
  };

  const parseResponseData = async <T,>(response: Response): Promise<T | null> => {
    try {
      const payload = await response.json();
      return unwrapData<T>(payload);
    } catch {
      return null;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setUploadedFile(file);
      } else {
        toast.error(t("deck.card.toast.uploadInvalid"));
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type.startsWith("image/")) {
        setUploadedFile(file);
      } else {
        toast.error(t("deck.card.toast.uploadInvalid"));
      }
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    // Get upload URL
    const uploadResponse = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    let payload: unknown = null;
    try {
      payload = await uploadResponse.json();
    } catch {
      payload = null;
    }

    if (!uploadResponse.ok) {
      const message =
        (payload as { error?: string } | null)?.error ??
        "Failed to get upload URL";
      throw new Error(message);
    }

    const data = unwrapData<{ uploadUrl?: string; publicUrl?: string; storedUrl?: string; imageUrl?: string }>(payload);
    const uploadUrl = data?.uploadUrl;
    const publicUrl = data?.storedUrl ?? data?.publicUrl;
    if (!uploadUrl || !publicUrl) {
      throw new Error("Upload URL missing from response.");
    }

    // Upload file
    const uploadResult = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type,
      },
      body: file,
    });

    if (!uploadResult.ok) {
      throw new Error("Failed to upload file");
    }

    return publicUrl;
  };

  const generateImage = async (front: string, back: string): Promise<string> => {
    const response = await fetch("/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ front, back }),
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new Error(payload?.error ?? "Failed to generate image");
    }

    const data = await parseResponseData<{ imageUrl?: string; storedUrl?: string }>(response);
    const storedUrl = data?.storedUrl ?? data?.imageUrl;
    if (!storedUrl) {
      throw new Error("Image generation did not return a URL.");
    }
    return storedUrl;
  };

  const submit = async (values: CardCreateFormInput) => {
    setIsSaving(true);
    let front = values.front?.trim();
    const back = values.back.trim();
    let imageUrl: string | undefined = undefined;

    try {
      // Step 1: Generate front from back if not provided
      if (!front || front.length === 0) {
        setIsGeneratingFront(true);
        try {
          const response = await fetch("/api/cards/generate-front", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ back }),
          });

          let payload: unknown = null;
          try {
            payload = await response.json();
          } catch {
            payload = null;
          }

          if (!response.ok) {
            const message =
              (payload as { error?: string } | null)?.error ??
              "Failed to generate front";
            throw new Error(message);
          }

          const generatedFront =
            unwrapData<{ front?: string }>(payload)?.front ??
            (payload as { front?: string } | null)?.front;
          if (!generatedFront || generatedFront.trim().length === 0) {
            throw new Error("Generated front is empty");
          }
          front = generatedFront.trim();
          form.setValue("front", front);
        } catch (error) {
          toast.error(
            error instanceof Error && error.message
              ? t("deck.card.toast.generateFrontError", { message: error.message })
              : t("deck.card.toast.generateFrontFallback"),
          );
          setIsSaving(false);
          setIsGeneratingFront(false);
          return;
        }
        setIsGeneratingFront(false);
      }

      // Ensure front is set (should be guaranteed by now, but double-check)
      if (!front || front.trim().length === 0) {
        toast.error(t("deck.card.toast.frontRequired"));
        setIsSaving(false);
        return;
      }

      // Step 2: Handle image - upload file or generate
      if (uploadedFile) {
        try {
          imageUrl = await uploadFile(uploadedFile);
        } catch (error) {
          toast.error(
            error instanceof Error && error.message
              ? t("deck.card.toast.uploadFailedWithReason", { message: error.message })
              : t("deck.card.toast.uploadFailed"),
          );
          setIsSaving(false);
          return;
        }
      } else {
        // Generate image if no file uploaded
        setIsGeneratingImage(true);
        try {
          imageUrl = await generateImage(front, back);
        } catch (error) {
          // Don't fail the whole operation if image generation fails
          console.warn("Image generation failed:", error);
          toast.warning(t("deck.card.toast.continueWithoutImage"));
        }
        setIsGeneratingImage(false);
      }

      // Step 3: Create card
      const parsed = cardCreateSchema.parse({
        front: front.trim(),
        back: back.trim(),
        imageUrl,
      });

      const response = await fetch(`/api/decks/${deckId}/cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        toast.error((payload as { error?: string } | null)?.error ?? t("deck.card.toast.addFailed"));
        setIsSaving(false);
        return;
      }

      toast.success(t("deck.card.toast.addSuccess"));
      form.reset({ front: "", back: "", imageUrl: undefined });
      setUploadedFile(null);
      setOpen(false);
      onComplete();
    } catch (error) {
      toast.error(
        error instanceof Error && error.message ? error.message : t("deck.card.toast.addFailed"),
      );
    } finally {
      setIsSaving(false);
      setIsGeneratingFront(false);
      setIsGeneratingImage(false);
    }
  };

  useEffect(() => {
    if (!open) {
      form.reset({ front: "", back: "", imageUrl: undefined });
      setUploadedFile(null);
      setIsGeneratingFront(false);
      setIsGeneratingImage(false);
    }
  }, [open, form]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">{t("deck.card.add")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("deck.card.newTitle")}</DialogTitle>
          <DialogDescription>{t("deck.card.newDescription")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.card.backLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={4}
                      value={field.value ?? ""}
                      placeholder={t("deck.card.backPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.card.frontLabel")}</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      rows={3}
                      value={field.value ?? ""}
                      placeholder={t("deck.card.frontPlaceholder")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>{t("deck.card.imageLabel")}</FormLabel>
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                  dragActive
                    ? "border-[#7a68b6] bg-[#f4ecff]"
                    : "border-[#d9c8ff] bg-[#faf7ff]"
                }`}
              >
                {uploadedFile ? (
                  <div className="space-y-2">
                    <p className="text-sm text-[#5a46a5] font-medium">{uploadedFile.name}</p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedFile(null)}
                    >
                      {t("deck.card.imageRemove")}
                    </Button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-[#7a68b6] mb-2">
                      {t("deck.card.imageDrop")}
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileInput}
                      className="hidden"
                      id="image-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById("image-upload")?.click()}
                    >
                      {t("deck.card.imageBrowse")}
                    </Button>
                    <p className="text-xs text-[#8f7cc8] mt-2">
                      {t("deck.card.imageHint")}
                    </p>
                  </>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={isSaving || isGeneratingFront || isGeneratingImage}
              >
                {isGeneratingFront
                  ? t("deck.card.state.generatingFront")
                  : isGeneratingImage
                    ? t("deck.card.state.generatingImage")
                    : isSaving
                      ? t("deck.card.state.adding")
                      : t("deck.card.add")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function CardTable({
  cards,
  onChanged,
  onPreviewImage,
}: {
  cards: DeckWithCards["cards"];
  onChanged: () => void;
  onPreviewImage: (url: string) => void;
}) {
  const t = useTranslations();
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-[#d9c8ff] bg-[#f9f5ff] py-16 text-center">
        <p className="text-sm text-[#5a46a5]">{t("deck.table.empty")}</p>
        <Skeleton className="h-3 w-40 rounded" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#dccaFF] bg-[#fbf8ff] shadow-[0_12px_36px_-28px_rgba(120,80,185,0.6)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">{t("deck.table.front")}</TableHead>
            <TableHead className="w-1/3">{t("deck.table.back")}</TableHead>
            <TableHead className="w-1/6">{t("deck.table.image")}</TableHead>
            <TableHead className="w-32 text-right">{t("deck.table.actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={card.id} className="align-top">
              <TableCell>
                <p className="whitespace-pre-wrap text-sm text-[#2f1d59]">
                  {card.front}
                </p>
              </TableCell>
              <TableCell>
                <p className="whitespace-pre-wrap text-sm text-[#5a46a5]">
                  {card.back}
                </p>
              </TableCell>
              <TableCell>
                {card.imageUrl ? (
                  <button
                    type="button"
                    onClick={() => onPreviewImage(toPreviewUrl(card.imageUrl!) ?? card.imageUrl!)}
                    className="group flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border border-[#e2d3ff] bg-[#f4ecff] transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={toPreviewUrl(card.imageUrl) ?? card.imageUrl}
                      alt={card.front}
                      className="max-h-full max-w-full object-contain"
                      onError={(e) => {
                        // If image fails to load, try reconstructing URL from MinIO
                        const img = e.currentTarget;
                        const originalSrc = img.src;
                        if (originalSrc.includes("/uploads/")) {
                          const keyMatch = originalSrc.match(/\/uploads\/[^/]+$/);
                          if (keyMatch && process.env.NEXT_PUBLIC_STORAGE_ENDPOINT) {
                            const key = keyMatch[0].slice(1);
                            img.src = `${process.env.NEXT_PUBLIC_STORAGE_ENDPOINT}/${process.env.NEXT_PUBLIC_STORAGE_BUCKET || "flashrooms"}/${key}`;
                          }
                        }
                      }}
                    />
                    <span className="sr-only">{t("deck.table.viewImage")}</span>
                  </button>
                ) : (
                  <span className="text-xs text-[#8f7cc8]">{t("deck.table.none")}</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <EditCardDialog card={card} onChanged={onChanged} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function EditCardDialog({
  card,
  onChanged,
}: {
  card: DeckWithCards["cards"][number];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");
  const t = useTranslations();

  const form = useForm<CardUpdateFormInput>({
    resolver: zodResolver(cardUpdateSchema),
    defaultValues: {
      front: card.front,
      back: card.back,
      imageUrl: card.imageUrl ?? null,
    },
  });

  const submit = async (values: CardUpdateFormInput) => {
    setIsSaving(true);
    const parsed = cardUpdateSchema.parse(values);
    const response = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    setIsSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error((payload as { error?: string } | null)?.error ?? t("deck.card.edit.updateError"));
      return;
    }

    toast.success(t("deck.card.edit.updateSuccess"));
    setOpen(false);
    onChanged();
  };

  const remove = async () => {
    setIsDeleting(true);
    const response = await fetch(`/api/cards/${card.id}`, {
      method: "DELETE",
    });
    setIsDeleting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error((payload as { error?: string } | null)?.error ?? t("deck.card.edit.deleteError"));
      return;
    }

    toast.success(t("deck.card.edit.deleteSuccess"));
    setOpen(false);
    onChanged();
  };

  const generateImage = async () => {
    const current = form.getValues();
    const front = (current.front ?? card.front).trim();
    const backRaw = (current.back ?? card.back)?.trim() ?? "";

    if (!front) {
      toast.error(t("deck.card.edit.imageFrontRequired"));
      return;
    }

    const requestBody: {
      front: string;
      back?: string;
      promptOverride?: string;
    } = {
      front,
      ...(backRaw ? { back: backRaw } : {}),
    };
    const promptOverride = customPrompt.trim();
    if (promptOverride) {
      requestBody.promptOverride = promptOverride;
    }

    setIsGenerating(true);
    const response = await fetch("/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    setIsGenerating(false);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      toast.error(
        (errorBody as { error?: string } | null)?.error ?? t("deck.card.edit.imageError"),
      );
      return;
    }

    const responseBody = await response.json();
    const storedUrl =
      responseBody.data?.storedUrl ??
      responseBody.storedUrl ??
      responseBody.data?.imageUrl ??
      responseBody.imageUrl;
    if (!storedUrl) {
      toast.error(t("deck.card.edit.imageError"));
      return;
    }
    form.setValue("imageUrl", storedUrl);
    toast.success(t("deck.card.edit.imageAttached"));
  };

  const uploadImage: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const initResponse = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type,
        size: file.size,
      }),
    });

    if (!initResponse.ok) {
      setIsUploading(false);
      const payload = await initResponse.json().catch(() => null);
      toast.error((payload as { error?: string } | null)?.error ?? t("deck.card.edit.uploadInitError"));
      return;
    }

    const initPayload = await initResponse.json();
    const {
      uploadUrl,
      publicUrl,
      storedUrl,
      imageUrl: proxiedUrl,
    } = initPayload.data ?? initPayload;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    setIsUploading(false);

    if (!uploadResponse.ok) {
      toast.error(t("deck.card.edit.uploadError"));
      return;
    }

    form.setValue("imageUrl", storedUrl ?? publicUrl ?? proxiedUrl);
    toast.success(t("deck.card.edit.uploadSuccess"));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          {t("deck.card.edit.trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("deck.card.edit.title")}</DialogTitle>
          <DialogDescription>{t("deck.card.edit.description")}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.card.frontLabel")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("deck.card.backLabel")}</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} value={field.value ?? ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormLabel>{t("deck.card.edit.customPromptLabel")}</FormLabel>
              <Textarea
                value={customPrompt}
                onChange={(event) => setCustomPrompt(event.target.value)}
                rows={3}
                placeholder={t("deck.card.edit.customPromptHelp")}
                spellCheck={false}
              />
              <p className="text-xs text-neutral-500">
                {t("deck.card.edit.customPromptHelp")}
              </p>
            </div>
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => {
                const previewUrl = toPreviewUrl(
                  typeof field.value === "string" && field.value.length > 0 ? field.value : null,
                );
                return (
                  <FormItem className="space-y-3">
                    <FormLabel>{t("deck.card.imageLabel")}</FormLabel>
                    {previewUrl ? (
                      <div className="flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border bg-neutral-100 p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={previewUrl}
                          alt={form.getValues("front") ?? card.front}
                          className="h-full w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="rounded-xl border border-dashed border-[#d9c8ff] bg-[#f4ecff] py-6 text-center text-sm text-[#6d53ad]">
                        {t("deck.card.edit.noImage")}
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={generateImage}
                        disabled={isGenerating}
                      >
                        {isGenerating ? t("deck.card.edit.generating") : t("deck.card.edit.generate")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        asChild
                      >
                        <label className="cursor-pointer">
                          {isUploading ? t("deck.card.edit.uploading") : t("deck.card.edit.upload")}
                          <input type="file" accept="image/*" className="hidden" onChange={uploadImage} />
                        </label>
                      </Button>
                      {previewUrl && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => field.onChange(null)}
                        >
                          {t("deck.card.edit.removeImage")}
                        </Button>
                      )}
                    </div>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        onChange={(event) => field.onChange(event.target.value || null)}
                        placeholder="https://"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                );
              }}
            />
            <DialogFooter className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={isDeleting}
                onClick={remove}
              >
                {isDeleting ? t("deck.card.edit.deleting") : t("deck.card.edit.delete")}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? t("deck.card.edit.saving") : t("deck.card.edit.save")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
