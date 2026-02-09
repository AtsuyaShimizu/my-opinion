"use client";

import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface PositionMapMiniProps {
  axes: { themeTitle: string; score: number }[];
  echoChamberScore: number | null;
}

function getScoreColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-destructive";
}

export function PositionMapMini({ axes, echoChamberScore }: PositionMapMiniProps) {
  const chartData = axes.map((a) => ({
    subject: a.themeTitle,
    score: a.score,
    fullMark: 100,
  }));

  const hasData = axes.length >= 3;

  return (
    <Link
      href="/settings/echo-chamber"
      className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/50 hover:shadow-md"
    >
      <div className="h-[120px] w-[120px] shrink-0">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="var(--border)" />
              <Radar
                dataKey="score"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="var(--primary)"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-lg bg-muted/50">
            <span className="text-xs text-muted-foreground">--</span>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold">わたしの立ち位置</p>
        {echoChamberScore !== null && (
          <p className={cn("text-2xl font-bold tracking-tight", getScoreColor(echoChamberScore))}>
            {echoChamberScore}
          </p>
        )}
        <p className="mt-0.5 text-[11px] text-primary">もっと詳しく &rarr;</p>
      </div>
    </Link>
  );
}
