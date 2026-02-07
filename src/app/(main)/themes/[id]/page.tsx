"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/common/EmptyState";
import { InfiniteScroll } from "@/components/common/InfiniteScroll";
import { ComposeModal } from "@/components/post/ComposeModal";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";

interface ThemeDetail {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "ended";
}

interface ThemePost {
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

export default function ThemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [posts, setPosts] = useState<ThemePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const fetchTheme = useCallback(async () => {
    try {
      const data = await apiFetch<ThemeDetail>(`/api/themes/${id}`);
      setTheme(data);
    } catch {
      // handle error
    }
  }, [id]);

  const fetchPosts = useCallback(async (cursorParam?: string | null) => {
    try {
      const url = cursorParam
        ? `/api/timeline/theme/${id}?cursor=${cursorParam}`
        : `/api/timeline/theme/${id}`;
      const data = await apiFetch<{ theme: ThemeDetail; items: ThemePost[]; nextCursor: string | null }>(url);
      if (!theme) {
        setTheme(data.theme);
      }
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
  }, [id, theme]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTheme(), fetchPosts()]).finally(() =>
      setLoading(false)
    );
  }, [fetchTheme, fetchPosts]);

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(cursor).finally(() => setLoadingMore(false));
  }

  async function handleCompose(content: string) {
    try {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content, themeId: id }),
      });
      fetchPosts();
      fetchTheme();
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

  if (!theme) {
    return (
      <EmptyState
        title="テーマが見つかりません"
        description="テーマが削除されたか、存在しないURLです。"
      />
    );
  }

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">{theme.title}</h1>
        </div>
      </div>

      {theme.description && (
        <div className="border-b px-4 py-4">
          <p className="text-sm text-muted-foreground">{theme.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {theme.postCount} 件の投稿
          </p>
        </div>
      )}

      {theme.status === "active" && (
        <div className="border-b px-4 py-3">
          <Button
            className="w-full gap-2"
            onClick={() => setComposeOpen(true)}
          >
            <MessageSquare className="h-4 w-4" />
            このテーマに投稿する
          </Button>
        </div>
      )}

      <InfiniteScroll
        hasMore={hasMore}
        isLoading={loadingMore}
        onLoadMore={handleLoadMore}
      >
        {posts.length === 0 ? (
          <EmptyState
            title="まだ投稿がありません"
            description="最初の投稿を作成してみましょう。"
          />
        ) : (
          posts.map((post) => (
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
            />
          ))
        )}
      </InfiniteScroll>

      <ComposeModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onSubmit={handleCompose}
      />
    </div>
  );
}
