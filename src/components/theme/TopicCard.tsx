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
      className="group flex flex-col rounded-2xl border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="flex items-center gap-2">
        <Badge variant={status === "active" ? "default" : "secondary"} className="text-[10px]">
          {status === "active" ? "投稿受付中" : "終了"}
        </Badge>
        {participantCount != null && (
          <span className="text-xs text-muted-foreground">{participantCount}人参加</span>
        )}
      </div>
      <h3 className="mt-2 text-base font-bold line-clamp-2 group-hover:text-primary">
        {title}
      </h3>
      {description && (
        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
      )}
      {/* Consensus bar */}
      <div className="mt-auto pt-4">
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
          <span className="font-medium text-primary">
            参加する &rarr;
          </span>
        </div>
      </div>
    </Link>
  );
}
