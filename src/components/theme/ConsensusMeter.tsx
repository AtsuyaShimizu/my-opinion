"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface ConsensusMeterProps {
  score: number;
  label?: string;
  attributeBreakdown?: {
    attribute: string;
    label: string;
    score: number;
  }[];
}

function getScoreColor(score: number) {
  if (score >= 70) return "text-consensus-high";
  if (score >= 40) return "text-consensus-low";
  return "text-consensus-split";
}

function getBarColor(score: number) {
  if (score >= 70) return "bg-consensus-high";
  if (score >= 40) return "bg-consensus-low";
  return "bg-consensus-split";
}

function getLabel(score: number, label?: string) {
  if (label) return label;
  if (score >= 70) return "概ね意見が一致しています";
  if (score >= 40) return "やや意見が分かれています";
  return "意見が大きく割れています";
}

export function ConsensusMeter({ score, label, attributeBreakdown }: ConsensusMeterProps) {
  const [animated, setAnimated] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="rounded-xl border bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        意見の一致度
      </p>

      <div className="mt-3 flex items-baseline gap-3">
        <span className={cn("text-3xl font-bold tracking-tight", getScoreColor(score))}>
          {score}%
        </span>
        <span className="text-sm text-muted-foreground">{getLabel(score, label)}</span>
      </div>

      <div className="mt-3 h-3 rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-700 ease-out",
            getBarColor(score)
          )}
          style={{ width: animated ? `${score}%` : "0%" }}
        />
      </div>

      <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
        <span>意見が割れている</span>
        <span>全員一致</span>
      </div>

      {attributeBreakdown && attributeBreakdown.length > 0 && (
        <>
          <button
            type="button"
            onClick={() => setShowBreakdown(!showBreakdown)}
            className="mt-4 text-xs font-medium text-primary hover:underline lg:hidden"
          >
            {showBreakdown ? "閉じる" : "立場ごとの詳細を見る"}
          </button>

          <div className={cn("mt-4 space-y-2.5", "hidden lg:block", showBreakdown && "!block")}>
            <p className="text-xs font-semibold text-muted-foreground">立場ごとの一致度</p>
            {attributeBreakdown.map((item) => (
              <div key={item.attribute} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-xs text-muted-foreground">{item.label}</span>
                <div className="h-2 flex-1 rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-700 ease-out",
                      getBarColor(item.score)
                    )}
                    style={{ width: animated ? `${item.score}%` : "0%" }}
                  />
                </div>
                <span className={cn("w-8 text-right text-xs font-medium", getScoreColor(item.score))}>
                  {item.score}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
