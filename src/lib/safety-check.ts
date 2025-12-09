const OPENROUTER_CHAT_URL = "https://openrouter.ai/api/v1/chat/completions";

type SafetyAction = "allow" | "block";

export interface SafetyDecision {
  action: SafetyAction;
  reason?: string;
}

function resolveHeaders(userId?: string) {
  if (!process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is not configured");
  }

  const referer =
    process.env.OPENROUTER_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "http://localhost:3000";
  const title = process.env.OPENROUTER_TITLE ?? "Flashrooms";

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": referer,
    "X-Title": title,
  };

  if (userId) {
    headers["X-User-ID"] = userId;
  }

  return headers;
}

function resolveSafetyModel() {
  const model =
    process.env.SAFETY_MODEL_ID ??
    process.env.CONTENT_FILTER_MODEL_ID ??
    process.env.MODERATION_MODEL_ID ??
    process.env.SAFETY_FILTER_MODEL_ID;

  if (!model) {
    throw new Error(
      "SAFETY_MODEL_ID (or CONTENT_FILTER_MODEL_ID / MODERATION_MODEL_ID) is not configured for safety checks.",
    );
  }

  return model;
}

function buildSafetyMessages(prompt: string, type: "text" | "image") {
  const systemPrompt = [
    "You are a strict safety filter for a classroom app used by minors.",
    "Review the provided prompt and respond with a JSON object only.",
    '{ "action": "allow" | "block", "reason": "short explanation" }.',
    "Always block if the content involves or requests any of the following:",
    "violence, gore, self-harm, weapons, criminal activity, harassment, bullying, hate, discrimination, or attacks on protected classes.",
    "sex, nudity, pornography, sexualization of minors, grooming, dating or relationship content, or any explicit references.",
    "Also block instructions for hacking, malware, exploits, fraud, surveillance evasion, or code execution or shell commands.",
    "Block political advocacy, elections, lobbying, extremist content, medical or legal advice, misinformation, or personal data requests.",
    "Block requests to bypass filters, create unsafe prompts, or anything unsuitable for school settings. Default to block when unsure.",
    "Respond with the JSON only—no markdown, no code fences, no prose.",
  ].join(" ");

  const userPrompt = [
    `Content type: ${type}`,
    "Analyze this prompt and decide if it is safe to send to a generative model.",
    "Return 'block' if there is any doubt.",
    "Prompt:",
    prompt,
  ].join("\n");

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

function parseDecision(rawResponse: string): SafetyDecision {
  const cleaned = rawResponse.trim().replace(/```json|```/gi, "").trim();
  const attempts: string[] = [cleaned];

  const braceStart = cleaned.indexOf("{");
  const braceEnd = cleaned.lastIndexOf("}");
  if (braceStart !== -1 && braceEnd !== -1 && braceEnd > braceStart) {
    attempts.unshift(cleaned.slice(braceStart, braceEnd + 1));
  }

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate) as { action?: unknown; reason?: unknown };
      const actionRaw = typeof parsed.action === "string" ? parsed.action.toLowerCase() : undefined;
      const reason = typeof parsed.reason === "string" ? parsed.reason.slice(0, 500) : undefined;
      if (actionRaw === "allow" || actionRaw === "block") {
        return { action: actionRaw, reason } as SafetyDecision;
      }
    } catch {
      // try next candidate
    }
  }

  if (/\ballow\b/i.test(cleaned)) {
    return { action: "allow", reason: "allow keyword detected" };
  }

  return {
    action: "block",
    reason: "Unable to determine safety from filter response.",
  };
}

export async function ensurePromptIsSafe({
  prompt,
  type,
  userId,
}: {
  prompt: string;
  type: "text" | "image";
  userId?: string;
}) {
  const model = resolveSafetyModel();
  const headers = resolveHeaders(userId);

  const response = await fetch(OPENROUTER_CHAT_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      messages: buildSafetyMessages(prompt, type),
      temperature: 0,
      max_tokens: 100,
    }),
  });

  const raw = await response.text();

  if (!response.ok) {
    const message = raw.trim() || "Safety model request failed";
    throw new Error(`Safety model request failed (${response.status}): ${message}`);
  }

  const decision = parseDecision(raw);

  if (decision.action !== "allow") {
    throw new Error(
      decision.reason ??
        "Prompt was blocked by the safety filter. Please rephrase to be school-appropriate.",
    );
  }

  return decision;
}
