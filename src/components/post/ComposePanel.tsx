"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { ComposeForm } from "./ComposeForm";

export function ComposePanel() {
  const [isFocused, setIsFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(content: string, title?: string) {
    await apiFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({
        content,
        ...(title ? { title } : {}),
      }),
    });
    window.dispatchEvent(new Event("post-created"));
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-card transition-all duration-300",
        isFocused
          ? "border-primary/40 shadow-[0_0_0_1px_var(--primary)/0.1,0_4px_16px_-4px_var(--primary)/0.08]"
          : "border-border/60 shadow-sm"
      )}
      onFocusCapture={() => setIsFocused(true)}
      onBlurCapture={() => setIsFocused(false)}
    >
      <ComposeForm
        onSubmit={handleSubmit}
        minHeight={80}
        errorText={error}
        onErrorChange={setError}
      />
    </div>
  );
}
