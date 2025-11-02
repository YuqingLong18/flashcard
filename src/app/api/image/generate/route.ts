import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { generateImage } from "@/lib/image-gen";
import { buildImagePrompt } from "@/lib/prompts";
import { imageGenerateSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const guard = await requireTeacher();
  if ("error" in guard) {
    return guard.error;
  }

  try {
    const body = await request.json();
    const parsed = imageGenerateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.message, 400);
    }

    const { front, back, modelId, promptOverride } = parsed.data;
    const prompt = promptOverride ?? buildImagePrompt(front, back);
    const imageUrl = await generateImage({ prompt, modelId });

    return jsonOk({ imageUrl });
  } catch (error) {
    console.error(error);
    const message =
      error instanceof Error && error.message
        ? error.message
        : "Failed to generate image.";
    return jsonError(message, 502);
  }
}
