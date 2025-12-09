import { cleanContent } from "@/lib/sanitize";
import { ensurePromptIsSafe } from "@/lib/safety-check";

const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

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

/**
 * Generates a concise front description for a flashcard based on the back (answer/keyword).
 * The front should be a question or description that prompts the student to think about the concept.
 */
export async function generateFrontFromBack(back: string): Promise<string> {
  const headers = resolveHeaders();
  const modelId =
    process.env.CHAT_MODEL_ID ??
    process.env.SUGGESTION_MODEL_ID ??
    process.env.CARD_SUGGESTION_MODEL_ID ??
    process.env.TEXT_MODEL_ID ??
    "google/gemini-3-pro-preview";

  const systemPrompt = [
    "You help create flashcard fronts based on keywords or answers.",
    "Given a keyword or answer (the 'back' of a flashcard), generate a concise front description.",
    "The front should be a question, definition prompt, or description that helps students think about the concept.",
    "Keep it concise (under 100 characters), clear, and educational.",
    "Return only the front text, no JSON, no markdown, no code fences, no explanation.",
  ].join(" ");

  const userPrompt = `Generate a concise flashcard front for this answer/keyword: ${back.trim()}`;

  await ensurePromptIsSafe({
    prompt: [systemPrompt, userPrompt].join("\n---\n"),
    type: "text",
  });

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: modelId,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 150,
    }),
  });

  const rawResponse = await response.text();

  if (!response.ok) {
    let message = `Failed to generate front (${response.status})`;
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
    console.error("OpenRouter API error:", message, "Response:", rawResponse.slice(0, 500));
    throw new Error(message);
  }

  let parsedPayload: unknown = null;
  let parsedOk = false;
  try {
    parsedPayload = JSON.parse(rawResponse) as unknown;
    parsedOk = true;
  } catch {
    parsedPayload = null;
  }

  // Use the same extraction logic as card suggestions
  function extractMessageText(payload: unknown): string {
    if (!payload || typeof payload !== "object") {
      return "";
    }

    const toText = (value: unknown): string => {
      if (typeof value === "string") {
        return value;
      }
      if (Array.isArray(value)) {
        return value
          .map((item) => {
            if (!item) return "";
            if (typeof item === "string") return item;
            if (typeof item === "object" && "text" in item && typeof (item as { text?: unknown }).text === "string") {
              return (item as { text?: string }).text ?? "";
            }
            return "";
          })
          .filter(Boolean)
          .join("\n");
      }
      if (value && typeof value === "object" && "text" in value && typeof (value as { text?: unknown }).text === "string") {
        return (value as { text?: string }).text ?? "";
      }
      return "";
    };

    const root = payload as Record<string, unknown>;

    // Try choices array format (OpenAI-style)
    const choices = root.choices as Array<{ message?: { content?: unknown; reasoning?: unknown } }> | undefined;
    if (choices && choices.length > 0) {
      const message = choices[0]?.message as { content?: unknown; reasoning?: unknown } | undefined;
      if (message) {
        const contentText = toText(message.content);
        if (contentText.trim().length > 0) {
          return contentText;
        }

        const reasoningText = toText(message.reasoning);
        if (reasoningText.trim().length > 0) {
          return reasoningText;
        }
      }
    }

    // Try direct content/text fields
    if (typeof root.content === "string") {
      return root.content;
    }
    if (typeof root.text === "string") {
      return root.text;
    }
    if (typeof (root as { output_text?: unknown }).output_text === "string") {
      return (root as { output_text: string }).output_text;
    }

    // Try candidates array (Gemini-style)
    const candidates = root.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    if (candidates && candidates.length > 0) {
      const candidate = candidates[0];
      if (candidate.content?.parts) {
        return candidate.content.parts
          .map((part) => part.text || "")
          .filter(Boolean)
          .join("\n");
      }
    }

    return "";
  }

  let textContent = "";
  if (parsedPayload) {
    textContent = extractMessageText(parsedPayload);
  }

  if (!textContent && !parsedOk && typeof rawResponse === "string" && rawResponse.trim().length > 0) {
    // Last resort when we cannot parse JSON at all: try raw response
    textContent = rawResponse.trim();
  }

  if (!textContent || textContent.trim().length === 0) {
    console.error("OpenRouter response structure:", JSON.stringify(parsedPayload, null, 2).slice(0, 1000));
    throw new Error("AI response did not include any content. Check server logs for details.");
  }

  // Clean and trim the response
  const cleaned = cleanContent(textContent)
    .replace(/```json|```|`/g, "")
    .trim()
    .slice(0, 400);

  if (!cleaned || cleaned.length < 3) {
    throw new Error("Generated front is too short or invalid.");
  }

  return cleaned;
}
