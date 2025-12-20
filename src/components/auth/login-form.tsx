"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useTranslations } from "@/components/providers/language-provider";

type FormSchema = {
  username: string;
  password: string;
};

export function LoginForm() {
  const router = useRouter();
  const t = useTranslations();
  const schema = useMemo(
    () =>
      z.object({
        username: z.string().min(1, t("login.form.validation.username")),
        password: z.string().min(1, t("login.form.validation.password")),
      }),
    [t],
  );
  const form = useForm<FormSchema>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (values: FormSchema) => {
    setIsLoading(true);
    const result = await signIn("credentials", {
      redirect: false,
      username: values.username,
      password: values.password,
    });

    setIsLoading(false);

    if (result?.error) {
      toast.error(t("login.form.toastError"));
      return;
    }

    toast.success(t("login.form.toastSuccess"));
    router.replace("/dashboard");
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        data-testid="login-form"
      >
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.form.usernameLabel")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="text"
                  placeholder={t("login.form.usernamePlaceholder")}
                  autoComplete="username"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("login.form.passwordLabel")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="password"
                  placeholder={t("login.form.passwordPlaceholder")}
                  autoComplete="current-password"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? t("login.form.submitting") : t("login.form.submit")}
        </Button>
      </form>
    </Form>
  );
}
