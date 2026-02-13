"use client";

import Link from "next/link";
import { Frown, Smile } from "lucide-react";
import { UserAvatar } from "@/components/user/UserAvatar";
import { AttributeBadge } from "@/components/user/AttributeBadge";
import { PostContent } from "@/components/post/PostContent";
import { ScoreSpectrum } from "@/components/post/ScoreSpectrum";
import { ReactionSlider } from "@/components/post/ReactionSlider";
import { formatRelativeTime } from "@/lib/utils/formatTime";
import { cn } from "@/lib/utils";

interface PostAttribute {
  type: "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party";
  value: string;
}

interface OpinionTileProps {
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
  reactionCount: number;
  averageScore: number | null;
  currentUserScore: number | null;
  themeName?: string;
  isOwnPost?: boolean;
  onReaction?: (score: number) => void;
  onReactionRemove?: () => void;
  className?: string;
}

function getToneLabel(score: number | null) {
  if (score === null) return "反応待ち";
  if (score <= 33) return "異論寄り";
  if (score <= 66) return "中立寄り";
  return "共感寄り";
}

export function OpinionTile({
  id,
  author,
  title,
  content,
  createdAt,
  reactionCount,
  averageScore,
  currentUserScore,
  themeName,
  isOwnPost = false,
  onReaction,
  onReactionRemove,
  className,
}: OpinionTileProps) {
  const frownColor =
    currentUserScore !== null && currentUserScore <= 30
      ? "text-rose-400"
      : currentUserScore !== null && currentUserScore <= 69
        ? "text-amber-400/60"
        : "text-muted-foreground/40";

  const smileColor =
    currentUserScore !== null && currentUserScore >= 70
      ? "text-emerald-400"
      : currentUserScore !== null && currentUserScore >= 31
        ? "text-amber-400/60"
        : "text-muted-foreground/40";

  return (
    <article
      className={cn(
        "break-inside-avoid overflow-hidden rounded-2xl border border-border/70 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <span
            className={cn(
              "rounded-full px-2.5 py-1 text-[11px] font-semibold",
              averageScore === null
                ? "bg-muted text-muted-foreground"
                : averageScore <= 33
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
                  : averageScore <= 66
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
            )}
          >
            {getToneLabel(averageScore)}
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">
            平均 {averageScore ?? "--"}
          </span>
        </div>

        {/* Theme name */}
        {themeName && (
          <span className="text-xs font-medium text-primary">
            {themeName}
          </span>
        )}

        {/* Title */}
        {title && (
          <Link href={`/posts/${id}`}>
            <h3 className="mt-1 text-base font-bold leading-snug hover:text-primary">
              {title}
            </h3>
          </Link>
        )}

        {/* Content */}
        <Link href={`/posts/${id}`} className="mt-2 block">
          <PostContent
            content={content}
            className="text-sm leading-relaxed line-clamp-8"
          />
        </Link>

        {/* Score spectrum */}
        <div className="mt-4">
          <ScoreSpectrum
            averageScore={averageScore}
            userScore={currentUserScore}
            reactionCount={reactionCount}
          />
        </div>

        {/* Attribute badges */}
        {author.attributes && author.attributes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {author.attributes.map((attr) => (
              <AttributeBadge key={attr.type} type={attr.type} value={attr.value} size="sm" />
            ))}
          </div>
        )}

        {/* Author + time */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={`/users/${author.handle}`}
            className="flex items-center gap-1.5 hover:text-foreground"
          >
            <UserAvatar
              src={author.avatarUrl}
              displayName={author.displayName}
              size="xs"
            />
            <span>{author.displayName}</span>
          </Link>
          <span className="ml-auto">{formatRelativeTime(createdAt)}</span>
        </div>
      </div>

      {/* Reaction bar at bottom */}
      <div className="flex items-center gap-2 border-t px-4 py-2">
        <Frown className={cn("h-4 w-4 shrink-0 transition-colors", frownColor)} />
        <ReactionSlider
          value={currentUserScore}
          onChange={onReaction}
          onRemove={onReactionRemove}
          disabled={isOwnPost}
          showAverage={reactionCount > 0}
          averageScore={averageScore}
        />
        <Smile className={cn("h-4 w-4 shrink-0 transition-colors", smileColor)} />
      </div>
    </article>
  );
}
