"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, MessageSquare } from "lucide-react";
import { OpinionTile } from "@/components/post/OpinionTile";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { InfiniteScroll } from "@/components/common/InfiniteScroll";
import { ConsensusMeter } from "@/components/theme/ConsensusMeter";
import { ScoreDistribution } from "@/components/theme/ScoreDistribution";
import { AttributeLensBar } from "@/components/filter/AttributeLensBar";
import { OpinionSpectrum } from "@/components/theme/OpinionSpectrum";
import { ComposeModal } from "@/components/post/ComposeModal";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/api/client";
import { mapAttributes } from "@/lib/utils/mapAttributes";
import { useAuth } from "@/hooks/useAuth";
import { useReactionHandler } from "@/hooks/useReactionHandler";
import { toast } from "sonner";

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

interface ConsensusData {
  score: number;
  label?: string;
  attributeBreakdown?: {
    attribute: string;
    label: string;
    score: number;
  }[];
  distribution?: number[];
  userScore?: number | null;
  averageScore?: number | null;
}

interface SpectrumDataPoint {
  postId: string;
  x: number;
  y: number;
  isOwnPost: boolean;
  authorHandle: string;
  contentPreview: string;
  averageScore: number;
  reactionCount: number;
}

type ViewTab = "posts" | "spectrum";

// Fallback labels if API doesn't return them
const X_AXIS_LABELS_FALLBACK: Record<string, string[]> = {
  political_stance: ["左派", "やや左派", "中道", "やや右派", "右派"],
  age_range: ["18-24", "25-29", "30-34", "35-39", "40-44", "45-49", "50+"],
  gender: ["男性", "女性", "その他"],
  occupation: ["会社員", "公務員", "自営業", "学生", "専門職", "教育", "経営者"],
};

