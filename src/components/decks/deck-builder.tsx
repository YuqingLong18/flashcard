"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

interface DeckBuilderProps {
  deck: DeckWithCards;
}

export function DeckBuilder({ deck }: DeckBuilderProps) {
  const router = useRouter();
  const [isPublished, setIsPublished] = useState(deck.isPublished);

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
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-neutral-900">Cards</h2>
          <AddCardDialog deckId={deck.id} onComplete={() => router.refresh()} />
        </div>
        <CardTable cards={deck.cards} onChanged={() => router.refresh()} />
      </section>
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
  const form = useForm<z.infer<typeof deckUpdateSchema>>({
    resolver: zodResolver(deckUpdateSchema),
    defaultValues: {
      title: deck.title,
      description: deck.description ?? "",
      language: deck.language ?? "",
    },
  });
  const [isSaving, setIsSaving] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);

  const onSubmit = async (values: z.infer<typeof deckUpdateSchema>) => {
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
      toast.error(payloadJson?.error ?? "Failed to update deck.");
      return;
    }

    toast.success("Deck details saved.");
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
      toast.error(payload?.error ?? "Unable to update publish state.");
      return;
    }

    const next = !isPublished;
    onPublishChange(next);
    toast.success(next ? "Deck published." : "Deck unpublished.");
  };

  return (
    <div className="space-y-4 rounded-2xl border border-neutral-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-neutral-900">Deck settings</h2>
        <Button
          size="sm"
          variant={isPublished ? "outline" : "default"}
          onClick={togglePublish}
          disabled={publishLoading}
        >
          {publishLoading ? "Updating…" : isPublished ? "Unpublish" : "Publish"}
        </Button>
      </div>
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
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
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} rows={3} />
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
                <FormLabel>Language</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="en" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </form>
      </Form>
      <p className="text-xs text-neutral-500">
        Publish to allow live runs. Students can only join published decks.
      </p>
    </div>
  );
}

function BulkImportForm({ deckId, onComplete }: { deckId: string; onComplete: () => void }) {
  const [csv, setCsv] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  const rows = useMemo(() => parseCsvRows(csv), [csv]);

  const handleImport = async () => {
    if (rows.length === 0) {
      toast.error("Add at least one row with front,back values.");
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
      toast.error(payload?.error ?? "Import failed.");
      return;
    }

    toast.success(`Imported ${rows.length} cards.`);
    setCsv("");
    onComplete();
  };

  return (
    <div className="space-y-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50 p-5">
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-neutral-900">Bulk import</h3>
        <p className="text-xs text-neutral-500">
          Paste CSV rows with <code className="rounded bg-neutral-200 px-1">front</code>,
          <code className="rounded bg-neutral-200 px-1">back</code>, and optional
          <code className="rounded bg-neutral-200 px-1">imageUrl</code> columns.
        </p>
      </div>
      <Textarea
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        placeholder={`photosynthesis,process used by plants to convert light energy\nchlorophyll,pigment that absorbs light`}
        rows={6}
      />
      <Button onClick={handleImport} disabled={isImporting || rows.length === 0} className="w-full">
        {isImporting ? "Importing…" : `Import ${rows.length} row${rows.length === 1 ? "" : "s"}`}
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
      return {
        front,
        back,
        imageUrl: imageUrl || undefined,
      };
    })
    .filter((row): row is { front: string; back: string; imageUrl?: string } => Boolean(row));
}

