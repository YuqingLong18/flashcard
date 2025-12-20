import Link from "next/link";
import { redirect } from "next/navigation";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { createTranslator } from "@/lib/i18n";
import { getRequestLanguage } from "@/lib/i18n-server";
import { getCurrentSession } from "@/lib/auth";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentSession();
  const language = getRequestLanguage();
  const t = createTranslator(language);

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-neutral-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-lg font-semibold">
              Flashrooms
            </Link>
            <Badge variant="secondary">{t("teacher.badge")}</Badge>
          </div>
          <nav className="flex items-center gap-6 text-sm text-neutral-600">
            <Link href="/dashboard" className="hover:text-neutral-900">
              {t("teacher.nav.dashboard")}
            </Link>
            <Link href="/join" className="hover:text-neutral-900">
              {t("teacher.nav.join")}
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1 bg-neutral-50">{children}</main>
    </div>
  );
}
