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
    <div className="min-h-screen bg-background">
      {/* Mobile header */}
      <Header />

      {/* Centered 3-column layout */}
      <div className="lg:flex lg:justify-center">
        {/* Left sidebar */}
        <div className="hidden lg:block w-[240px] shrink-0">
          <Sidebar />
        </div>

        {/* Center content */}
        <main className="min-h-screen pb-20 lg:w-[640px] lg:shrink-0 lg:border-x lg:pb-0">
          {children}
        </main>

        {/* Right panel */}
        <div className="hidden xl:block w-[320px] shrink-0">
          <div className="sticky top-0 h-screen overflow-y-auto px-4 pt-4 space-y-4">
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

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  );
}
