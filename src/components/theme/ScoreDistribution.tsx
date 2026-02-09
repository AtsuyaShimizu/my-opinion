"use client";

import { cn } from "@/lib/utils";

interface ScoreDistributionProps {
  distribution: number[];
  userScore: number | null;
  averageScore: number | null;
}

function getOpinionColor(binCenter: number) {
  if (binCenter <= 20) return "bg-rose-400 dark:bg-rose-500";
  if (binCenter <= 40) return "bg-amber-400 dark:bg-amber-500";
  if (binCenter <= 60) return "bg-slate-400 dark:bg-slate-500";
  if (binCenter <= 80) return "bg-teal-400 dark:bg-teal-500";
  return "bg-emerald-400 dark:bg-emerald-500";
}

export function ScoreDistribution({
  distribution,
  userScore,
  averageScore,
}: ScoreDistributionProps) {
  const maxCount = Math.max(...distribution, 1);

  return (
    <div className="space-y-2">
      {/* Histogram */}
      <div className="relative">
        <div className="flex items-end gap-0.5 h-16">
          {distribution.map((count, i) => {
            const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
            const binCenter = i * 10 + 5;
            return (
              <div key={i} className="flex-1 flex flex-col items-center">
                <div
                  className={cn(
                    "w-full rounded-t transition-all duration-500",
                    getOpinionColor(binCenter)
                  )}
                  style={{
                    height: `${height}%`,
                    minHeight: count > 0 ? "2px" : "0",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Average marker overlay */}
        {averageScore != null && (
          <div
            className="absolute bottom-0 -translate-x-1/2"
            style={{ left: `${averageScore}%` }}
          >
            <div className="h-16 w-0.5 bg-foreground/40" />
            <div className="mt-0.5 text-[9px] font-medium text-muted-foreground -translate-x-1/2">
              平均
            </div>
          </div>
        )}

        {/* User marker overlay */}
        {userScore != null && (
          <div
            className="absolute bottom-0 -translate-x-1/2"
            style={{ left: `${userScore}%` }}
          >
            <div className="flex flex-col items-center">
              <div className="h-16 w-0.5 bg-primary" />
              <div className="mt-0.5 h-2 w-2 rounded-full bg-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Axis labels */}
      <div className="flex justify-between text-[9px] text-muted-foreground px-0.5">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
        {averageScore != null && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-0.5 bg-foreground/40" />
            <span>平均: {averageScore}</span>
          </div>
        )}
        {userScore != null && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <span>あなた: {userScore}</span>
          </div>
        )}
      </div>
    </div>
  );
}
