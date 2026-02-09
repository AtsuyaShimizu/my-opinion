"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Share2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { apiFetch } from "@/lib/api/client";
import { ATTRIBUTE_LABELS_SHORT } from "@/lib/constants";
import Link from "next/link";

const ATTRIBUTE_SECTION_LABELS: Record<string, string> = {
  gender: "性別",
  age_range: "年齢帯",
  education: "学歴",
  occupation: "職業",
  political_party: "支持政党",
  political_stance: "政治的な立場",
};

// Score distribution bin colors (rose -> amber -> emerald)
const BIN_COLORS = ["#fb7185", "#f59e0b", "#fcd34d", "#6ee7b7", "#34d399"];

// Muted distinguishable bar colors for attribute distribution
const BAR_COLORS = ["#5d8a9a", "#7a9e7e", "#c4a862", "#b07060", "#8e7ea0", "#6a8fa0", "#9eab72", "#b08870"];

interface ScoreDistributionBin {
  range: string;
  count: number;
}

interface AnalysisData {
  available: boolean;
  totalReactions: number;
  remainingForAnalysis?: number;
  message?: string;
  averageScore?: number;
  scoreDistribution?: ScoreDistributionBin[];
  attributeDistribution?: Record<string, Record<string, number>>;
  crossTabulation?: Record<string, Record<string, { count: number; averageScore: number }>>;
}

function scoreToColor(score: number): string {
  if (score <= 20) return "#fb7185";
  if (score <= 40) return "#f59e0b";
  if (score <= 60) return "#fcd34d";
  if (score <= 80) return "#6ee7b7";
  return "#34d399";
}

export default function AnalysisPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AnalysisData>(`/api/posts/${id}/analysis`)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="分析を表示できません"
        description={error}
      />
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">レスポンス分析</h1>
          </div>
          {data.available && (
            <Button variant="outline" size="sm" className="gap-2" asChild>
              <Link href={`/posts/${id}/share`}>
                <Share2 className="h-4 w-4" />
                シェア
              </Link>
            </Button>
          )}
        </div>
      </div>

      {!data.available ? (
        <div className="px-4 py-16 text-center">
          <p className="text-4xl font-bold text-primary">
            {data.totalReactions}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            / 20 リアクション
          </p>
          <div className="mx-auto mt-4 h-2 max-w-xs rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min((data.totalReactions / 20) * 100, 100)}%` }}
            />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            {data.message}
          </p>
        </div>
      ) : (
        <div className="space-y-8 px-4 py-6">
          {/* Average Score Summary */}
          <section className="text-center">
            <p className="text-5xl font-bold tracking-tight text-primary">
              {data.averageScore}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              平均スコア ({data.totalReactions}件のリアクション)
            </p>
          </section>

          {/* Score Distribution Histogram */}
          {data.scoreDistribution && (
            <section>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                スコア分布
              </h2>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.scoreDistribution}>
                    <XAxis
                      dataKey="range"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      allowDecimals={false}
                    />
                    <Tooltip
                      formatter={(value) => [`${value}件`, "リアクション数"]}
                    />
                    <Bar dataKey="count" name="件数" radius={[4, 4, 0, 0]}>
                      {data.scoreDistribution.map((_, i) => (
                        <Cell key={i} fill={BIN_COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                <span>異論</span>
                <span>共感</span>
              </div>
            </section>
          )}

          {/* Attribute Distribution */}
          {data.attributeDistribution && (
            <section>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">読み手のプロフィール分布</h2>
              <div className="space-y-6">
                {Object.entries(data.attributeDistribution).map(
                  ([attrKey, values]) => {
                    const chartData = Object.entries(values).map(
                      ([val, count]) => ({
                        name: ATTRIBUTE_LABELS_SHORT[attrKey]?.[val] ?? val,
                        count,
                      })
                    );
                    if (chartData.length === 0) return null;
                    return (
                      <div key={attrKey}>
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                          {ATTRIBUTE_SECTION_LABELS[attrKey] ?? attrKey}
                        </h3>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical">
                              <XAxis type="number" />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={80}
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip />
                              <Bar dataKey="count" name="人数">
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
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          )}

          {/* Cross Tabulation - Average Score per attribute */}
          {data.crossTabulation && (
            <section>
              <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground">立場 x スコア の内訳</h2>
              <div className="space-y-6">
                {Object.entries(data.crossTabulation).map(
                  ([attrKey, values]) => {
                    const chartData = Object.entries(values).map(
                      ([val, stats]) => ({
                        name: ATTRIBUTE_LABELS_SHORT[attrKey]?.[val] ?? val,
                        averageScore: stats.averageScore,
                        count: stats.count,
                      })
                    );
                    if (chartData.length === 0) return null;
                    return (
                      <div key={attrKey}>
                        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                          {ATTRIBUTE_SECTION_LABELS[attrKey] ?? attrKey}
                        </h3>
                        <div className="h-40">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical">
                              <XAxis
                                type="number"
                                domain={[0, 100]}
                                tick={{ fontSize: 12 }}
                              />
                              <YAxis
                                type="category"
                                dataKey="name"
                                width={80}
                                tick={{ fontSize: 12 }}
                              />
                              <Tooltip
                                formatter={(value, _name, props) =>
                                  [`平均 ${value} (${(props.payload as { count: number }).count}件)`, "スコア"]
                                }
                              />
                              <Bar dataKey="averageScore" name="平均スコア">
                                {chartData.map((entry, i) => (
                                  <Cell
                                    key={i}
                                    fill={scoreToColor(entry.averageScore)}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
