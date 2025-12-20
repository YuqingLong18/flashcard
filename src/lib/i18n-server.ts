import { cookies } from "next/headers";

import { DEFAULT_LANGUAGE, LANGUAGE_COOKIE_NAME, resolveLanguage, type Language } from "./i18n";

export function getRequestLanguage(): Language {
  try {
    const store = cookies();
    const cookieValue = store.get(LANGUAGE_COOKIE_NAME)?.value;
    return resolveLanguage(cookieValue);
  } catch {
    return DEFAULT_LANGUAGE;
  }
}
