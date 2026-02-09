"use client";

import Link from "next/link";
import { AttributeBadge } from "@/components/user/AttributeBadge";
import { formatRelativeTime } from "@/lib/utils/formatTime";
import { cn } from "@/lib/utils";

interface PostAttribute {
  type: "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party";
  value: string;
}

interface OpinionCardCompactProps {
  id: string;
  author: {
    handle: string;
    displayName: string;
    avatarUrl?: string | null;
    attributes?: PostAttribute[];
  };
  title?: string | null;
  content: string;
  createdAt: string;
  averageScore: number | null;
}

function getOpinionBgColor(score: number | null) {
  if (score === null) return "bg-muted-foreground/30";
  if (score <= 30) return "bg-rose-400";
  if (score <= 45) return "bg-amber-400";
  if (score <= 55) return "bg-muted-foreground/50";
  if (score <= 70) return "bg-teal-400";
  return "bg-emerald-400";
}

export function OpinionCardCompact({
  id,
  author,
  title,
  content,
  createdAt,
  averageScore,
}: OpinionCardCompactProps) {
  return (
    <Link
      href={`/posts/${id}`}
      className="flex gap-3 rounded-xl border bg-card p-3 transition-all hover:bg-accent/30 hover:shadow-sm"
    >
      {/* Left: Score indicator (vertical bar) */}
      <div className="flex w-8 flex-col items-center gap-1">
        <div className="h-full w-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className={cn("w-full rounded-full transition-all", getOpinionBgColor(averageScore))}
            style={{ height: `${averageScore ?? 0}%` }}
          />
        </div>
        <span className="text-[10px] font-bold tabular-nums">
          {averageScore ?? "--"}
        </span>
      </div>

      {/* Right: Content */}
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-bold line-clamp-1">{title}</p>}
        <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
        <div className="mt-2 flex items-center gap-1.5">
          {(author.attributes ?? []).slice(0, 3).map((attr) => (
            <AttributeBadge key={attr.type} type={attr.type} value={attr.value} size="sm" />
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {author.displayName} · {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
