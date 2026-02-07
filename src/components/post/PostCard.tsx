"use client";

import Link from "next/link";
import { ThumbsUp, ThumbsDown, MessageCircle, Repeat2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user/UserAvatar";
import { AttributeBadge } from "@/components/user/AttributeBadge";
import { cn } from "@/lib/utils";

interface PostAttribute {
  type: "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party";
  value: string;
}

interface PostCardProps {
  id: string;
  author: {
    handle: string;
    displayName: string;
    avatarUrl?: string | null;
    attributes?: PostAttribute[];
  };
  content: string;
  createdAt: string;
  goodCount: number;
  badCount?: number;
  replyCount: number;
  repostCount: number;
  isOwnPost?: boolean;
  userReaction?: "good" | "bad" | null;
  repostedBy?: string;
  themeName?: string;
  onGood?: () => void;
  onBad?: () => void;
  onRepost?: () => void;
}

function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}日前`;
  if (hours > 0) return `${hours}時間前`;
  if (minutes > 0) return `${minutes}分前`;
  return "たった今";
}

export function PostCard({
  id,
  author,
  content,
  createdAt,
  goodCount,
  badCount,
  replyCount,
  repostCount,
  isOwnPost = false,
  userReaction,
  repostedBy,
  themeName,
  onGood,
  onBad,
  onRepost,
}: PostCardProps) {
  return (
    <article className="border-b px-4 py-4 transition-colors hover:bg-accent/50">
      {repostedBy && (
        <div className="mb-2 flex items-center gap-2 pl-12 text-sm text-muted-foreground">
          <Repeat2 className="h-4 w-4" />
          <span>{repostedBy} がリポスト</span>
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/users/${author.handle}`} className="shrink-0">
          <UserAvatar
            src={author.avatarUrl}
            displayName={author.displayName}
            size="md"
          />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <Link
              href={`/users/${author.handle}`}
              className="truncate font-semibold hover:underline"
            >
              {author.displayName}
            </Link>
            <span className="truncate text-sm text-muted-foreground">
              @{author.handle}
            </span>
            <span className="shrink-0 text-sm text-muted-foreground">
              · {formatRelativeTime(createdAt)}
            </span>
          </div>

          {author.attributes && author.attributes.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {author.attributes.map((attr) => (
                <AttributeBadge
                  key={attr.type}
                  type={attr.type}
                  value={attr.value}
                />
              ))}
            </div>
          )}

          {themeName && (
            <div className="mt-1 text-xs text-primary">
              # {themeName}
            </div>
          )}

          <Link href={`/posts/${id}`}>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {content}
            </p>
          </Link>

          <div className="mt-3 flex items-center gap-6">
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-primary"
              asChild
            >
              <Link href={`/posts/${id}`}>
                <MessageCircle className="h-4 w-4" />
                {replyCount > 0 && (
                  <span className="text-xs">{replyCount}</span>
                )}
              </Link>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground hover:text-green-600"
              onClick={onRepost}
            >
              <Repeat2 className="h-4 w-4" />
              {repostCount > 0 && (
                <span className="text-xs">{repostCount}</span>
              )}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "gap-1.5 hover:text-blue-600",
                userReaction === "good"
                  ? "text-blue-600"
                  : "text-muted-foreground"
              )}
              onClick={onGood}
            >
              <ThumbsUp className="h-4 w-4" />
              {goodCount > 0 && (
                <span className="text-xs">{goodCount}</span>
              )}
            </Button>

            {isOwnPost && badCount !== undefined && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 hover:text-red-600",
                  userReaction === "bad"
                    ? "text-red-600"
                    : "text-muted-foreground"
                )}
                onClick={onBad}
              >
                <ThumbsDown className="h-4 w-4" />
                {badCount > 0 && (
                  <span className="text-xs">{badCount}</span>
                )}
              </Button>
            )}

            {!isOwnPost && (
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "gap-1.5 hover:text-red-600",
                  userReaction === "bad"
                    ? "text-red-600"
                    : "text-muted-foreground"
                )}
                onClick={onBad}
              >
                <ThumbsDown className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
