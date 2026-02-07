"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { apiFetch } from "@/lib/api/client";

interface ThemeItem {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "ended";
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<ThemeItem[]>("/api/themes")
      .then(setThemes)
      .catch(() => setThemes([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
        <h1 className="text-lg font-bold">テーマ</h1>
      </div>

      {themes.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="テーマがまだありません"
          description="運営がテーマを作成するまでお待ちください。"
        />
      ) : (
        <div className="divide-y">
          {themes.map((theme) => (
            <Link
              key={theme.id}
              href={`/themes/${theme.id}`}
              className="block px-4 py-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold">{theme.title}</h2>
                  {theme.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {theme.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{theme.postCount} 件の投稿</span>
                    {theme.status === "ended" && (
                      <span className="rounded bg-muted px-2 py-0.5">終了</span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
