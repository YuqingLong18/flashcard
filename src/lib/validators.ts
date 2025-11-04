import { z } from "zod";

export const deckCreateSchema = z.object({
  title: z.string().min(1).max(120).transform((value) => value.trim()),
  description: z
    .string()
    .max(500)
    .optional()
    .transform((value) => value?.trim() || undefined),
  language: z
    .string()
    .min(2)
    .max(10)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

export const deckUpdateSchema = deckCreateSchema.partial().refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field is required.",
  },
);

export const cardCreateSchema = z.object({
  front: z.string().min(1).max(400).transform((value) => value.trim()),
  back: z.string().min(1).max(400).transform((value) => value.trim()),
  imageUrl: z
    .string()
    .url()
    .optional()
    .transform((value) => (!value ? undefined : value.trim())),
});

export const cardUpdateSchema = z
  .object({
    front: z.string().min(1).max(400).optional(),
    back: z.string().min(1).max(400).optional(),
    imageUrl: z
      .union([z.string().url(), z.literal(null)])
      .optional()
      .transform((value) => {
        if (value === null || value === "") {
          return null;
        }
        return value?.trim() ?? undefined;
      }),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required.",
  });

export const bulkImportSchema = z.object({
  rows: z
    .array(
      z.object({
        front: z.string().min(1).max(400),
        back: z.string().min(1).max(400),
        imageUrl: z.string().url().optional(),
      }),
    )
    .max(500),
});

export const publishSchema = z.object({
  isPublished: z.boolean(),
});

export const runJoinSchema = z.object({
  code: z.string().trim().min(4).max(12),
  nickname: z
    .string()
    .min(1)
    .max(32)
    .optional()
    .transform((value) => value?.trim() || undefined),
});

export const answerSchema = z.object({
  playerId: z.string().cuid(),
  cardId: z.string().cuid(),
  label: z.enum(["KNOW", "REFRESHER"]),
});

export const uploadInitSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(3),
  size: z.number().positive().max(5 * 1024 * 1024),
});

export const imageGenerateSchema = z.object({
  front: z
    .string()
    .min(1)
    .max(400)
    .transform((value) => value.trim()),
  back: z
    .string()
    .min(1)
    .max(400)
    .optional()
    .transform((value) => value?.trim() || undefined),
  modelId: z.string().min(1).optional(),
  promptOverride: z
    .string()
    .max(600)
    .optional()
    .transform((value) => {
      const trimmed = value?.trim();
      return trimmed && trimmed.length > 0 ? trimmed : undefined;
    }),
});
