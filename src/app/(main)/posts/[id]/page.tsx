"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { MessageCircle, ArrowLeft, BarChart3, Frown, Smile } from "lucide-react";
import { ScoreSpectrum } from "@/components/post/ScoreSpectrum";
import { PostContent } from "@/components/post/PostContent";
import { ReactionSlider } from "@/components/post/ReactionSlider";
import { UserAvatar } from "@/components/user/UserAvatar";
import { AttributeBadge } from "@/components/user/AttributeBadge";
import { PostCard } from "@/components/post/PostCard";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { ComposeModal } from "@/components/post/ComposeModal";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { mapAttributes } from "@/lib/utils/mapAttributes";
import { formatRelativeTime } from "@/lib/utils/formatTime";
import { useAuth } from "@/hooks/useAuth";
import { useReactionHandler } from "@/hooks/useReactionHandler";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// API response shape from GET /api/posts/:id
interface PostApiResponse {
  id: string;
  title?: string | null;
  content: string;
  created_at: string;
  user_id: string;
  reactionCount: number;
  averageScore: number | null;
  replyCount: number;
  currentUserScore: number | null;
  author: {
    id: string;
    user_handle: string;
    display_name: string;
    avatar_url: string | null;
    attributes: Record<string, string | null> | null;
  };
}

// API response shape from GET /api/posts/:id/replies
interface ReplyApiResponse {
  id: string;
  title?: string | null;
  content: string;
  created_at: string;
  user_id: string;
  reactionCount: number;
  averageScore: number | null;
  replyCount: number;
  currentUserScore: number | null;
  author: {
    user_handle: string;
    display_name: string;
    avatar_url: string | null;
    attributes: Record<string, string | null> | null;
  } | null;
}

interface PostDisplay {
  id: string;
  title?: string | null;
  content: string;
  createdAt: string;
  reactionCount: number;
  averageScore: number | null;
  currentUserScore: number | null;
  replyCount: number;
  repostCount: number;
  isOwnPost: boolean;
  themeName?: string;
  author: {
    handle: string;
    displayName: string;
    avatarUrl: string | null;
    attributes: { type: "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party"; value: string }[];
  };
}

