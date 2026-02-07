"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { Loader2, MessageCircle, ArrowLeft, BarChart3 } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ComposeModal } from "@/components/post/ComposeModal";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

// API response shape from GET /api/posts/:id
interface PostApiResponse {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  goodCount: number;
  badCount?: number;
  replyCount: number;
  currentUserReaction: "good" | "bad" | null;
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
  content: string;
  created_at: string;
  user_id: string;
  goodCount: number;
  badCount?: number;
  replyCount: number;
  currentUserReaction: "good" | "bad" | null;
  author: {
    user_handle: string;
    display_name: string;
    avatar_url: string | null;
  } | null;
}

interface PostDisplay {
  id: string;
  content: string;
  createdAt: string;
  goodCount: number;
  badCount?: number;
  replyCount: number;
  repostCount: number;
  userReaction: "good" | "bad" | null;
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
  const [post, setPost] = useState<PostDisplay | null>(null);
  const [replies, setReplies] = useState<PostDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyOpen, setReplyOpen] = useState(false);

  function mapPostResponse(data: PostApiResponse): PostDisplay {
    return {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      goodCount: data.goodCount ?? 0,
      badCount: data.badCount,
      replyCount: data.replyCount ?? 0,
      repostCount: 0,
      userReaction: data.currentUserReaction,
      isOwnPost: data.badCount !== undefined,
      author: {
        handle: data.author?.user_handle ?? "",
        displayName: data.author?.display_name ?? "",
        avatarUrl: data.author?.avatar_url ?? null,
        attributes: [],
      },
    };
  }

  function mapReplyResponse(data: ReplyApiResponse): PostDisplay {
    return {
      id: data.id,
      content: data.content,
      createdAt: data.created_at,
      goodCount: data.goodCount ?? 0,
      badCount: data.badCount,
      replyCount: data.replyCount ?? 0,
      repostCount: 0,
      userReaction: data.currentUserReaction,
      isOwnPost: data.badCount !== undefined,
      author: {
        handle: data.author?.user_handle ?? "",
        displayName: data.author?.display_name ?? "",
        avatarUrl: data.author?.avatar_url ?? null,
        attributes: [],
      },
    };
  }

  const fetchPost = useCallback(async () => {
    try {
      const postData = await apiFetch<PostApiResponse>(`/api/posts/${id}`);
      setPost(mapPostResponse(postData));

      // Fetch replies separately since GET /api/posts/:id does not include them
      const repliesData = await apiFetch<{ items: ReplyApiResponse[]; nextCursor: string | null }>(
        `/api/posts/${id}/replies`
      );
      setReplies((repliesData.items ?? []).map(mapReplyResponse));
    } catch {
      // handle error
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
      // handle error
    }
  }

  async function handleReaction(postId: string, type: "good" | "bad") {
    try {
      await apiFetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ reactionType: type }),
      });
      fetchPost();
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  return (
    <div>
      <div className="sticky top-14 z-40 flex items-center gap-3 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold">投稿</h1>
      </div>

      <PostCard
        id={post.id}
        author={post.author}
        content={post.content}
        createdAt={post.createdAt}
        goodCount={post.goodCount}
        badCount={post.isOwnPost ? post.badCount : undefined}
        replyCount={post.replyCount}
        repostCount={post.repostCount}
        isOwnPost={post.isOwnPost}
        userReaction={post.userReaction}
        themeName={post.themeName}
        onGood={() => handleReaction(post.id, "good")}
        onBad={() => handleReaction(post.id, "bad")}
      />

      {post.isOwnPost && (
        <div className="border-b px-4 py-3">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <Link href={`/posts/${post.id}/analysis`}>
              <BarChart3 className="h-4 w-4" />
              分析を見る
            </Link>
          </Button>
        </div>
      )}

      <div className="border-b px-4 py-3">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => setReplyOpen(true)}
        >
          <MessageCircle className="h-4 w-4" />
          返信する
        </Button>
      </div>

      <div>
        {replies.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            まだ返信がありません
          </div>
        ) : (
          replies.map((reply) => (
            <PostCard
              key={reply.id}
              id={reply.id}
              author={reply.author}
              content={reply.content}
              createdAt={reply.createdAt}
              goodCount={reply.goodCount}
              badCount={reply.isOwnPost ? reply.badCount : undefined}
              replyCount={reply.replyCount}
              repostCount={reply.repostCount}
              isOwnPost={reply.isOwnPost}
              userReaction={reply.userReaction}
              onGood={() => handleReaction(reply.id, "good")}
              onBad={() => handleReaction(reply.id, "bad")}
            />
          ))
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
