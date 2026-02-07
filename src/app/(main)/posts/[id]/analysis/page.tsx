"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Share2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { apiFetch } from "@/lib/api/client";
import Link from "next/link";

const ATTRIBUTE_LABELS: Record<string, Record<string, string>> = {
  gender: { male: "男性", female: "女性", other: "その他", no_answer: "回答しない" },
  age_range: { "18-24": "18-24歳", "25-29": "25-29歳", "30-34": "30-34歳", "35-39": "35-39歳", "40-44": "40-44歳", "45-49": "45-49歳", "50-54": "50-54歳", "55-59": "55-59歳", "60-64": "60-64歳", "65_and_over": "65歳以上" },
  education: { junior_high: "中学校卒", high_school: "高校卒", vocational: "専門学校卒", junior_college: "短大卒", university: "大学卒", masters: "修士", doctorate: "博士", other: "その他" },
  occupation: { company_employee: "会社員", civil_servant: "公務員", self_employed: "自営業", executive: "経営者", professional: "専門職", educator_researcher: "教育・研究職", student: "学生", homemaker: "主婦・主夫", part_time: "パート", unemployed: "無職", retired: "退職者", other: "その他" },
  political_party: { ldp: "自民党", cdp: "立憲", nippon_ishin: "維新", komeito: "公明", dpfp: "国民", jcp: "共産", reiwa: "れいわ", sdp: "社民", sanseito: "参政", other: "その他", no_party: "なし", no_answer: "無回答" },
  political_stance: { left: "左派", center_left: "やや左派", center: "中道", center_right: "やや右派", right: "右派" },
};

const ATTRIBUTE_SECTION_LABELS: Record<string, string> = {
  gender: "性別",
  age_range: "年齢帯",
  education: "学歴",
  occupation: "職業",
  political_party: "支持政党",
  political_stance: "政治スタンス",
};

const PIE_COLORS = ["#3b82f6", "#ef4444"];
const BAR_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8", "#1e40af", "#6366f1", "#818cf8"];

interface AnalysisData {
  available: boolean;
  totalReactions: number;
  remainingForAnalysis?: number;
  message?: string;
  goodBadRatio?: {
    good: number;
    bad: number;
    goodRate: number;
    badRate: number;
  };
  attributeDistribution?: Record<string, Record<string, number>>;
  crossTabulation?: Record<string, Record<string, { good: number; bad: number }>>;
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
            <h1 className="text-lg font-bold">投稿分析</h1>
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
            / 20 評価
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
          {/* Good/Bad Ratio */}
          <section>
            <h2 className="mb-4 font-semibold">Good/Bad 比率</h2>
            <div className="flex items-center gap-6">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Good", value: data.goodBadRatio!.good },
                        { name: "Bad", value: data.goodBadRatio!.bad },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      dataKey="value"
                    >
                      {PIE_COLORS.map((color, i) => (
                        <Cell key={i} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm">Good: {data.goodBadRatio!.goodRate}% ({data.goodBadRatio!.good})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-sm">Bad: {data.goodBadRatio!.badRate}% ({data.goodBadRatio!.bad})</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  合計 {data.totalReactions} 件の評価
                </p>
              </div>
            </div>
          </section>

          {/* Attribute Distribution */}
          {data.attributeDistribution && (
            <section>
              <h2 className="mb-4 font-semibold">閲覧者属性分布</h2>
              <div className="space-y-6">
                {Object.entries(data.attributeDistribution).map(
                  ([attrKey, values]) => {
                    const chartData = Object.entries(values).map(
                      ([val, count]) => ({
                        name: ATTRIBUTE_LABELS[attrKey]?.[val] ?? val,
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

          {/* Cross Tabulation */}
          {data.crossTabulation && (
            <section>
              <h2 className="mb-4 font-semibold">属性 x 評価 クロス集計</h2>
              <div className="space-y-6">
                {Object.entries(data.crossTabulation).map(
                  ([attrKey, values]) => {
                    const chartData = Object.entries(values).map(
                      ([val, counts]) => ({
                        name: ATTRIBUTE_LABELS[attrKey]?.[val] ?? val,
                        Good: counts.good,
                        Bad: counts.bad,
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
                              <Legend />
                              <Bar
                                dataKey="Good"
                                stackId="a"
                                fill="#3b82f6"
                              />
                              <Bar
                                dataKey="Bad"
                                stackId="a"
                                fill="#ef4444"
                              />
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
