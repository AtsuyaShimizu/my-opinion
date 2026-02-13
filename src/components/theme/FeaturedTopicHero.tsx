"use client";

import Link from "next/link";
import { Radar, Sparkles } from "lucide-react";
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

function getPhaseLabel(score: number) {
  if (score >= 70) return "合意形成が進んでいます";
  if (score >= 40) return "意見がせめぎ合っています";
  return "立場差が大きいトピックです";
}

interface FeaturedTopicHeroProps {
  theme: ThemeWithConsensus;
  onParticipate: () => void;
}

export function FeaturedTopicHero({ theme, onParticipate }: FeaturedTopicHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-card shadow-sm">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--primary)/0.14,transparent_45%),radial-gradient(circle_at_85%_30%,var(--consensus-low)/0.18,transparent_40%)]" />
      <div className="absolute right-4 top-4 hidden h-20 w-20 rounded-full border border-border/60 bg-background/70 md:block" />

      <div className="relative p-6 sm:p-7">
        <div className="flex items-center gap-2">
          <Badge variant={theme.status === "active" ? "default" : "secondary"}>
            {theme.status === "active" ? "観測中" : "クローズ"}
          </Badge>
          <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            メイントピック
          </span>
        </div>

        <h2 className="mt-3 text-xl font-bold leading-tight sm:text-2xl">{theme.title}</h2>

        {theme.description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {theme.description}
          </p>
        )}

        <div className="mt-5 rounded-2xl border border-border/70 bg-background/70 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              いまの一致度
            </p>
            <span
              className={cn(
                "text-3xl font-bold tabular-nums tracking-tight",
                getScoreColor(theme.consensusScore)
              )}
            >
              {theme.consensusScore}%
            </span>
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
          <p className="mt-2 text-xs text-muted-foreground">{getPhaseLabel(theme.consensusScore)}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">
            {theme.participantCount}人が参加
          </span>
          <span className="rounded-full border border-border/70 bg-background/70 px-2.5 py-1">
            {theme.postCount}件の意見
          </span>
        </div>

        {theme.status === "active" && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <Button onClick={onParticipate} className="rounded-xl">
              意見を書いて地図に加わる
            </Button>
            <Button variant="outline" className="gap-2 rounded-xl" asChild>
              <Link href={`/themes/${theme.id}?view=spectrum`}>
                <Radar className="h-4 w-4" />
                意見マップを見る
              </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
