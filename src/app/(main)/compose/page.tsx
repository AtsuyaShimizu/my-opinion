"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Check } from "lucide-react";
import { apiFetch } from "@/lib/api/client";

const MAX_LENGTH = 200;

export default function ComposePage() {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;

  async function handleSubmit() {
    if (isEmpty || isOverLimit) return;
    setError(null);
    setIsSubmitting(true);

    try {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content: content.trim() }),
      });
      setShowSuccess(true);
      setTimeout(() => router.push("/home"), 800);
    } catch {
      setError("投稿に失敗しました");
      setIsSubmitting(false);
    }
  }

  if (showSuccess) {
    return (
      <div className="flex justify-center py-24">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 animate-success-pop">
          <Check className="h-8 w-8 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-6 animate-fade-in-up">
      <h1 className="text-xl font-bold">新しい投稿</h1>

      <div className="mt-4 space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Textarea
          placeholder="いま何を考えていますか？"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="min-h-[150px] resize-none"
          autoFocus
        />

        <div className="flex items-center justify-between">
          <span
            className={`text-sm ${
              isOverLimit
                ? "text-destructive font-medium"
                : remaining <= 20
                  ? "text-destructive/70"
                  : "text-muted-foreground"
            }`}
          >
            {remaining}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
            >
              キャンセル
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isEmpty || isOverLimit || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              投稿する
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
