"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface SpectrumDataPoint {
  postId: string;
  x: number;
  y: number;
  isOwnPost: boolean;
  authorHandle: string;
  contentPreview: string;
  averageScore: number;
  reactionCount: number;
}

interface OpinionSpectrumProps {
  data: SpectrumDataPoint[];
  xAxisAttribute: string;
  xAxisLabels: string[];
  onAttributeChange: (attribute: string) => void;
  onPostClick: (postId: string) => void;
  loading?: boolean;
}

const ATTRIBUTE_OPTIONS = [
  { value: "political_stance", label: "政治スタンス" },
  { value: "age_range", label: "年齢帯" },
  { value: "gender", label: "性別" },
  { value: "occupation", label: "職業" },
];

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: SpectrumDataPoint }> }) {
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload;
  return (
    <div className="max-w-[250px] rounded-lg border bg-popover p-3 shadow-md">
      <p className="text-xs text-muted-foreground">@{data.authorHandle}</p>
      <p className="mt-1 text-xs line-clamp-3">{data.contentPreview}</p>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
        <span>平均スコア {data.averageScore}</span>
        <span>{data.reactionCount}件</span>
      </div>
    </div>
  );
}

export function OpinionSpectrum({
  data,
  xAxisAttribute,
  xAxisLabels,
  onAttributeChange,
  onPostClick,
  loading,
}: OpinionSpectrumProps) {
  const ownPosts = data.filter((d) => d.isOwnPost);
  const otherPosts = data.filter((d) => !d.isOwnPost);

  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          みんなの意見マップ
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">横軸:</span>
          <Select value={xAxisAttribute} onValueChange={onAttributeChange}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ATTRIBUTE_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="flex h-[300px] items-center justify-center lg:h-[400px]">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : data.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center lg:h-[400px]">
          <p className="text-sm text-muted-foreground">データがありません</p>
        </div>
      ) : (
        <div className="mt-3">
          <ResponsiveContainer width="100%" height={300} className="lg:!h-[400px]">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis
                type="number"
                dataKey="x"
                domain={[0, xAxisLabels.length - 1]}
                ticks={xAxisLabels.map((_, i) => i)}
                tickFormatter={(v) => xAxisLabels[v] ?? ""}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                label={{ value: "平均スコア", angle: -90, position: "insideLeft", style: { fontSize: 11, fill: "var(--muted-foreground)" } }}
              />
              <ZAxis type="number" dataKey="reactionCount" range={[40, 200]} />
              <Tooltip content={<CustomTooltip />} />
              <Scatter
                data={otherPosts}
                fill="var(--primary)"
                fillOpacity={0.6}
                onClick={(entry) => {
                  if (entry?.postId) onPostClick(entry.postId);
                }}
              />
              <Scatter
                data={ownPosts}
                fill="var(--destructive)"
                fillOpacity={0.9}
                onClick={(entry) => {
                  if (entry?.postId) onPostClick(entry.postId);
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>

          <div className="mt-2 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" />
              他の人の意見
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive" />
              自分の意見
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