export default function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  const [post, setPost] = useState<PostDisplay | null>(null);
  const [replies, setReplies] = useState<PostDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState(false);

  function mapPostResponse(data: PostApiResponse): PostDisplay {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      createdAt: data.created_at,
      reactionCount: data.reactionCount ?? 0,
      averageScore: data.averageScore ?? null,
      currentUserScore: data.currentUserScore ?? null,
      replyCount: data.replyCount ?? 0,
      repostCount: 0,
      isOwnPost: currentUser?.id === data.user_id,
      author: {
        handle: data.author?.user_handle ?? "",
        displayName: data.author?.display_name ?? "",
        avatarUrl: data.author?.avatar_url ?? null,
        attributes: mapAttributes(data.author?.attributes ?? null),
      },
    };
  }

  function mapReplyResponse(data: ReplyApiResponse): PostDisplay {
    return {
      id: data.id,
      title: data.title,
      content: data.content,
      createdAt: data.created_at,
      reactionCount: data.reactionCount ?? 0,
      averageScore: data.averageScore ?? null,
      currentUserScore: data.currentUserScore ?? null,
      replyCount: data.replyCount ?? 0,
      repostCount: 0,
      isOwnPost: currentUser?.id === data.user_id,
      author: {
        handle: data.author?.user_handle ?? "",
        displayName: data.author?.display_name ?? "",
        avatarUrl: data.author?.avatar_url ?? null,
        attributes: mapAttributes(data.author?.attributes ?? null),
      },
    };
  }

  const fetchPost = useCallback(async () => {
    try {
      const postData = await apiFetch<PostApiResponse>(`/api/posts/${id}`);
      setPost(mapPostResponse(postData));

      const repliesData = await apiFetch<{ items: ReplyApiResponse[]; nextCursor: string | null }>(
        `/api/posts/${id}/replies`
      );
      setReplies((repliesData.items ?? []).map(mapReplyResponse));
    } catch {
      toast.error("投稿の取得に失敗しました");
    }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    fetchPost().finally(() => setLoading(false));
  }, [fetchPost]);

  async function handleReply(content: string) {
    try {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content, parentPostId: id }),
      });
      fetchPost();
    } catch {
      toast.error("返信に失敗しました");
    }
  }

  const { handleReaction: handleReplyReaction, handleReactionRemove: handleReplyReactionRemove } =
    useReactionHandler(setReplies, fetchPost);

  async function handleReaction(postId: string, score: number) {
    if (post && post.id === postId) {
      setPost((prev) => {
        if (!prev) return prev;
        const hadReaction = prev.currentUserScore !== null;
        return {
          ...prev,
          currentUserScore: score,
          reactionCount: hadReaction ? prev.reactionCount : prev.reactionCount + 1,
        };
      });
    }
    await handleReplyReaction(postId, score);
  }

  async function handleReactionRemove(postId: string) {
    if (post && post.id === postId) {
      setPost((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          currentUserScore: null,
          reactionCount: Math.max(0, prev.reactionCount - 1),
        };
      });
    }
    await handleReplyReactionRemove(postId);
  }

  async function handleRepost(postId: string) {
    await apiFetch(`/api/posts/${postId}/repost`, { method: "POST" });
  }

  if (loading) {
    return (
      <div>
        <div className="sticky top-14 z-40 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
          <Button variant="ghost" size="icon" aria-label="戻る" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">投稿</h1>
        </div>
        <PostCardSkeleton />
        <div className="border-b px-4 py-3">
          <div className="h-9 w-full rounded-md bg-muted animate-shimmer" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <PostCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!post) {
    return (
      <EmptyState
        title="投稿が見つかりません"
        description="投稿が削除されたか、存在しないURLです。"
      />
    );
  }

  const frownColor =
    post.currentUserScore !== null && post.currentUserScore <= 30
      ? "text-rose-400"
      : post.currentUserScore !== null && post.currentUserScore <= 69
        ? "text-amber-400/60"
        : "text-muted-foreground/40";

  const smileColor =
    post.currentUserScore !== null && post.currentUserScore >= 70
      ? "text-emerald-400"
      : post.currentUserScore !== null && post.currentUserScore >= 31
        ? "text-amber-400/60"
        : "text-muted-foreground/40";

  return (
    <div className="animate-fade-in-up">
      <div className="sticky top-14 z-40 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
        <Button variant="ghost" size="icon" aria-label="戻る" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">投稿</h1>
      </div>

      {/* Main post - rich view */}
      <article className="border-b bg-card px-4 pt-4 pb-4">
        {/* Theme name */}
        {post.themeName && (
          <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary mb-2">
            {post.themeName}
          </span>
        )}

        {/* Title */}
        {post.title && (
          <h2 className="text-lg font-bold leading-snug mb-2">{post.title}</h2>
        )}

        {/* Content */}
        <PostContent
          content={post.content}
          className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
        />

        {/* Large Score Spectrum */}
        <div className="mt-5">
          <ScoreSpectrum
            averageScore={post.averageScore}
            userScore={post.currentUserScore}
            reactionCount={post.reactionCount}
            size="md"
          />
        </div>

        {/* Attribute badges */}
        {post.author.attributes.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {post.author.attributes.map((attr) => (
              <AttributeBadge
                key={attr.type}
                type={attr.type}
                value={attr.value}
                size="md"
              />
            ))}
          </div>
        )}

        {/* Author row */}
        <div className="mt-4 flex items-center gap-2">
          <Link href={`/users/${post.author.handle}`} className="flex items-center gap-2 hover:text-foreground">
            <UserAvatar
              src={post.author.avatarUrl}
              displayName={post.author.displayName}
              size="sm"
            />
            <div>
              <p className="text-sm font-medium">{post.author.displayName}</p>
              <p className="text-xs text-muted-foreground">@{post.author.handle} · {formatRelativeTime(post.createdAt)}</p>
            </div>
          </Link>
        </div>

        {/* Reaction slider (larger) */}
        <div className="mt-4">
          <div className="flex items-center gap-2">
            <Frown className={cn("h-5 w-5 shrink-0 transition-colors", frownColor)} />
            <ReactionSlider
              value={post.currentUserScore}
              onChange={(score) => handleReaction(post.id, score)}
              onRemove={() => handleReactionRemove(post.id)}
              disabled={post.isOwnPost}
              showAverage={post.reactionCount > 0}
              averageScore={post.averageScore}
            />
            <Smile className={cn("h-5 w-5 shrink-0 transition-colors", smileColor)} />
          </div>
        </div>
      </article>

      {/* Action buttons */}
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <Button
          variant="outline"
          className="flex-1 gap-2"
          onClick={() => setReplyOpen(true)}
        >
          <MessageCircle className="h-4 w-4" />
          返信する
        </Button>
        {post.isOwnPost && (
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/posts/${post.id}/analysis`}>
              <BarChart3 className="h-4 w-4" />
              分析
            </Link>
          </Button>
        )}
      </div>

      {/* Replies - compact cards */}
      <div>
        {replies.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            まだ返信がありません
          </div>
        ) : (
          <div>
            <p className="px-4 pt-4 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              返信 ({replies.length}件)
            </p>
            {replies.map((reply) => (
              <PostCard
                key={reply.id}
                id={reply.id}
                author={reply.author}
                title={reply.title}
                content={reply.content}
                createdAt={reply.createdAt}
                reactionCount={reply.reactionCount}
                averageScore={reply.averageScore}
                currentUserScore={reply.currentUserScore}
                replyCount={reply.replyCount}
                repostCount={reply.repostCount}
                isOwnPost={reply.isOwnPost}
                onReaction={(score) => handleReaction(reply.id, score)}
                onReactionRemove={() => handleReactionRemove(reply.id)}
                onRepost={() => handleRepost(reply.id)}
              />
            ))}
          </div>
        )}
      </div>

      <ComposeModal
        open={replyOpen}
        onOpenChange={setReplyOpen}
        onSubmit={handleReply}
        replyTo={{ id: post.id, author: post.author.displayName }}
      />
    </div>
  );
}
