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
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle } from "lucide-react";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

const REPORT_REASONS = [
  { value: "attribute_discrimination", label: "プロフィール差別" },
  { value: "defamation", label: "誹謗中傷" },
  { value: "fake_attribute", label: "偽りのプロフィール" },
  { value: "impersonation", label: "なりすまし" },
  { value: "spam", label: "スパム" },
  { value: "other", label: "その他" },
] as const;

type ReportReason = (typeof REPORT_REASONS)[number]["value"];

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: "post" | "user";
  targetId: string;
}

export function ReportModal({
  open,
  onOpenChange,
  targetType,
  targetId,
}: ReportModalProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [detail, setDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit() {
    if (!reason) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/reports", {
        method: "POST",
        body: JSON.stringify({
          targetType,
          targetId,
          reason,
          detail: detail || null,
        }),
      });
      setSubmitted(true);
    } catch {
      // handle error
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    onOpenChange(false);
    setTimeout(() => {
      setReason(null);
      setDetail("");
      setSubmitted(false);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {targetType === "post" ? "意見を通報" : "ユーザーを通報"}
          </DialogTitle>
        </DialogHeader>

        {submitted ? (
          <div className="space-y-4 py-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm font-medium">
              通報を受け付けました。ご協力ありがとうございます。
            </p>
            <p className="text-xs text-muted-foreground">
              内容を確認し、必要に応じて対応いたします。
            </p>
            <Button onClick={handleClose} variant="outline" className="w-full">
              閉じる
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">通報理由</Label>
              <div className="grid grid-cols-2 gap-2">
                {REPORT_REASONS.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setReason(r.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2.5 text-sm transition-all",
                      reason === r.value
                        ? "border-primary bg-primary/10 font-medium text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detail" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">詳細（任意）</Label>
              <Textarea
                id="detail"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="具体的な内容を記入してください"
                className="resize-none"
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1"
              >
                キャンセル
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!reason || submitting}
                className="flex-1"
              >
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                通報する
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
