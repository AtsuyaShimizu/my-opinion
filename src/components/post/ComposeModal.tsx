"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ComposeForm } from "./ComposeForm";

interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (content: string, title?: string, themeId?: string) => void | Promise<void>;
  replyTo?: { id: string; author: string };
  defaultThemeId?: string;
  defaultThemeName?: string;
}

export function ComposeModal({
  open,
  onOpenChange,
  onSubmit,
  replyTo,
  defaultThemeId,
  defaultThemeName,
}: ComposeModalProps) {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setShowSuccess(false);
    }
  }, [open]);

  async function handleSubmit(content: string, title?: string) {
    try {
      await onSubmit?.(content, title, defaultThemeId);
    } catch {
      toast.error("投稿に失敗しました");
      throw new Error("submit failed");
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!showSuccess) onOpenChange(v); }}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg sm:rounded-2xl" showCloseButton={!showSuccess}>
        <ComposeForm
          onSubmit={handleSubmit}
          replyTo={replyTo}
          defaultThemeName={defaultThemeName}
          autoFocus={open}
          minHeight={100}
          onSuccess={() => {
            setShowSuccess(true);
            setTimeout(() => {
              setShowSuccess(false);
              onOpenChange(false);
            }, 800);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
