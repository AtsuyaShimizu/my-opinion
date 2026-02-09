"use client";

import { cn } from "@/lib/utils";

interface ScoreSpectrumProps {
  averageScore: number | null;
  userScore: number | null;
  reactionCount: number;
  size?: "sm" | "md";
}

export function ScoreSpectrum({
  averageScore,
  userScore,
  reactionCount,
  size = "sm",
}: ScoreSpectrumProps) {
  const trackHeight = size === "md" ? "h-2.5" : "h-2";

  return (
    <div className="space-y-1">
      {/* Track */}
      <div
        className={cn(
          "relative rounded-full bg-gradient-to-r from-rose-200 via-amber-200 to-emerald-200 dark:from-rose-900/40 dark:via-amber-900/40 dark:to-emerald-900/40",
          trackHeight
        )}
      >
        {/* Average marker (thin vertical line) */}
        {averageScore != null && (
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${averageScore}%` }}
          >
            <div className="h-3.5 w-1 rounded-full bg-foreground/60" />
          </div>
        )}
        {/* User marker (circle) */}
        {userScore != null && (
          <div
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${userScore}%` }}
          >
            <div className="h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm" />
          </div>
        )}
      </div>
      {/* Labels */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{reactionCount > 0 && averageScore != null ? `平均 ${averageScore}` : ""}</span>
        <span>{reactionCount}件</span>
      </div>
    </div>
  );
}