export default function ThemeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [theme, setTheme] = useState<ThemeDetail | null>(null);
  const [posts, setPosts] = useState<ThemePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("posts");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [spectrumData, setSpectrumData] = useState<SpectrumDataPoint[]>([]);
  const [spectrumAxis, setSpectrumAxis] = useState("political_stance");
  const [spectrumLabels, setSpectrumLabels] = useState<string[]>([]);
  const [spectrumLoading, setSpectrumLoading] = useState(false);

  const fetchTheme = useCallback(async () => {
    try {
      const data = await apiFetch<ThemeDetail>(`/api/themes/${id}`);
      setTheme(data);
    } catch {
      // handle error
    }
  }, [id]);

  const buildPostUrl = useCallback(
    (cursorParam?: string | null) => {
      const params = new URLSearchParams();
      if (cursorParam) params.set("cursor", cursorParam);
      for (const [key, val] of Object.entries(filters)) {
        params.set(key, val);
      }
      const qs = params.toString();
      return `/api/timeline/theme/${id}${qs ? `?${qs}` : ""}`;
    },
    [id, filters]
  );

  const fetchPosts = useCallback(
    async (cursorParam?: string | null) => {
      try {
        const url = buildPostUrl(cursorParam);
        const data = await apiFetch<{
          theme: ThemeDetail;
          items: ThemePost[];
          nextCursor: string | null;
        }>(url);
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
    },
    [buildPostUrl, theme]
  );

  const fetchConsensus = useCallback(async () => {
    try {
      const data = await apiFetch<ConsensusData>(
        `/api/themes/${id}/consensus`
      );
      setConsensus(data);
    } catch {
      // API may not exist yet
    }
  }, [id]);

  const fetchSpectrum = useCallback(
    async (axis: string) => {
      setSpectrumLoading(true);
      try {
        const data = await apiFetch<{
          points: SpectrumDataPoint[];
          xAxisLabels?: string[];
        }>(`/api/themes/${id}/spectrum?attribute=${axis}`);
        setSpectrumData(data.points);
        setSpectrumLabels(
          data.xAxisLabels ?? X_AXIS_LABELS_FALLBACK[axis] ?? []
        );
      } catch {
        setSpectrumData([]);
        setSpectrumLabels(X_AXIS_LABELS_FALLBACK[axis] ?? []);
      } finally {
        setSpectrumLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchTheme(), fetchPosts(), fetchConsensus()]).finally(() =>
      setLoading(false)
    );
  }, [fetchTheme, fetchPosts, fetchConsensus]);

  // Refetch posts when filters change
  useEffect(() => {
    setPosts([]);
    setCursor(null);
    setHasMore(true);
    fetchPosts();
  }, [filters, fetchPosts]);

  // Fetch spectrum data when tab switches to spectrum or axis changes
  useEffect(() => {
    if (activeTab === "spectrum") {
      fetchSpectrum(spectrumAxis);
    }
  }, [activeTab, spectrumAxis, fetchSpectrum]);

  const { handleReaction, handleReactionRemove } = useReactionHandler(setPosts, fetchPosts);

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(cursor).finally(() => setLoadingMore(false));
  }

  async function handleCompose(content: string, title?: string) {
    try {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content, title: title || undefined, themeId: id }),
      });
      fetchPosts();
      fetchTheme();
      fetchConsensus();
    } catch {
      toast.error("投稿に失敗しました");
    }
  }

  if (loading) {
    return (
      <div>
        <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="h-5 w-40 animate-shimmer rounded bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          </div>
        </div>
        <div className="space-y-4 p-4">
          <div className="h-32 animate-shimmer rounded-xl bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!theme) {
    return (
      <EmptyState
        title="トピックが見つかりません"
        description="トピックが削除されたか、存在しないURLです。"
      />
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">{theme.title}</h1>
          <Badge
            variant={theme.status === "active" ? "default" : "secondary"}
            className="ml-auto"
          >
            {theme.status === "active" ? "投稿受付中" : "終了"}
          </Badge>
        </div>
      </div>

      {/* Theme info */}
      {theme.description && (
        <div className="border-b px-4 py-4">
          <p className="text-sm text-muted-foreground">{theme.description}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            {theme.postCount} 件の投稿
          </p>
        </div>
      )}

      <div className="space-y-4 p-4">
        {/* Consensus Dashboard */}
        {consensus && (
          <div className="space-y-4">
            <ConsensusMeter
              score={consensus.score}
              label={consensus.label}
              attributeBreakdown={consensus.attributeBreakdown}
            />

            {/* Score Distribution Histogram */}
            {consensus.distribution && consensus.distribution.length > 0 && (
              <div className="rounded-xl border bg-card p-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  スコア分布
                </p>
                <ScoreDistribution
                  distribution={consensus.distribution}
                  userScore={consensus.userScore ?? null}
                  averageScore={consensus.averageScore ?? null}
                />
              </div>
            )}
          </div>
        )}

        {/* View tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as ViewTab)}
        >
          <TabsList className="w-full">
            <TabsTrigger value="posts" className="flex-1">
              みんなの声
            </TabsTrigger>
            <TabsTrigger value="spectrum" className="flex-1">
              意見マップ
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Posts tab - Masonry layout */}
      {activeTab === "posts" && (
        <>
          <div className="border-b">
            <AttributeLensBar
              activeFilters={filters}
              onFilterChange={setFilters}
              onClear={() => setFilters({})}
            />
          </div>

          {theme.status === "active" && (
            <div className="border-b px-4 py-3">
              <Button
                className="w-full gap-2"
                onClick={() => setComposeOpen(true)}
              >
                <MessageSquare className="h-4 w-4" />
                このトピックに意見を書く
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
                title="まだ意見がありません"
                description="最初の意見を書いてみましょう。"
              />
            ) : (
              <div className="columns-1 gap-4 p-4 sm:columns-2">
                {posts.map((post) => (
                  <OpinionTile
                    key={post.id}
                    id={post.id}
                    author={{
                      handle: post.author?.user_handle ?? "",
                      displayName: post.author?.display_name ?? "",
                      avatarUrl: post.author?.avatar_url ?? null,
                      attributes: mapAttributes(
                        post.author?.attributes ?? null
                      ),
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
                    themeName={theme.title}
                    className="mb-4"
                  />
                ))}
              </div>
            )}
          </InfiniteScroll>
        </>
      )}

      {/* Spectrum tab */}
      {activeTab === "spectrum" && (
        <div className="p-4">
          <OpinionSpectrum
            data={spectrumData}
            xAxisAttribute={spectrumAxis}
            xAxisLabels={spectrumLabels}
            onAttributeChange={setSpectrumAxis}
            onPostClick={(postId) => router.push(`/posts/${postId}`)}
            loading={spectrumLoading}
          />
        </div>
      )}

      <ComposeModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onSubmit={handleCompose}
        defaultThemeId={id}
        defaultThemeName={theme.title}
      />
    </div>
  );
}
