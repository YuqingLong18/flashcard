import type { Metadata } from "next";

import { AuthProvider } from "@/components/providers/auth-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { LanguageToggle } from "@/components/language-toggle";
import { Toaster } from "@/components/ui/sonner";
import { getRequestLanguage } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";
import { getCurrentSession } from "@/lib/auth";

import "./globals.css";

export const metadata: Metadata = {
  title: "Flashrooms | Adaptive Flashcards",
  description:
    "Build adaptive flashcard decks and run live classroom sessions with instant feedback.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();
  const language = getRequestLanguage();

  return (
    <html lang={language}>
      <body
        className={cn(
          "min-h-screen bg-neutral-50 text-neutral-900 antialiased font-sans",
        )}
      >
        <LanguageProvider initialLanguage={language}>
          <LanguageToggle />
          <AuthProvider session={session}>
            <div className="flex min-h-screen flex-col">{children}</div>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
