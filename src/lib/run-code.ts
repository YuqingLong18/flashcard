import { randomBytes } from "node:crypto";

const CROCKFORD_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateRunCode(length = Number(process.env.RUN_CODE_LENGTH ?? 6)) {
  const bytes = randomBytes(length);
  const chars: string[] = [];

  for (let i = 0; i < length; i += 1) {
    const index = bytes[i] % CROCKFORD_ALPHABET.length;
    chars.push(CROCKFORD_ALPHABET[index]);
  }

  return chars.join("");
}
