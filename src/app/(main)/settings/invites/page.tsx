"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Copy, Check, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface InviteCode {
  id: string;
  code: string;
  used_by: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InvitesPage() {
  const router = useRouter();
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<InviteCode[]>("/api/invite/my-codes")
      .then(setCodes)
      .catch(() => setCodes([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleCopy(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-40 border-b bg-background/80 backdrop-blur-lg lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">招待コード</h1>
        </div>
      </div>

      <div className="px-4 py-6">
        <div className="flex items-start gap-3 rounded-xl border bg-card p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Ticket className="h-4.5 w-4.5 text-primary" />
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            友人を My Opinion に招待しましょう。招待コードを共有してください。
          </p>
        </div>
      </div>

      {codes.length === 0 ? (
        <div className="px-4 py-12 text-center text-sm text-muted-foreground">
          招待コードがありません
        </div>
      ) : (
        <div className="space-y-2 px-4 pb-8">
          {codes.map((code) => {
            const isUsed = !!code.used_by;
            const isExpired = new Date(code.expires_at) < new Date();
            const isInactive = isUsed || isExpired;
            return (
              <div
                key={code.id}
                className={cn(
                  "flex items-center justify-between rounded-xl border p-4 transition-colors",
                  isInactive ? "bg-muted/50" : "bg-card"
                )}
              >
                <div>
                  <p
                    className={cn(
                      "font-mono text-lg font-semibold tracking-wide",
                      isInactive && "text-muted-foreground line-through"
                    )}
                  >
                    {code.code}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {isUsed
                      ? `使用済み (${formatDate(code.used_at!)})`
                      : isExpired
                        ? "期限切れ"
                        : `有効期限: ${formatDate(code.expires_at)}`}
                  </p>
                </div>
                {!isInactive && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => handleCopy(code.code, code.id)}
                  >
                    {copiedId === code.id ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
