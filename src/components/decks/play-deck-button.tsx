"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Props {
  deckId: string;
  disabled?: boolean;
}

export function PlayDeckButton({ deckId, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const launchRun = async () => {
    setIsLoading(true);
    const response = await fetch(`/api/decks/${deckId}/run`, {
      method: "POST",
    });
    setIsLoading(false);

    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      toast.error(payload?.error ?? "Unable to start run.");
      return;
    }

    const payload = await response.json();
    const data = payload.data ?? payload;
    setCode(data.code);
    setExpiresAt(data.expiresAt);
    setOpen(true);
    toast.success("Session is live. Share the code with students.");
  };

  return (
    <>
      <Button
        size="sm"
        className="bg-neutral-900 text-white hover:bg-neutral-800"
        disabled={disabled || isLoading}
        onClick={launchRun}
      >
        {isLoading ? "Starting…" : "Play deck"}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Session code</DialogTitle>
            <DialogDescription>
              Ask students to visit <strong>join.flashrooms.app</strong> (your
              domain) and enter this code.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-100 px-6 py-8 text-center">
              <p className="text-sm uppercase tracking-wide text-neutral-500">
                Share this code
              </p>
              <p className="mt-4 font-mono text-4xl font-semibold tracking-[0.4rem] text-neutral-900">
                {code}
              </p>
            </div>
            {expiresAt && (
              <p className="text-sm text-neutral-500">
                Expires {format(new Date(expiresAt), "MMM d, h:mm a")}
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
