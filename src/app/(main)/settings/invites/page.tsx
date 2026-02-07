"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

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
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">招待コード</h1>
        </div>
      </div>

      <div className="px-4 py-4">
        <p className="text-sm text-muted-foreground">
          友人を My Opinion に招待しましょう。招待コードを共有してください。
        </p>
      </div>

      {codes.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          招待コードがありません
        </div>
      ) : (
        <div className="divide-y">
          {codes.map((code) => {
            const isUsed = !!code.used_by;
            const isExpired = new Date(code.expires_at) < new Date();
            return (
              <div
                key={code.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div>
                  <p className={`font-mono text-lg font-semibold ${isUsed || isExpired ? "text-muted-foreground line-through" : ""}`}>
                    {code.code}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isUsed
                      ? `使用済み (${formatDate(code.used_at!)})`
                      : isExpired
                        ? "期限切れ"
                        : `有効期限: ${formatDate(code.expires_at)}`}
                  </p>
                </div>
                {!isUsed && !isExpired && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(code.code, code.id)}
                  >
                    {copiedId === code.id ? (
                      <Check className="h-4 w-4 text-green-600" />
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
