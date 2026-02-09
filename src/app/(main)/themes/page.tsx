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
        <h1 className="text-lg font-bold">トピック</h1>
      </div>

      {themes.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="トピックがまだありません"
          description="運営がトピックを作成するまでお待ちください。"
        />
      ) : (
        <div className="divide-y">
          {themes.map((theme) => (
            <Link
              key={theme.id}
              href={`/themes/${theme.id}`}
              className="block px-4 py-4 transition-colors hover:bg-accent/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{theme.title}</h2>
                    {theme.status === "active" ? (
                      <span className="rounded-full bg-emerald-50/80 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400">
                        投稿受付中
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        終了
                      </span>
                    )}
                  </div>
                  {theme.description && (
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {theme.description}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-muted-foreground/70">
                    {theme.postCount} 件の投稿
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
