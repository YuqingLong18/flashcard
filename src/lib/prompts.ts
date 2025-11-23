export function buildImagePrompt(front: string, back?: string) {
  const trimmedFront = front.trim().slice(0, 150);
  const trimmedBack = back?.trim().slice(0, 80);
  const promptLines = [
    "Educational flashcard illustration.",
    `Concept: ${trimmedBack}`,
  ];

  if (trimmedBack) {
    promptLines.push(`Context: ${trimmedFront}`);
  }

  promptLines.push(
    "Style: Minimal, school safe, clear and engaging for educational purposes",
  );
  promptLines.push(
    "Instruction: Do not show any words from the card front or back; provide only an illustrative image that hints at the concept according to the description. The image should closely reflect the description in the context.",
  );
  return promptLines.join(" ");
}
