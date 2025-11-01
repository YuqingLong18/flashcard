export function buildImagePrompt(front: string, back?: string) {
  const trimmedFront = front.trim().slice(0, 150);
  const trimmedBack = back?.trim().slice(0, 80);
  const promptLines = [
    "Educational flashcard illustration.",
    `Concept: ${trimmedFront}`,
  ];

  if (trimmedBack) {
    promptLines.push(`Context: ${trimmedBack}`);
  }

  promptLines.push(
    "Style: Minimal, school safe, high contrast, flat illustration, pastel background.",
  );
  return promptLines.join(" ");
}
