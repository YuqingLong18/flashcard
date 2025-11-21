import { cleanContent } from "@/lib/sanitize";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface SuggestionContext {
  title: string;
  description?: string | null;
  language?: string | null;
}

export interface CardSuggestion {
  front: string;
  back: string;
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

function buildSystemPrompt() {
  return [
    "You help teachers create flashcard decks for classroom study.",
    "Always reply with strict JSON that matches this shape:",
    '{ "cards": [ { "front": "string", "back": "string" } ] }.',
    "Keep each front concise (term, question, or prompt) and each back a short answer or explanation.",
    "Do not include markdown, code fences, commentary, or additional keys.",
    "Stay appropriate for students.",
  ].join(" ");
}

function buildUserPrompt({
  description,
  count,
  context,
}: {
  description: string;
  count: number;
  context: SuggestionContext;
}) {
  const parts = [
    `Deck title: ${context.title}`,
    `Requested cards: ${count}`,
  ];

  if (context.description && context.description.trim().length > 0) {
    parts.push(`Existing deck description: ${context.description.trim()}`);
  }

  if (context.language && context.language.trim().length > 0) {
    parts.push(`Preferred language: ${context.language.trim()}`);
  }

  parts.push(`Teacher request: ${description}`);

  parts.push(
    "Return cards that align with the teacher request. Format only as JSON.",
  );

  return parts.join("\n");
}

function extractMessageText(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return "";
  }

  const choices = (payload as { choices?: Array<{ message?: unknown }> }).choices;
  if (!choices || choices.length === 0) {
    return "";
  }

  const message = choices[0]?.message as { content?: unknown };
  if (!message) {
    return "";
  }

  const content = message.content;

  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (!item) return "";
        if (typeof item === "string") return item;
        if (typeof item === "object" && "text" in item && typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function tryParseJsonResponse(raw: string) {
  const cleaned = raw.trim().replace(/```json|```/g, "").trim();
  const attempts = [cleaned];

  if (cleaned.includes("{") && cleaned.includes("}")) {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      attempts.push(cleaned.slice(firstBrace, lastBrace + 1));
    }
  }

  for (const candidate of attempts) {
    try {
      return JSON.parse(candidate) as unknown;
    } catch {
      // try next candidate
    }
  }

  return null;
}

function extractArrayFromPayload(parsed: unknown) {
  if (!parsed) return [];

  if (Array.isArray(parsed)) {
    return parsed;
  }

  if (typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.cards)) {
      return obj.cards;
    }
    if (Array.isArray(obj.suggestions)) {
      return obj.suggestions;
    }
    if (Array.isArray(obj.items)) {
      return obj.items;
    }
  }

  return [];
}

function normalizeSuggestionEntry(entry: unknown) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const candidate = entry as Record<string, unknown>;

  const frontKeys = ["front", "term", "question", "prompt"];
  const backKeys = ["back", "definition", "answer", "explanation", "response"];

  let frontRaw: string | null = null;
  for (const key of frontKeys) {
    const value = candidate[key];
    if (typeof value === "string" && value.trim().length > 0) {
      frontRaw = value;
      break;
    }
  }

  let backRaw: string | null = null;
  for (const key of backKeys) {
    const value = candidate[key];
    if (typeof value === "string" && value.trim().length > 0) {
      backRaw = value;
      break;
    }
  }

  if (!frontRaw || !backRaw) {
    return null;
  }

  const front = cleanContent(frontRaw).slice(0, 400);
  const back = cleanContent(backRaw).slice(0, 400);

  if (!front || !back) {
    return null;
  }

  return { front, back };
}

export async function generateCardSuggestions({
  description,
  count,
  context,
}: {
  description: string;
  count: number;
  context: SuggestionContext;
}): Promise<CardSuggestion[]> {
  const headers = resolveHeaders();
  const modelId =
    process.env.SUGGESTION_MODEL_ID ??
    process.env.CARD_SUGGESTION_MODEL_ID ??
    process.env.TEXT_MODEL_ID ??
    "gpt-4o-mini";

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: "system",
          content: buildSystemPrompt(),
        },
        {
          role: "user",
          content: buildUserPrompt({ description, count, context }),
        },
      ],
      temperature: 0.7,
    }),
  });

  const rawResponse = await response.text();

  if (!response.ok) {
    let message = `OpenRouter text request failed (${response.status})`;
    try {
      const parsed = JSON.parse(rawResponse) as { error?: { message?: string } };
      const nested = parsed?.error?.message;
      if (nested) {
        message = nested;
      }
    } catch {
      if (rawResponse.trim().length > 0) {
        message = rawResponse.trim();
      }
    }
    throw new Error(message);
  }

  let parsedPayload: unknown = null;
  try {
    parsedPayload = JSON.parse(rawResponse) as unknown;
  } catch {
    // fallback to manual parsing using message text
  }

  let textContent = "";
  if (parsedPayload) {
    textContent = extractMessageText(parsedPayload);
  }

  if (!textContent && rawResponse) {
    textContent = rawResponse;
  }

  if (!textContent) {
    throw new Error("LLM response did not include any content.");
  }

  const parsedJson = tryParseJsonResponse(textContent);
  const entries = extractArrayFromPayload(parsedJson);

  const unique = new Map<string, CardSuggestion>();
  for (const entry of entries) {
    const normalized = normalizeSuggestionEntry(entry);
    if (!normalized) continue;
    const key = `${normalized.front}|||${normalized.back}`;
    if (!unique.has(key)) {
      unique.set(key, normalized);
    }
    if (unique.size >= count) {
      break;
    }
  }

  if (unique.size === 0) {
    throw new Error("The AI did not return any flashcard suggestions.");
  }

  return Array.from(unique.values()).slice(0, count);
}
