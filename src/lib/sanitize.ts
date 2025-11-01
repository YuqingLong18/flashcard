export function stripHtml(input: string) {
  return input.replace(/<[^>]*>/g, "");
}

export function normalizeWhitespace(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function cleanContent(input: string) {
  return normalizeWhitespace(stripHtml(input));
}
