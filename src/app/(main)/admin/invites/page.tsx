"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";

interface GeneratedCode {
  id: string;
  code: string;
  expires_at: string;
  created_at: string;
}

export default function AdminInvitesPage() {
  const router = useRouter();
  const [count, setCount] = useState("5");
  const [generating, setGenerating] = useState(false);
  const [codes, setCodes] = useState<GeneratedCode[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    try {
      const data = await apiFetch<GeneratedCode[]>("/api/admin/invite/generate", {
        method: "POST",
        body: JSON.stringify({ count: parseInt(count, 10) || 5 }),
      });
      setCodes(data);
    } catch {
      // handle error
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy(code: string, id: string) {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleCopyAll() {
    const allCodes = codes.map((c) => c.code).join("\n");
    await navigator.clipboard.writeText(allCodes);
    setCopiedId("all");
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">招待コード管理</h1>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6">
        <div className="space-y-3">
          <Label htmlFor="count">生成する枚数</Label>
          <div className="flex gap-2">
            <Input
              id="count"
              type="number"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-24"
            />
            <Button onClick={handleGenerate} disabled={generating}>
              {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              生成
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            1〜100枚まで一括生成できます。有効期限は30日間です。
          </p>
        </div>

        {codes.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-semibold">
                生成されたコード ({codes.length}枚)
              </h2>
              <Button variant="outline" size="sm" onClick={handleCopyAll}>
                {copiedId === "all" ? (
                  <Check className="mr-1 h-3 w-3 text-primary" />
                ) : (
                  <Copy className="mr-1 h-3 w-3" />
                )}
                すべてコピー
              </Button>
            </div>
            <div className="divide-y rounded-lg border">
              {codes.map((code) => (
                <div
                  key={code.id}
                  className="flex items-center justify-between px-4 py-2"
                >
                  <span className="font-mono text-sm font-semibold">
                    {code.code}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(code.code, code.id)}
                  >
                    {copiedId === code.id ? (
                      <Check className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
