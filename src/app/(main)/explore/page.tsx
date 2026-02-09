"use client";

import { useState, useEffect, useCallback } from "react";
import { Globe, Search } from "lucide-react";
import { OpinionTile } from "@/components/post/OpinionTile";
import { TopicCard } from "@/components/theme/TopicCard";
import { UserCard } from "@/components/user/UserCard";
import { AttributeLensBar } from "@/components/filter/AttributeLensBar";
import { EmptyState } from "@/components/common/EmptyState";
import { InfiniteScroll } from "@/components/common/InfiniteScroll";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { apiFetch } from "@/lib/api/client";
import { mapAttributes } from "@/lib/utils/mapAttributes";
import { useAuth } from "@/hooks/useAuth";
import { useReactionHandler } from "@/hooks/useReactionHandler";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TimelinePost {
  id: string;
  title?: string | null;
  content: string;
  created_at: string;
  user_id: string;
  reactionCount: number;
  averageScore: number | null;
  currentUserScore: number | null;
  author: {
    user_handle: string;
    display_name: string;
    avatar_url: string | null;
    attributes: Record<string, string | null> | null;
  } | null;
}

interface ThemeItem {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  participantCount: number;
  consensusScore?: number;
  status: "active" | "ended";
}

interface UserItem {
  user_handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  attributes?: { type: "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party"; value: string }[];
}

type ExploreTab = "themes" | "posts" | "users";
type SortMode = "latest" | "popular" | "controversial";

