"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Activity } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { ATTRIBUTE_LABELS_SHORT } from "@/lib/constants";

const SECTION_LABELS: Record<string, string> = {
  gender: "性別",
  age_range: "年齢帯",
  education: "学歴",
  occupation: "職業",
  political_party: "支持政党",
  political_stance: "政治的な立場",
};

const BAR_COLORS = [
  "oklch(0.55 0.08 230)",
  "oklch(0.60 0.07 160)",
  "oklch(0.62 0.08 75)",
  "oklch(0.55 0.08 30)",
  "oklch(0.55 0.07 310)",
  "oklch(0.58 0.06 200)",
  "oklch(0.60 0.06 120)",
  "oklch(0.57 0.07 280)",
];

interface EchoChamberData {
  score: number | null;
  message: string;
  distribution: Record<string, Record<string, number>>;
  followingCount: number;
}

interface PositionData {
  axes: { themeTitle: string; score: number }[];
  echoChamberScore: number | null;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 40) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-emerald-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function getScoreLabel(score: number): string {
  if (score >= 70) return "幅ひろい";
  if (score >= 40) return "やや偏りがち";
  return "偏りがち";
}

export default function EchoChamberPage() {
  const router = useRouter();
  const [data, setData] = useState<EchoChamberData | null>(null);
  const [positionData, setPositionData] = useState<PositionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<EchoChamberData>("/api/users/me/echo-chamber")
        .then(setData)
        .catch(() => {}),
      apiFetch<PositionData>("/api/users/me/position-map")
        .then(setPositionData)
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const radarData =
    positionData?.axes.map((a) => ({
      subject:
        a.themeTitle.length > 8
          ? a.themeTitle.slice(0, 8) + "..."
          : a.themeTitle,
      score: a.score,
      fullMark: 100,
    })) ?? [];

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="sticky top-14 z-40 border-b bg-background/80 backdrop-blur-lg lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">わたしの立ち位置</h1>
        </div>
      </div>

      <div className="space-y-8 px-4 py-6">
        {/* Score Display */}
        <div className="rounded-xl border bg-card p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <p className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            視野スコア
          </p>
          {data.score !== null ? (
            <>
              <p
                className={`mt-3 text-5xl font-bold tracking-tight ${getScoreColor(data.score)}`}
              >
                {data.score}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">/ 100</p>
              <div className="mx-auto mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${getScoreBgColor(data.score)}`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <span
                  className={`text-xs font-medium ${getScoreColor(data.score)}`}
                >
                  {getScoreLabel(data.score)}
                </span>
              </div>
            </>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">{data.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            フォロー中: {data.followingCount} 人
          </p>
        </div>

        {/* Position Map (radar chart) */}
        {radarData.length >= 3 && (
          <section className="rounded-xl border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              立ち位置チャート
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              各トピックに対する平均スコア（外側=高評価 / 内側=低評価）
            </p>
            <div className="mt-3 animate-radar-expand">
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
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
          </section>
        )}

        {/* Distribution Charts */}
        {Object.entries(data.distribution).map(([attrKey, values]) => {
          const chartData = Object.entries(values).map(([val, count]) => ({
            name: ATTRIBUTE_LABELS_SHORT[attrKey]?.[val] ?? val,
            count,
          }));
          if (chartData.length === 0) return null;
          return (
            <section key={attrKey} className="rounded-xl border bg-card p-4">
              <h2 className="mb-4 text-sm font-semibold">
                {SECTION_LABELS[attrKey] ?? attrKey}
              </h2>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={80}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                        border: "1px solid var(--border)",
                      }}
                    />
                    <Bar dataKey="count" name="人数" radius={[0, 4, 4, 0]}>
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={BAR_COLORS[i % BAR_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
