"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Share2, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { apiFetch } from "@/lib/api/client";

interface AnalysisData {
  available: boolean;
  totalReactions: number;
  goodBadRatio?: {
    good: number;
    bad: number;
    goodRate: number;
    badRate: number;
  };
}

export default function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    apiFetch<AnalysisData>(`/api/posts/${id}/analysis`)
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/posts/${id}`
    : "";

  function handleShareX() {
    if (!data?.goodBadRatio) return;
    const text = `My Opinionでの投稿分析結果: Good ${data.goodBadRatio.goodRate}% / Bad ${data.goodBadRatio.badRate}% (${data.totalReactions}件の評価)`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data?.available) {
    return (
      <EmptyState
        title="シェアできません"
        description="分析データが不足しています。"
      />
    );
  }

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">分析結果をシェア</h1>
        </div>
      </div>

      <div className="space-y-6 px-4 py-6">
        {/* Analysis Summary Card */}
        <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="text-center">
            <p className="text-sm font-medium text-muted-foreground">
              My Opinion 分析レポート
            </p>
            <div className="mt-4 flex items-center justify-center gap-8">
              <div>
                <p className="text-3xl font-bold text-blue-600">
                  {data.goodBadRatio!.goodRate}%
                </p>
                <p className="text-sm text-muted-foreground">Good</p>
              </div>
              <div className="h-12 w-px bg-border" />
              <div>
                <p className="text-3xl font-bold text-red-500">
                  {data.goodBadRatio!.badRate}%
                </p>
                <p className="text-sm text-muted-foreground">Bad</p>
              </div>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              {data.totalReactions} 件の評価に基づく
            </p>
          </div>
        </div>

        {/* Share Buttons */}
        <div className="space-y-3">
          <Button onClick={handleShareX} className="w-full gap-2">
            <Share2 className="h-4 w-4" />
            X (Twitter) でシェア
          </Button>
          <Button
            variant="outline"
            onClick={handleCopyLink}
            className="w-full gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "コピーしました" : "リンクをコピー"}
          </Button>
        </div>
      </div>
    </div>
  );
}
