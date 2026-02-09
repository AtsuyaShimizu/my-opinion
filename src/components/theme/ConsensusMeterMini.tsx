"use client";

import { cn } from "@/lib/utils";

interface ConsensusMeterMiniProps {
  score: number;
}

function getBarColor(score: number) {
  if (score >= 70) return "bg-consensus-high";
  if (score >= 40) return "bg-consensus-low";
  return "bg-consensus-split";
}

function getTextColor(score: number) {
  if (score >= 70) return "text-consensus-high";
  if (score >= 40) return "text-consensus-low";
  return "text-consensus-split";
}

export function ConsensusMeterMini({ score }: ConsensusMeterMiniProps) {
  return (
    <div className="inline-flex items-center gap-1.5">
      <div className="h-1.5 w-16 rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-all duration-700 ease-out", getBarColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-xs font-medium", getTextColor(score))}>{score}%</span>
    </div>
  );
}
