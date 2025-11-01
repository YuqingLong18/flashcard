import { uploadBuffer, buildObjectKey } from "@/lib/storage";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/images";

interface OpenRouterImageResponse {
  data?: Array<{
    b64_json?: string;
    url?: string;
  }>;
}

export async function generateImage({
  prompt,
  modelId,
}: {
  prompt: string;
  modelId?: string;
}) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const body = {
    prompt,
    model: modelId ?? process.env.IMAGE_MODEL_ID ?? "stability/sdxl",
    size: "1024x1024",
    n: 1,
  };

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Image generation failed: ${errorText}`);
  }

  const payload = (await response.json()) as OpenRouterImageResponse;
  const imageData = payload.data?.[0];

  if (!imageData?.b64_json && !imageData?.url) {
    throw new Error("Image generation returned no data");
  }

  if (imageData.url) {
    return imageData.url;
  }

  const buffer = Buffer.from(imageData.b64_json as string, "base64");
  const key = buildObjectKey("ai-generated.png");
  return uploadBuffer({
    buffer,
    key,
    contentType: "image/png",
  });
}
