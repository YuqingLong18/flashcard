"use client";

import { signOut } from "next-auth/react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/providers/language-provider";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => startTransition(() => signOut({ callbackUrl: "/" }))}
      disabled={isPending}
    >
      {isPending ? t("auth.signingOut") : t("auth.signOut")}
    </Button>
  );
}
