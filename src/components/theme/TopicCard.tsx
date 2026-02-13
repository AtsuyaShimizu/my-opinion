import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TopicCardProps {
  id: string;
  title: string;
  description?: string | null;
  postCount: number;
  participantCount?: number;
  consensusScore: number;
  status: "active" | "ended";
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

function getHeatLabel(score: number) {
  if (score >= 70) return "合意形成";
  if (score >= 40) return "収束中";
  return "分断中";
}

function getHeatClass(score: number) {
  if (score >= 70) return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  if (score >= 40) return "bg-amber-500/10 text-amber-700 dark:text-amber-300";
  return "bg-rose-500/10 text-rose-700 dark:text-rose-300";
}

export function TopicCard({
  id,
  title,
  description,
  postCount,
  participantCount,
  consensusScore,
  status,
}: TopicCardProps) {
  return (
    <Link
      href={`/themes/${id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-card p-5 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,var(--primary)/0.08,transparent_45%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <div className="relative flex items-center gap-2">
        <Badge variant={status === "active" ? "default" : "secondary"} className="text-[10px]">
          {status === "active" ? "観測中" : "終了"}
        </Badge>
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", getHeatClass(consensusScore))}>
          {getHeatLabel(consensusScore)}
        </span>
        {participantCount != null && (
          <span className="ml-auto text-xs text-muted-foreground">{participantCount}人参加</span>
        )}
      </div>
      <h3 className="relative mt-2 text-base font-bold line-clamp-2 group-hover:text-primary">
        {title}
      </h3>
      {description && (
        <p className="relative mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
      )}
      <div className="relative mt-auto pt-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 rounded-full bg-muted">
            <div
              className={cn("h-full rounded-full transition-all duration-700 ease-out", getBarColor(consensusScore))}
              style={{ width: `${consensusScore}%` }}
            />
          </div>
          <span className={cn("text-xs font-medium tabular-nums", getTextColor(consensusScore))}>
            {consensusScore}%
          </span>
        </div>
        <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
          <span>{postCount}件の意見</span>
          <span className="font-medium text-primary group-hover:translate-x-0.5 transition-transform">
            地図を見る &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
