"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MAX_LENGTH = 200;

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (content: string) => void;
  replyTo?: { id: string; author: string };
}

export function ComposeModal({
  open,
  onOpenChange,
  onSubmit,
  replyTo,
}: ComposeModalProps) {
  const [content, setContent] = useState("");
  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;

  function handleSubmit() {
    if (isEmpty || isOverLimit) return;
    onSubmit?.(content.trim());
    setContent("");
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {replyTo ? `@${replyTo.author} に返信` : "新しい投稿"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            placeholder={
              replyTo ? "返信を入力..." : "いま何を考えていますか？"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-sm ${
                isOverLimit
                  ? "text-destructive font-medium"
                  : remaining <= 20
                    ? "text-amber-600"
                    : "text-muted-foreground"
              }`}
            >
              {remaining}
            </span>
            <Button
              onClick={handleSubmit}
              disabled={isEmpty || isOverLimit}
            >
              {replyTo ? "返信する" : "投稿する"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
