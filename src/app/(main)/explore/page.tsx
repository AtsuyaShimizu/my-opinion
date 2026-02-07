"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Globe } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/common/EmptyState";
import { InfiniteScroll } from "@/components/common/InfiniteScroll";
import { apiFetch } from "@/lib/api/client";

interface TimelinePost {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  goodCount: number;
  badCount?: number;
  currentUserReaction: "good" | "bad" | null;
  author: {
    user_handle: string;
    display_name: string;
    avatar_url: string | null;
    attributes: Record<string, string | null> | null;
  } | null;
}

function mapAttributes(attrs: Record<string, string | null> | null) {
  if (!attrs) return [];
  const typeMap: Record<string, "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party"> = {
    gender: "gender", age_range: "age_range", education: "education",
    occupation: "occupation", political_stance: "political_stance", political_party: "political_party",
  };
  return Object.entries(attrs)
    .filter(([key, val]) => val != null && key in typeMap)
    .map(([key, val]) => ({ type: typeMap[key], value: val as string }));
}

export default function ExplorePage() {
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchPosts = useCallback(async (cursorParam?: string | null) => {
    try {
      const url = cursorParam
        ? `/api/timeline/explore?cursor=${cursorParam}`
        : "/api/timeline/explore";
      const data = await apiFetch<{ items: TimelinePost[]; nextCursor: string | null }>(url);
      if (cursorParam) {
        setPosts((prev) => [...prev, ...data.items]);
      } else {
        setPosts(data.items);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      setHasMore(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPosts().finally(() => setLoading(false));
  }, [fetchPosts]);

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(cursor).finally(() => setLoadingMore(false));
  }

  async function handleReaction(postId: string, type: "good" | "bad") {
    try {
      await apiFetch(`/api/posts/${postId}/reactions`, {
        method: "POST",
        body: JSON.stringify({ reactionType: type }),
      });
      fetchPosts();
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

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
        <h1 className="text-lg font-bold">探索</h1>
      </div>

      {posts.length === 0 ? (
        <EmptyState
          icon={Globe}
          title="投稿がまだありません"
          description="最初の投稿を作成してみましょう。"
        />
      ) : (
        <InfiniteScroll
          hasMore={hasMore}
          isLoading={loadingMore}
          onLoadMore={handleLoadMore}
        >
          {posts.map((post) => (
            <PostCard
              key={post.id}
              id={post.id}
              author={{
                handle: post.author?.user_handle ?? "",
                displayName: post.author?.display_name ?? "",
                avatarUrl: post.author?.avatar_url ?? null,
                attributes: mapAttributes(post.author?.attributes ?? null),
              }}
              content={post.content}
              createdAt={post.created_at}
              goodCount={post.goodCount}
              badCount={post.badCount}
              replyCount={0}
              repostCount={0}
              isOwnPost={post.badCount !== undefined}
              userReaction={post.currentUserReaction}
              onGood={() => handleReaction(post.id, "good")}
              onBad={() => handleReaction(post.id, "bad")}
            />
          ))}
        </InfiniteScroll>
      )}
    </div>
  );
}
