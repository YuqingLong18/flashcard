import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createTranslator } from "@/lib/i18n";
import { getRequestLanguage } from "@/lib/i18n-server";
import { getCurrentSession } from "@/lib/auth";

export default async function LoginPage() {
  const session = await getCurrentSession();
  const language = getRequestLanguage();
  const t = createTranslator(language);

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">
              {t("login.page.title")}
            </CardTitle>
            <p className="text-sm text-neutral-500">
              {t("login.page.subtitle")}
            </p>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-6 text-sm text-neutral-500">
              {t("login.page.notice")}
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
