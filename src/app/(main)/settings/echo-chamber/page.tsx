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
} from "recharts";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

const ATTRIBUTE_LABELS: Record<string, Record<string, string>> = {
  gender: { male: "男性", female: "女性", other: "その他", no_answer: "回答しない" },
  age_range: { "18-24": "18-24歳", "25-29": "25-29歳", "30-34": "30-34歳", "35-39": "35-39歳", "40-44": "40-44歳", "45-49": "45-49歳", "50-54": "50-54歳", "55-59": "55-59歳", "60-64": "60-64歳", "65_and_over": "65歳以上" },
  education: { junior_high: "中学校卒", high_school: "高校卒", vocational: "専門学校卒", junior_college: "短大卒", university: "大学卒", masters: "修士", doctorate: "博士", other: "その他" },
  occupation: { company_employee: "会社員", civil_servant: "公務員", self_employed: "自営業", executive: "経営者", professional: "専門職", educator_researcher: "教育・研究職", student: "学生", homemaker: "主婦・主夫", part_time: "パート", unemployed: "無職", retired: "退職者", other: "その他" },
  political_party: { ldp: "自民党", cdp: "立憲", nippon_ishin: "維新", komeito: "公明", dpfp: "国民", jcp: "共産", reiwa: "れいわ", sdp: "社民", sanseito: "参政", other: "その他", no_party: "なし", no_answer: "無回答" },
  political_stance: { left: "左派", center_left: "やや左派", center: "中道", center_right: "やや右派", right: "右派" },
};

const SECTION_LABELS: Record<string, string> = {
  gender: "性別",
  age_range: "年齢帯",
  education: "学歴",
  occupation: "職業",
  political_party: "支持政党",
  political_stance: "政治スタンス",
};

const BAR_COLORS = ["#3b82f6", "#60a5fa", "#93c5fd", "#2563eb", "#1d4ed8", "#6366f1", "#818cf8", "#a5b4fc"];

interface EchoChamberData {
  score: number | null;
  message: string;
  distribution: Record<string, Record<string, number>>;
  followingCount: number;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function getScoreBgColor(score: number): string {
  if (score >= 70) return "bg-green-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

export default function EchoChamberPage() {
  const router = useRouter();
  const [data, setData] = useState<EchoChamberData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<EchoChamberData>("/api/users/me/echo-chamber")
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">エコーチェンバー指標</h1>
        </div>
      </div>

      <div className="space-y-8 px-4 py-6">
        {/* Score Display */}
        <div className="text-center">
          <Activity className="mx-auto h-10 w-10 text-primary" />
          {data.score !== null ? (
            <>
              <p className={`mt-4 text-5xl font-bold ${getScoreColor(data.score)}`}>
                {data.score}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">/ 100</p>
              <div className="mx-auto mt-4 h-3 max-w-xs overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all ${getScoreBgColor(data.score)}`}
                  style={{ width: `${data.score}%` }}
                />
              </div>
            </>
          ) : null}
          <p className="mt-4 text-sm text-muted-foreground">{data.message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            フォロー中: {data.followingCount} 人
          </p>
        </div>

        {/* Distribution Charts */}
        {Object.entries(data.distribution).map(([attrKey, values]) => {
          const chartData = Object.entries(values).map(([val, count]) => ({
            name: ATTRIBUTE_LABELS[attrKey]?.[val] ?? val,
            count,
          }));
          if (chartData.length === 0) return null;
          return (
            <section key={attrKey}>
              <h2 className="mb-3 text-sm font-semibold">
                {SECTION_LABELS[attrKey] ?? attrKey}
              </h2>
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
            </section>
          );
        })}
      </div>
    </div>
  );
}
