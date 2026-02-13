"use client";

import { useState, useEffect } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { ComposePanel } from "../post/ComposePanel";
import { PositionMapMini } from "../user/PositionMapMini";
import { apiFetch } from "@/lib/api/client";

interface PositionData {
  axes: { themeTitle: string; score: number }[];
  echoChamberScore: number | null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [positionData, setPositionData] = useState<PositionData | null>(null);

  useEffect(() => {
    apiFetch<PositionData>("/api/users/me/position-map")
      .then(setPositionData)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,var(--primary)/0.08,transparent_35%),radial-gradient(circle_at_90%_10%,var(--consensus-low)/0.08,transparent_40%),var(--background)]">
      <Header />

      <div className="mx-auto lg:flex lg:max-w-[1380px] lg:justify-center lg:gap-4 lg:px-4">
        <div className="hidden w-[264px] shrink-0 lg:block">
          <Sidebar />
        </div>

        <main className="min-h-screen pb-20 lg:w-[720px] lg:shrink-0 lg:pb-0">
          {children}
        </main>

        <div className="hidden w-[340px] shrink-0 xl:block">
          <div className="sticky top-0 h-screen space-y-3 overflow-y-auto px-2 pb-4 pt-4">
            <div className="rounded-xl border border-border/70 bg-card/80 p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                観測メモ
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                トピックの一致度と、あなたの立ち位置を見比べながら意見を投稿してみましょう。
              </p>
            </div>
            {positionData && (
              <PositionMapMini
                axes={positionData.axes}
                echoChamberScore={positionData.echoChamberScore}
              />
            )}
            <ComposePanel />
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
