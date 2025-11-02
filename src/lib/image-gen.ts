import { uploadBuffer, buildObjectKey } from "@/lib/storage";

const OPENROUTER_IMAGES_URL = "https://openrouter.ai/api/v1/images";
const OPENROUTER_RESPONSES_URL = "https://openrouter.ai/api/v1/responses";
const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

type OpenRouterImage = string | { url?: string; data_url?: string };

type OpenRouterContentItem =
  | { type?: "image_url"; image_url?: OpenRouterImage }
  | { type?: "output_image"; image_url?: string; data?: string }
  | { type?: string; url?: string; data?: string };

type OpenRouterMessage = {
  images?: Array<{ image_url?: OpenRouterImage }>;
  content?: OpenRouterContentItem[];
};

function isChatModel(model: string) {
  const normalized = model.toLowerCase();
  return (
    normalized.includes("gemini") ||
    normalized.includes("chat") ||
    normalized.startsWith("google/")
  );
}

function buildChatBody(model: string, prompt: string) {
  return {
    model,
    messages: [{ role: "user", content: prompt }],
    modalities: ["image", "text"],
  };
}

function extractDataUrlFromMessage(message: unknown) {
  const msg = (message ?? {}) as OpenRouterMessage;
  const directImage = msg.images?.[0]?.image_url;

  if (typeof directImage === "string") {
    return directImage;
  }

  if (directImage && typeof directImage === "object") {
    const nested =
      (directImage as { url?: string }).url ??
      (directImage as { data_url?: string }).data_url;
    if (typeof nested === "string") {
      return nested;
    }
  }

  const content = Array.isArray(msg.content) ? msg.content : [];
  for (const item of content) {
    if (item?.type === "image_url" && "image_url" in item) {
      const imageUrl = item.image_url;
      if (typeof imageUrl === "string") {
        return imageUrl;
      }
      if (imageUrl && typeof imageUrl === "object") {
        const url =
          (imageUrl as { url?: string }).url ??
          (imageUrl as { data_url?: string }).data_url;
        if (typeof url === "string") {
          return url;
        }
      }
    }

    if (item?.type === "output_image") {
      if ("image_url" in item && typeof item.image_url === "string") {
        return item.image_url;
      }
      if ("data" in item && typeof item.data === "string") {
        return item.data.startsWith("data:")
          ? item.data
          : `data:image/png;base64,${item.data}`;
      }
    }

    if ("url" in item && typeof item.url === "string") {
      return item.url;
    }

    if ("data" in item && typeof item.data === "string") {
      if (item.data.startsWith("data:")) {
        return item.data;
      }
      if (/^[A-Za-z0-9+/=]+$/.test(item.data)) {
        return `data:image/png;base64,${item.data}`;
      }
    }

    if (item && typeof item === "object" && "image_url" in item) {
      const urlValue = (item as { image_url?: string }).image_url;
      if (typeof urlValue === "string") {
        return urlValue;
      }
    }
  }
  return null;
}

interface ImagePayload {
  url?: string;
  b64_json?: string;
  image_base64?: string;
  data?: string;
  base64?: string;
  mime_type?: string;
  inline_data?: {
    data: string;
    mime_type?: string;
  };
  inlineData?: {
    data: string;
    mimeType?: string;
  };
  image_url?: string;
}

function resolveHeaders() {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const referer =
    process.env.OPENROUTER_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  const title = process.env.OPENROUTER_TITLE ?? "Flashrooms";

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": referer,
    "X-Title": title,
  };
}

function shouldUseResponsesEndpoint(model: string) {
  const forced =
    process.env.IMAGE_API_MODE?.toLowerCase().trim() ?? undefined;
  if (forced === "images") return false;
  if (forced === "responses" || forced === "chat") return true;
  if (isChatModel(model)) return false;

  return /gemini|flux|playground|midjourney|ideogram/i.test(model);
}

function buildImagesBody(model: string, prompt: string) {
  return {
    prompt,
    model,
    size: process.env.IMAGE_SIZE ?? "1024x1024",
    n: 1,
  };
}

function buildResponsesBody(model: string, prompt: string) {
  return {
    model,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: prompt,
          },
        ],
      },
    ],
  };
}

async function callOpenRouterEndpoint({
  endpoint,
  headers,
  body,
}: {
  endpoint: string;
  headers: Record<string, string>;
  body: unknown;
}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const raw = await response.text();
  return { response, raw };
}

function pickFirstImage(payload: unknown): {
  url?: string;
  base64?: string;
  mimeType?: string;
} | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;

  const direct = root.data;
  if (Array.isArray(direct) && direct.length > 0) {
    const first = direct[0] as ImagePayload;
    const result = extractFromPayload(first);
    if (result) {
      return result;
    }
  }

  const collections: Array<unknown> = [];

  if (Array.isArray(root.output)) {
    collections.push(...(root.output as unknown[]));
  }
  if (Array.isArray(root.choices)) {
    collections.push(...(root.choices as unknown[]));
  }
  if (Array.isArray(root.content)) {
    collections.push({ content: root.content });
  }

  for (const entry of collections) {
    if (!entry || typeof entry !== "object") continue;
    const block = entry as Record<string, unknown>;
    const content = block.content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const result = extractFromPayload(part as ImagePayload);
        if (result) {
          return result;
        }
      }
    }
    if (block.message && typeof block.message === "object") {
      const msg = block.message as Record<string, unknown>;
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (!part || typeof part !== "object") continue;
          const result = extractFromPayload(part as ImagePayload);
          if (result) return result;
        }
      }
    }
  }

  return extractFromPayload(root as ImagePayload);
}

