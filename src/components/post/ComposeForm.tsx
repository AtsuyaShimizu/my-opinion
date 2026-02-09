"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Loader2, Send, CornerDownLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_LENGTH = 200;
const TITLE_MAX_LENGTH = 60;

export interface ComposeFormProps {
  onSubmit: (content: string, title?: string) => void | Promise<void>;
  /** If set, shows reply header instead of title input */
  replyTo?: { id: string; author: string };
  /** Theme badge to display */
  defaultThemeName?: string;
  /** Called on success after submit */
  onSuccess?: () => void;
  /** Auto-focus the textarea */
  autoFocus?: boolean;
  /** Minimum textarea height (px) */
  minHeight?: number;
  /** Submit button label (defaults to "送信" or "返信" for replies) */
  submitLabel?: string;
  /** Custom placeholder text */
  placeholder?: string;
  /** Show inline error text instead of toast (for embedded panels) */
  errorText?: string | null;
  onErrorChange?: (error: string | null) => void;
}

export function ComposeForm({
  onSubmit,
  replyTo,
  defaultThemeName,
  onSuccess,
  autoFocus = false,
  minHeight = 100,
  submitLabel,
  placeholder,
  errorText,
  onErrorChange,
}: ComposeFormProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const remaining = MAX_LENGTH - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = content.trim().length === 0;
  const progress = Math.min(content.length / MAX_LENGTH, 1);

  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [autoFocus]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.max(el.scrollHeight, minHeight) + "px";
    }
  }, [content, minHeight]);

  async function handleSubmit() {
    if (isEmpty || isOverLimit || isSubmitting) return;
    onErrorChange?.(null);
    setIsSubmitting(true);
    try {
      const trimmedTitle = title.trim() || undefined;
      await onSubmit(content.trim(), trimmedTitle);
      setContent("");
      setTitle("");
      setShowSuccess(true);
      onSuccess?.();
    } catch {
      onErrorChange?.("投稿に失敗しました");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  }

  const circumference = 2 * Math.PI * 14;
  const strokeDashoffset = circumference * (1 - progress);

  const defaultPlaceholder = replyTo
    ? "返信を入力..."
    : defaultThemeName
      ? "この話題について、あなたはどう思いますか？"
      : "あなたの考えを聞かせてください";

  if (showSuccess) {
    return (
      <div className="flex flex-col items-center py-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 animate-success-pop">
          <Check className="h-7 w-7 text-primary" />
        </div>
        <p className="mt-3 text-sm font-medium text-muted-foreground">
          {replyTo ? "返信しました" : "意見を投稿しました"}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Top accent line */}
      <div
        className="h-[2px] bg-gradient-to-r from-primary/60 via-primary to-primary/60 transition-opacity duration-300"
        style={{ opacity: isFocused ? 1 : 0.3 }}
      />

      {/* Header */}
      <div className="px-5 pt-5 pb-2">
        {replyTo ? (
          <div className="flex items-center gap-2">
            <CornerDownLeft className="h-4 w-4 text-primary/70" />
            <p className="text-sm">
              <span className="text-muted-foreground">返信先: </span>
              <span className="font-semibold text-primary">@{replyTo.author}</span>
            </p>
          </div>
        ) : (
          <h3 className="text-base font-semibold">あなたの意見</h3>
        )}
        {defaultThemeName && (
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            # {defaultThemeName}
          </div>
        )}
      </div>

      {/* Title input (not shown for replies) */}
      {!replyTo && (
        <div className="px-5 pb-0">
          <input
            type="text"
            placeholder="タイトル（任意）"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX_LENGTH}
            className={cn(
              "w-full bg-transparent text-base font-bold",
              "placeholder:text-muted-foreground/40",
              "focus:outline-none",
              "border-b border-border/40 pb-2"
            )}
          />
          {title.length > 0 && (
            <>
              <div className="mt-1 text-right text-[11px] text-muted-foreground/60">
                {title.length}/{TITLE_MAX_LENGTH}
              </div>
              <p className="mt-1 text-[11px] text-muted-foreground/50">
                タイトルを入力するとトピック投稿になります
              </p>
            </>
          )}
        </div>
      )}

      {/* Textarea */}
      <div className="px-5 pb-2">
        <textarea
          ref={textareaRef}
          aria-label="投稿内容"
          placeholder={placeholder ?? defaultPlaceholder}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          rows={1}
          className={cn(
            "w-full resize-none bg-transparent text-sm leading-relaxed",
            "placeholder:text-muted-foreground/50",
            "focus:outline-none"
          )}
          style={{ minHeight: `${minHeight}px` }}
        />
      </div>

      {errorText && (
        <p className="px-5 text-xs text-destructive">{errorText}</p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative h-8 w-8">
            <svg className="h-8 w-8 -rotate-90" viewBox="0 0 32 32">
              <circle cx="16" cy="16" r="14" fill="none" stroke="currentColor" className="text-border" strokeWidth="2" />
              <circle
                cx="16" cy="16" r="14" fill="none" stroke="currentColor"
                className={cn(
                  "transition-all duration-300",
                  isOverLimit ? "text-destructive" : remaining <= 20 ? "text-amber-500" : "text-primary"
                )}
                strokeWidth="2" strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
              />
            </svg>
            {remaining <= 20 && (
              <span className={cn(
                "absolute inset-0 flex items-center justify-center text-[10px] font-bold",
                isOverLimit ? "text-destructive" : "text-amber-500"
              )}>
                {remaining}
              </span>
            )}
          </div>
          <span className="text-[11px] text-muted-foreground/60">
            {typeof navigator !== "undefined" && /Mac/i.test(navigator.userAgent) ? "⌘" : "Ctrl"} + Enter
          </span>
        </div>

        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit || isSubmitting}
          className={cn(
            "rounded-full px-5 transition-all duration-200",
            !isEmpty && !isOverLimit && !isSubmitting ? "shadow-[0_2px_8px_-2px_var(--primary)/0.3]" : ""
          )}
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Send className="mr-1.5 h-3.5 w-3.5" />
              {submitLabel ?? (replyTo ? "返信" : "送信")}
            </>
          )}
        </Button>
      </div>
    </>
  );
}