function AddCardDialog({ deckId, onComplete }: { deckId: string; onComplete: () => void }) {
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<z.infer<typeof cardCreateSchema>>({
    resolver: zodResolver(cardCreateSchema),
    defaultValues: {
      front: "",
      back: "",
      imageUrl: undefined,
    },
  });

  const submit = async (values: z.infer<typeof cardCreateSchema>) => {
    setIsSaving(true);
    const response = await fetch(`/api/decks/${deckId}/cards`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error ?? "Unable to add card.");
      return;
    }

    toast.success("Card added.");
    form.reset({ front: "", back: "", imageUrl: undefined });
    setOpen(false);
    onComplete();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Add card</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New card</DialogTitle>
          <DialogDescription>
            Provide front and back content. You can attach an optional image.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Front</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
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
                  <FormLabel>Back</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      onChange={(event) => field.onChange(event.target.value || undefined)}
                      placeholder="https://"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Adding…" : "Add card"}
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
}: {
  cards: DeckWithCards["cards"];
  onChanged: () => void;
}) {
  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-neutral-200 bg-white py-16 text-center">
        <p className="text-sm text-neutral-500">No cards yet. Add your first one to get started.</p>
        <Skeleton className="h-3 w-40 rounded" />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-1/3">Front</TableHead>
            <TableHead className="w-1/3">Back</TableHead>
            <TableHead className="w-1/6">Image</TableHead>
            <TableHead className="w-32 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cards.map((card) => (
            <TableRow key={card.id} className="align-top">
              <TableCell>
                <p className="whitespace-pre-wrap text-sm text-neutral-800">
                  {card.front}
                </p>
              </TableCell>
              <TableCell>
                <p className="whitespace-pre-wrap text-sm text-neutral-600">
                  {card.back}
                </p>
              </TableCell>
              <TableCell>
                {card.imageUrl ? (
                  <div className="flex h-16 w-24 items-center justify-center overflow-hidden rounded-lg border bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.imageUrl}
                      alt={card.front}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-neutral-400">None</span>
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

  const form = useForm<z.infer<typeof cardUpdateSchema>>({
    resolver: zodResolver(cardUpdateSchema),
    defaultValues: {
      front: card.front,
      back: card.back,
      imageUrl: card.imageUrl ?? null,
    },
  });

  const submit = async (values: z.infer<typeof cardUpdateSchema>) => {
    setIsSaving(true);
    const response = await fetch(`/api/cards/${card.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    setIsSaving(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error ?? "Failed to update card.");
      return;
    }

    toast.success("Card updated.");
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
      toast.error(payload?.error ?? "Unable to delete card.");
      return;
    }

    toast.success("Card deleted.");
    setOpen(false);
    onChanged();
  };

  const generateImage = async () => {
    const current = form.getValues();
    const front = (current.front ?? card.front).trim();
    const backRaw = (current.back ?? card.back)?.trim() ?? "";

    if (!front) {
      toast.error("Front text is required to generate an image.");
      return;
    }

    const requestBody = {
      front,
      ...(backRaw ? { back: backRaw } : {}),
    };

    setIsGenerating(true);
    const response = await fetch("/api/image/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });
    setIsGenerating(false);

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      toast.error(errorBody?.error ?? "Image generation failed.");
      return;
    }

    const responseBody = await response.json();
    const imageUrl = responseBody.data?.imageUrl ?? responseBody.imageUrl;
    if (!imageUrl) {
      toast.error("Image generation failed.");
      return;
    }
    form.setValue("imageUrl", imageUrl);
    toast.success("Image attached.");
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
      toast.error(payload?.error ?? "Upload init failed.");
      return;
    }

    const initPayload = await initResponse.json();
    const { uploadUrl, publicUrl } = initPayload.data ?? initPayload;

    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });

    setIsUploading(false);

    if (!uploadResponse.ok) {
      toast.error("Upload failed.");
      return;
    }

    form.setValue("imageUrl", publicUrl);
    toast.success("Image uploaded.");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit card</DialogTitle>
          <DialogDescription>
            Update content, attach or remove imagery, and save changes.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(submit)}>
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Front</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
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
                  <FormLabel>Back</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={4} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => {
                const previewUrl =
                  typeof field.value === "string" && field.value.length > 0 ? field.value : null;
                return (
                  <FormItem className="space-y-3">
                    <FormLabel>Image</FormLabel>
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
                      <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-100 py-6 text-center text-sm text-neutral-500">
                        No image attached.
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
                        {isGenerating ? "Generating…" : "Generate"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        asChild
                      >
                        <label className="cursor-pointer">
                          {isUploading ? "Uploading…" : "Upload"}
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
                          Remove
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
                {isDeleting ? "Deleting…" : "Delete card"}
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving…" : "Save changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