function extractFromPayload(payload: ImagePayload): {
  url?: string;
  base64?: string;
  mimeType?: string;
} | null {
  if (!payload) return null;

  const url = payload.url ?? payload.image_url;
  const base64 =
    payload.b64_json ??
    payload.image_base64 ??
    payload.data ??
    payload.base64 ??
    payload.inline_data?.data ??
    payload.inlineData?.data;
  const mime =
    payload.mime_type ??
    payload.inline_data?.mime_type ??
    payload.inlineData?.mimeType ??
    "image/png";

  if (url || base64) {
    return {
      url,
      base64,
      mimeType: mime,
    };
  }

  return null;
}

function resolveExtension(mimeType: string) {
  if (mimeType.includes("png")) return "png";
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg";
  if (mimeType.includes("webp")) return "webp";
  if (mimeType.includes("gif")) return "gif";
  return "bin";
}

function decodeDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+)?(?:;base64)?,(.+)$/);
  if (!match) {
    throw new Error("Invalid data URL received from OpenRouter");
  }
  const [, meta, data] = match;
  if (!data) {
    throw new Error("No data found in OpenRouter data URL");
  }

  const isBase64 = dataUrl.includes(";base64,");
  const payload = isBase64 ? data : decodeURIComponent(data);
  const buffer = Buffer.from(payload, isBase64 ? "base64" : "utf8");
  const mimeType = meta ?? "image/png";
  return { buffer, mimeType };
}

async function downloadRemoteImage(url: string) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image from OpenRouter (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const mimeType = response.headers.get("content-type") ?? "image/png";
  return { buffer: Buffer.from(arrayBuffer), mimeType };
}

function isBase64String(value: string) {
  const normalized = value.replace(/\s+/g, "");
  if (!normalized || normalized.length % 4 !== 0) {
    return false;
  }
  return /^[A-Za-z0-9+/=]+$/.test(normalized);
}

async function resolveBufferFromSource(source: string) {
  if (source.startsWith("data:")) {
    return decodeDataUrl(source);
  }

  if (isBase64String(source)) {
    const normalized = source.replace(/\s+/g, "");
    return {
      buffer: Buffer.from(normalized, "base64"),
      mimeType: "image/png",
    };
  }

  return downloadRemoteImage(source);
}

export async function generateImage({
  prompt,
  modelId,
}: {
  prompt: string;
  modelId?: string;
}) {
  if (!prompt.trim()) {
    throw new Error("Prompt is required to generate an image");
  }

  const resolvedModel =
    modelId ?? process.env.IMAGE_MODEL_ID ?? "stability/sdxl";
  const headers = resolveHeaders();

  let response: Response;
  let raw: string;

  if (isChatModel(resolvedModel)) {
    const chatResult = await callOpenRouterEndpoint({
      endpoint: OPENROUTER_CHAT_URL,
      headers,
      body: buildChatBody(resolvedModel, prompt),
    });
    response = chatResult.response;
    raw = chatResult.raw;
  } else {
    const useResponses = shouldUseResponsesEndpoint(resolvedModel);

    const attempt = async (useResponsesEndpoint: boolean) => {
      const endpoint = useResponsesEndpoint
        ? OPENROUTER_RESPONSES_URL
        : OPENROUTER_IMAGES_URL;
      const body = useResponsesEndpoint
        ? buildResponsesBody(resolvedModel, prompt)
        : buildImagesBody(resolvedModel, prompt);

      return callOpenRouterEndpoint({ endpoint, headers, body });
    };

    const initial = await attempt(useResponses);
    response = initial.response;
    raw = initial.raw;

    if (!response.ok && response.status === 405) {
      const fallback = await attempt(!useResponses);
      response = fallback.response;
      raw = fallback.raw;
    }
  }

  if (!response.ok) {
    let message = `OpenRouter request failed (${response.status})`;
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { error?: { message?: string } };
        const nested = parsed?.error?.message ?? null;
        if (nested) {
          message = nested;
        } else if (typeof parsed === "object" && parsed) {
          const first = Object.values(parsed)[0];
          if (typeof first === "string") {
            message = first;
          }
        }
      } catch {
        message = raw;
      }
    }
    throw new Error(message.trim() || "OpenRouter image request failed");
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `Unexpected response from OpenRouter (${contentType}): ${raw.slice(0, 200)}`,
    );
  }

  const payload = JSON.parse(raw) as unknown;
  const image = pickFirstImage(payload);

  if (!image && !isChatModel(resolvedModel)) {
    throw new Error("Image generation returned no data");
  }

  let buffer: Buffer | null = null;
  let mimeType = image?.mimeType ?? "image/png";

  if (image?.base64) {
    const resolved = await resolveBufferFromSource(image.base64);
    buffer = resolved.buffer;
    mimeType = image.mimeType ?? resolved.mimeType ?? mimeType;
  } else if (image?.url) {
    const resolved = await resolveBufferFromSource(image.url);
    buffer = resolved.buffer;
    mimeType = image.mimeType ?? resolved.mimeType ?? mimeType;
  }

  if (!buffer && isChatModel(resolvedModel)) {
    const choices = (payload as {
      choices?: Array<{ message?: unknown }>;
    })?.choices;
    const message =
      choices && choices.length > 0 ? choices[0]?.message : undefined;
    const dataUrl = extractDataUrlFromMessage(message);
    if (dataUrl) {
      const resolved = await resolveBufferFromSource(dataUrl);
      buffer = resolved.buffer;
      mimeType = resolved.mimeType ?? mimeType;
    }
  }

  if (!buffer) {
    throw new Error("Image generation returned no encodable data");
  }

  const extension = resolveExtension(mimeType);
  const key = buildObjectKey(`ai-generated.${extension}`);

  return uploadBuffer({
    buffer,
    key,
    contentType: mimeType,
  });
}
