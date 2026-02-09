"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Frown, Smile, MessageCircle, Repeat2, MoreHorizontal, Link2, Share, Flag, Trash2, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle as AlertDialogTitleComp,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/user/UserAvatar";
import { AttributeBadge } from "@/components/user/AttributeBadge";
import { PostContent } from "@/components/post/PostContent";
import { ReactionSlider } from "@/components/post/ReactionSlider";
import { ReportModal } from "@/components/report/ReportModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/formatTime";

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
  title?: string | null;
  content: string;
  createdAt: string;
  reactionCount: number;
  averageScore: number | null;
  currentUserScore: number | null;
  replyCount: number;
  repostCount: number;
  isOwnPost?: boolean;
  isReposted?: boolean;
  isOfficialTopic?: boolean;
  repostedBy?: string;
  themeName?: string;
  onReaction?: (score: number) => void;
  onReactionRemove?: () => void;
  onRepost?: () => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
}

export function PostCard({
  id,
  author,
  title,
  content,
  createdAt,
  reactionCount,
  averageScore,
  currentUserScore,
  replyCount,
  repostCount,
  isOwnPost = false,
  isReposted = false,
  isOfficialTopic = false,
  repostedBy,
  themeName,
  onReaction,
  onReactionRemove,
  onRepost,
  onDelete,
}: PostCardProps) {
  const router = useRouter();
  const [reportOpen, setReportOpen] = useState(false);
  const [reposted, setReposted] = useState(isReposted);
  const [repostConfirmOpen, setRepostConfirmOpen] = useState(false);

  function handleCopyLink() {
    const url = `${window.location.origin}/posts/${id}`;
    navigator.clipboard.writeText(url)
      .then(() => toast("リンクをコピーしました"))
      .catch(() => toast.error("コピーに失敗しました"));
  }

  function handleShare() {
    const url = `${window.location.origin}/posts/${id}`;
    if (navigator.share) {
      navigator.share({ url });
    } else {
      navigator.clipboard.writeText(url);
      toast("リンクをコピーしました");
    }
  }

  async function handleDelete() {
    try {
      await onDelete?.();
      toast("意見を削除しました");
    } catch {
      toast.error("削除に失敗しました");
    }
  }

  async function handleRepostConfirm() {
    setRepostConfirmOpen(false);
    if (reposted) return;
    try {
      if (onRepost) {
        await onRepost();
      }
      setReposted(true);
      toast("リポストしました");
    } catch {
      toast.error("リポストに失敗しました");
    }
  }

  // Icon color logic based on current user score
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
    <article className="border-b bg-card transition-all duration-200 hover:bg-accent/30">
      <div className="px-4 pt-4 pb-3">
        {/* Repost indicator */}
        {repostedBy && (
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Repeat2 className="h-4 w-4" />
            <span>{repostedBy} がリポスト</span>
          </div>
        )}

        {/* Official topic label or theme name label */}
        {isOfficialTopic ? (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
              公式トピック
            </span>
          </div>
        ) : themeName ? (
          <div className="mb-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
              {themeName}
            </span>
          </div>
        ) : null}

        {/* Title (topic posts only) */}
        {title && (
          <div className="mb-2 cursor-pointer" onClick={() => router.push(`/posts/${id}`)}>
            <h3 className="text-base font-bold leading-snug text-foreground">
              {title}
            </h3>
            <div className="mt-2 border-b border-border/40" />
          </div>
        )}

        {/* Main content */}
        <div onClick={() => router.push(`/posts/${id}`)} className="cursor-pointer">
          <PostContent
            content={content}
            className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
          />
        </div>

        {/* Background tags */}
        {author.attributes && author.attributes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {author.attributes.map((attr) => (
              <AttributeBadge
                key={attr.type}
                type={attr.type}
                value={attr.value}
                size="md"
              />
            ))}
          </div>
        )}

        {/* Author row (subtle) */}
        <div className="mt-3 flex items-center gap-2">
          <Link href={`/users/${author.handle}`} className="shrink-0">
            <UserAvatar
              src={author.avatarUrl}
              displayName={author.displayName}
              size="xs"
            />
          </Link>
          <Link
            href={`/users/${author.handle}`}
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            {author.displayName} · {formatRelativeTime(createdAt)}
          </Link>
          <div className="ml-auto shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyLink}>
                  <Link2 className="h-4 w-4" />
                  リンクをコピー
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShare}>
                  <Share className="h-4 w-4" />
                  シェアする
                </DropdownMenuItem>
                {!isOwnPost && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setReportOpen(true)} variant="destructive">
                      <Flag className="h-4 w-4" />
                      通報する
                    </DropdownMenuItem>
                  </>
                )}
                {isOwnPost && onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleDelete} variant="destructive">
                      <Trash2 className="h-4 w-4" />
                      削除する
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Slider reaction */}
        <div className="mt-3">
          <div className="flex items-center gap-2">
            <Frown className={cn("h-5 w-5 shrink-0 transition-colors", frownColor)} />
            <ReactionSlider
              value={currentUserScore}
              onChange={onReaction}
              onRemove={onReactionRemove}
              disabled={isOwnPost}
              showAverage={reactionCount > 0}
              averageScore={averageScore}
            />
            <Smile className={cn("h-5 w-5 shrink-0 transition-colors", smileColor)} />
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>{reactionCount > 0 ? `平均 ${averageScore}` : ""}</span>
            <span>{reactionCount > 0 ? `${reactionCount}件` : "スライドして評価"}</span>
          </div>
        </div>

        {/* Action bar */}
        <div className="-ml-2 mt-2 flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground transition-colors hover:text-primary"
            asChild
          >
            <Link href={`/posts/${id}`}>
              <MessageCircle className="h-4 w-4" />
              {replyCount > 0 && (
                <span className={cn("text-xs", title && replyCount >= 10 && "font-semibold text-primary")}>
                  {replyCount}
                </span>
              )}
            </Link>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            disabled={isOwnPost || !onRepost}
            onClick={() => {
              if (!reposted && onRepost) setRepostConfirmOpen(true);
            }}
            className={cn(
              "gap-1.5 transition-colors",
              isOwnPost || !onRepost
                ? "text-muted-foreground"
                : reposted
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
            )}
          >
            <Repeat2 className="h-4 w-4" />
            {repostCount > 0 && (
              <span className={cn("text-xs", reposted && "text-primary")}>
                {repostCount}
              </span>
            )}
          </Button>

          {isOwnPost && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto gap-1.5 text-muted-foreground transition-colors hover:text-primary"
              asChild
            >
              <Link href={`/posts/${id}/analysis`}>
                <BarChart3 className="h-4 w-4" />
                <span className="text-xs">レスポンス分析</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <ReportModal
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType="post"
        targetId={id}
      />

      <AlertDialog open={repostConfirmOpen} onOpenChange={setRepostConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitleComp>この意見をリポストしますか？</AlertDialogTitleComp>
            <AlertDialogDescription>
              リポストすると、あなたのフォロワーのタイムラインにこの意見が表示されます。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction onClick={handleRepostConfirm}>
              リポストする
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}
