import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { generateFrontFromBack } from "@/lib/generate-front";
import { z } from "zod";

const generateFrontSchema = z.object({
  back: z.string().min(1).max(400).transform((value) => value.trim()),
});

export async function POST(request: Request) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  try {
    const body = await request.json();
    const parsed = generateFrontSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const front = await generateFrontFromBack(parsed.data.back);

    return jsonOk({ front });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to generate front.";
    return jsonError(message, 502);
  }
}

