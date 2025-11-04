"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { runJoinSchema } from "@/lib/validators";

const schema = runJoinSchema.extend({
  code: runJoinSchema.shape.code.transform((value) => value.toUpperCase()),
});

type FormInput = z.input<typeof schema>;

export function JoinForm() {
  const router = useRouter();
  const form = useForm<FormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: "",
      nickname: "",
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (values: FormInput) => {
    setIsSubmitting(true);
    const parsed = schema.parse(values);
    const response = await fetch("/api/run/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });

    setIsSubmitting(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error ?? "Unable to join run.");
      return;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;
    toast.success(`Joined ${data.deck?.title ?? "run"}.`);
    router.push(`/play/${data.runId}?playerId=${data.playerId}`);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="join-form"
      >
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Session code</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="ABC123"
                  maxLength={12}
                  onChange={(event) => field.onChange(event.target.value.toUpperCase())}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nickname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nickname (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Your name" maxLength={32} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Joining…" : "Join session"}
        </Button>
      </form>
    </Form>
  );
}
