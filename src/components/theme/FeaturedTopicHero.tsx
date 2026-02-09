"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeWithConsensus {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  participantCount: number;
  consensusScore: number;
  status: "active" | "ended";
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

interface FeaturedTopicHeroProps {
  theme: ThemeWithConsensus;
  onParticipate: () => void;
}

export function FeaturedTopicHero({ theme, onParticipate }: FeaturedTopicHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

      <div className="relative p-6">
        <Badge variant={theme.status === "active" ? "default" : "secondary"}>
          {theme.status === "active" ? "投稿受付中" : "終了"}
        </Badge>

        <h2 className="mt-3 text-xl font-bold sm:text-2xl">{theme.title}</h2>

        {theme.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {theme.description}
          </p>
        )}

        {/* Consensus meter */}
        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span
              className={cn(
                "text-3xl font-bold tabular-nums",
                getScoreColor(theme.consensusScore)
              )}
            >
              {theme.consensusScore}%
            </span>
            <span className="text-sm text-muted-foreground">一致度</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-muted">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-700",
                getBarColor(theme.consensusScore)
              )}
              style={{ width: `${theme.consensusScore}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>{theme.participantCount}人参加</span>
          <span>{theme.postCount}件の意見</span>
        </div>

        {theme.status === "active" && (
          <Button onClick={onParticipate} className="mt-5 rounded-xl" size="lg">
            このトピックに参加する
          </Button>
        )}
      </div>
    </div>
  );
}
