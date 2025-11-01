import type { Metadata } from "next";

import { AuthProvider } from "@/components/providers/auth-provider";
import { Toaster } from "@/components/ui/sonner";
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

  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-neutral-50 text-neutral-900 antialiased font-sans",
        )}
      >
        <AuthProvider session={session}>
          <div className="flex min-h-screen flex-col">{children}</div>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