export default function ExplorePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ExploreTab>("themes");
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [themes, setThemes] = useState<ThemeItem[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [sort, setSort] = useState<SortMode>("latest");
  const [filters, setFilters] = useState<Record<string, string>>({});

  // -- Theme fetching --
  const fetchThemes = useCallback(async () => {
    try {
      const data = await apiFetch<ThemeItem[]>("/api/themes");
      setThemes(data);
    } catch {
      toast.error("テーマの取得に失敗しました");
    }
  }, []);

  // -- Post fetching --
  const buildPostUrl = useCallback(
    (cursorParam?: string | null) => {
      const params = new URLSearchParams();
      if (cursorParam) params.set("cursor", cursorParam);
      params.set("sort", sort);
      for (const [key, val] of Object.entries(filters)) {
        params.set(key, val);
      }
      return `/api/timeline/explore?${params.toString()}`;
    },
    [sort, filters]
  );

  const fetchPosts = useCallback(
    async (cursorParam?: string | null) => {
      try {
        const url = buildPostUrl(cursorParam);
        const data = await apiFetch<{
          items: TimelinePost[];
          nextCursor: string | null;
        }>(url);
        if (cursorParam) {
          setPosts((prev) => [...prev, ...data.items]);
        } else {
          setPosts(data.items);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch {
        setHasMore(false);
        toast.error("投稿の取得に失敗しました");
      }
    },
    [buildPostUrl]
  );

  // -- User fetching --
  const fetchUsers = useCallback(async () => {
    try {
      const data = await apiFetch<UserItem[]>("/api/users/suggested");
      setUsers(data);
    } catch {
      toast.error("ユーザーの取得に失敗しました");
    }
  }, []);

  // Fetch on tab change
  useEffect(() => {
    setLoading(true);
    setCursor(null);
    setHasMore(true);

    if (activeTab === "themes") {
      fetchThemes().finally(() => setLoading(false));
    } else if (activeTab === "posts") {
      fetchPosts().finally(() => setLoading(false));
    } else {
      fetchUsers().finally(() => setLoading(false));
    }
  }, [activeTab, fetchThemes, fetchPosts, fetchUsers]);

  // Refetch posts when sort/filters change
  useEffect(() => {
    if (activeTab === "posts") {
      setLoading(true);
      setCursor(null);
      setHasMore(true);
      setPosts([]);
      fetchPosts().finally(() => setLoading(false));
    }
  }, [sort, filters, activeTab, fetchPosts]);

  // Listen for new posts
  useEffect(() => {
    function handlePostCreated() {
      if (activeTab === "posts") fetchPosts();
    }
    window.addEventListener("post-created", handlePostCreated);
    return () => window.removeEventListener("post-created", handlePostCreated);
  }, [fetchPosts, activeTab]);

  const { handleReaction, handleReactionRemove } = useReactionHandler(setPosts, fetchPosts);

  function handleLoadMore() {
    if (loadingMore || !hasMore || activeTab !== "posts") return;
    setLoadingMore(true);
    fetchPosts(cursor).finally(() => setLoadingMore(false));
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold">探索</h1>
        </div>

        {/* Tab bar */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ExploreTab)}
        >
          <TabsList className="mx-4 mb-2 w-[calc(100%-2rem)]">
            <TabsTrigger value="themes" className="flex-1">
              トピック
            </TabsTrigger>
            <TabsTrigger value="posts" className="flex-1">
              意見
            </TabsTrigger>
            <TabsTrigger value="users" className="flex-1">
              ユーザー
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Sort tabs for posts - with controversial */}
        {activeTab === "posts" && (
          <div className="flex border-t">
            {(["latest", "popular", "controversial"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  if (mode !== sort) {
                    setSort(mode);
                    setPosts([]);
                  }
                }}
                className={cn(
                  "relative flex-1 py-2.5 text-sm font-medium transition-colors",
                  sort === mode
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {mode === "latest" ? "最新" : mode === "popular" ? "人気" : "意見が割れている"}
                {sort === mode && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        )}

        {/* Attribute lens bar */}
        {(activeTab === "posts" || activeTab === "themes") && (
          <div className="border-t">
            <AttributeLensBar
              activeFilters={filters}
              onFilterChange={setFilters}
              onClear={() => setFilters({})}
            />
          </div>
        )}
      </div>

      {/* Themes tab - TopicCard grid */}
      {activeTab === "themes" && (
        <>
          {loading ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : themes.length === 0 ? (
            <EmptyState
              icon={Globe}
              title="トピックがまだありません"
              description="管理者がトピックを作成するとここに表示されます。"
            />
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              {themes.map((theme) => (
                <TopicCard
                  key={theme.id}
                  id={theme.id}
                  title={theme.title}
                  description={theme.description}
                  postCount={theme.postCount}
                  participantCount={theme.participantCount}
                  consensusScore={theme.consensusScore ?? 0}
                  status={theme.status}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Posts tab - Masonry layout with OpinionTile */}
      {activeTab === "posts" && (
        <>
          {loading ? (
            <div className="columns-1 gap-4 p-4 sm:columns-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="mb-4 h-48 w-full break-inside-avoid rounded-2xl" />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <EmptyState
              icon={Globe}
              title={
                Object.keys(filters).length > 0
                  ? "条件に合う意見がありません"
                  : "まだ意見がありません"
              }
              description={
                Object.keys(filters).length > 0
                  ? "フィルター条件を変えてみてください。"
                  : "最初の意見を書いてみましょう。"
              }
            />
          ) : (
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={loadingMore}
              onLoadMore={handleLoadMore}
            >
              <div className="columns-1 gap-4 p-4 sm:columns-2">
                {posts.map((post) => (
                  <OpinionTile
                    key={post.id}
                    id={post.id}
                    author={{
                      handle: post.author?.user_handle ?? "",
                      displayName: post.author?.display_name ?? "",
                      avatarUrl: post.author?.avatar_url ?? null,
                      attributes: mapAttributes(post.author?.attributes ?? null),
                    }}
                    title={post.title}
                    content={post.content}
                    createdAt={post.created_at}
                    reactionCount={post.reactionCount}
                    averageScore={post.averageScore}
                    currentUserScore={post.currentUserScore}
                    isOwnPost={user?.id === post.user_id}
                    onReaction={(score) => handleReaction(post.id, score)}
                    onReactionRemove={() => handleReactionRemove(post.id)}
                    className="mb-4"
                  />
                ))}
              </div>
            </InfiniteScroll>
          )}
        </>
      )}

      {/* Users tab */}
      {activeTab === "users" && (
        <>
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon={Search}
              title="ユーザーが見つかりません"
              description="まだユーザーがいないようです。"
            />
          ) : (
            <div className="space-y-3 p-4">
              {users.map((u) => (
                <UserCard
                  key={u.user_handle}
                  handle={u.user_handle}
                  displayName={u.display_name}
                  avatarUrl={u.avatar_url}
                  bio={u.bio}
                  attributes={u.attributes}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
