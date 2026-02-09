"use client";

import Link from "next/link";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";

interface PositionMapProps {
  axes: {
    themeTitle: string;
    score: number;
  }[];
  echoChamberScore: number | null;
  echoChamberMessage: string;
}

function getEchoColor(score: number | null) {
  if (score === null) return "text-muted-foreground";
  if (score >= 70) return "text-emerald-500";
  if (score >= 40) return "text-amber-500";
  return "text-destructive";
}

function getEchoLabel(score: number | null) {
  if (score === null) return "";
  if (score >= 70) return "幅ひろい";
  if (score >= 40) return "やや偏りがち";
  return "偏りがち";
}

export function PositionMap({ axes, echoChamberScore, echoChamberMessage }: PositionMapProps) {
  const chartData = axes.map((a) => ({
    subject: a.themeTitle.length > 8 ? a.themeTitle.slice(0, 8) + "..." : a.themeTitle,
    score: a.score,
    fullMark: 100,
  }));

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        わたしの立ち位置
      </p>

      {axes.length >= 3 ? (
        <div className="mt-3 animate-radar-expand">
          <ResponsiveContainer width="100%" height={250} className="lg:!h-[280px]">
            <RadarChart data={chartData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis
                dataKey="subject"
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <Radar
                dataKey="score"
                stroke="var(--primary)"
                strokeWidth={2}
                fill="var(--primary)"
                fillOpacity={0.2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="mt-3 flex h-[200px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            3つ以上のトピックに参加すると表示されます
          </p>
        </div>
      )}

      {echoChamberScore !== null && (
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">視野スコア</span>
            <span className={cn("text-lg font-bold", getEchoColor(echoChamberScore))}>
              {echoChamberScore}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700 ease-out",
                echoChamberScore >= 70
                  ? "bg-emerald-500"
                  : echoChamberScore >= 40
                    ? "bg-amber-500"
                    : "bg-destructive"
              )}
              style={{ width: `${echoChamberScore}%` }}
            />
          </div>
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>偏りがち</span>
            <span className={cn("font-medium", getEchoColor(echoChamberScore))}>
              {getEchoLabel(echoChamberScore)}
            </span>
            <span>幅ひろい</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">{echoChamberMessage}</p>
          <Link href="/settings/echo-chamber" className="mt-1 block text-xs text-primary hover:underline">
            もっと詳しく &rarr;
          </Link>
        </div>
      )}
    </div>
  );
}
