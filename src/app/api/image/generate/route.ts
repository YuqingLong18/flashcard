import { jsonError, jsonOk } from "@/lib/api";
import { requireTeacher } from "@/lib/auth-guards";
import { generateImage } from "@/lib/image-gen";
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

    const imageUrl = await generateImage({
      prompt: parsed.data.prompt,
      modelId: parsed.data.modelId,
    });

    return jsonOk({ imageUrl });
  } catch (error) {
    console.error(error);
    return jsonError("Failed to generate image.", 500);
  }
}
