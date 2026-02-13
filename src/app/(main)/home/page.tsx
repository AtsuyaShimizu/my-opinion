"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Handshake, Orbit, Waves } from "lucide-react";
import { FeaturedTopicHero } from "@/components/theme/FeaturedTopicHero";
import { TopicCard } from "@/components/theme/TopicCard";
import { OpinionCardCompact } from "@/components/post/OpinionCardCompact";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { ComposeModal } from "@/components/post/ComposeModal";
import { EmptyState } from "@/components/common/EmptyState";
import { apiFetch } from "@/lib/api/client";
import { mapAttributes } from "@/lib/utils/mapAttributes";
import { toast } from "sonner";

interface ThemeWithConsensus {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  participantCount: number;
  consensusScore: number;
  start_date: string;
  end_date: string | null;
  status: "active" | "ended";
}

interface TimelinePost {
  id: string;
  title?: string | null;
  content: string;
  created_at: string;
  user_id: string;
  reactionCount: number;
  averageScore: number | null;
  currentUserScore: number | null;
  repost_of_id?: string | null;
  author: {
    user_handle: string;
    display_name: string;
    avatar_url: string | null;
    attributes: Record<string, string | null> | null;
  } | null;
}

export default function HomePage() {
  const [featured, setFeatured] = useState<ThemeWithConsensus | null>(null);
  const [trending, setTrending] = useState<ThemeWithConsensus[]>([]);
  const [posts, setPosts] = useState<TimelinePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeThemeId, setComposeThemeId] = useState<string | undefined>();
  const [composeThemeName, setComposeThemeName] = useState<string | undefined>();

  const fetchData = useCallback(async () => {
    try {
      const [themeData, timelineData] = await Promise.all([
        apiFetch<{ featured: ThemeWithConsensus | null; trending: ThemeWithConsensus[] }>("/api/themes/featured").catch(() => null),
        apiFetch<{ items: TimelinePost[]; nextCursor: string | null }>("/api/timeline/home").catch(() => null),
      ]);

      if (themeData) {
        setFeatured(themeData.featured);
        setTrending(themeData.trending);
      } else {
        setFeatured(null);
        setTrending([]);
      }

      if (timelineData) {
        setPosts(timelineData.items.slice(0, 4));
      } else {
        setPosts([]);
      }
    } catch {
      // Silent fallback
    }
  }, []);

  const loadHome = useCallback(async () => {
    setLoading(true);
    try {
      await fetchData();
    } finally {
      setLoading(false);
    }
  }, [fetchData]);

  useEffect(() => {
    void loadHome();
  }, [loadHome]);

  useEffect(() => {
    function handlePostCreated() {
      fetchData();
    }
    window.addEventListener("post-created", handlePostCreated);
    return () => window.removeEventListener("post-created", handlePostCreated);
  }, [fetchData]);

  function handleParticipate(themeId: string, themeName: string) {
    setComposeThemeId(themeId);
    setComposeThemeName(themeName);
    setComposeOpen(true);
  }

  async function handleCompose(content: string, title?: string) {
    try {
      await apiFetch("/api/posts", {
        method: "POST",
        body: JSON.stringify({ content, title: title || undefined, themeId: composeThemeId }),
      });
      fetchData();
    } catch {
      toast.error("意見の投稿に失敗しました");
    }
  }

  const groupedThemes = useMemo(() => {
    const unique = new Map<string, ThemeWithConsensus>();
    for (const theme of featured ? [featured, ...trending] : trending) {
      unique.set(theme.id, theme);
    }
    const all = Array.from(unique.values());

    return {
      divided: all.filter((t) => t.consensusScore < 40).slice(0, 4),
      activeDebate: all.filter((t) => t.consensusScore >= 40 && t.consensusScore < 70).slice(0, 4),
      converging: all.filter((t) => t.consensusScore >= 70).slice(0, 4),
    };
  }, [featured, trending]);

  if (loading) {
    return (
      <div>
        <div className="sticky top-14 z-40 border-b bg-background/90 px-4 py-3 backdrop-blur lg:top-0">
          <h1 className="text-xl font-bold">オピニオン観測所</h1>
        </div>
        <div className="space-y-4 p-4">
          <div className="h-56 animate-shimmer rounded-3xl bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-44 animate-shimmer rounded-2xl bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="sticky top-14 z-40 border-b bg-background/90 px-4 py-3 backdrop-blur lg:top-0">
        <h1 className="text-xl font-bold">オピニオン観測所</h1>
      </div>

      <div className="space-y-8 p-4">
        {featured ? (
          <section>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Orbit className="h-3.5 w-3.5" />
              観測中のメイントピック
            </p>
            <FeaturedTopicHero
              theme={featured}
              onParticipate={() => handleParticipate(featured.id, featured.title)}
            />
          </section>
        ) : (
          <EmptyState
            title="観測中のトピックがありません"
            description="運営が新しいトピックを公開すると、ここから参加できます。"
          />
        )}

        <section>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            温度差で見るトピック
          </p>
          <div className="space-y-6">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-rose-600 dark:text-rose-300">
                <AlertTriangle className="h-4 w-4" />
                分断中
              </p>
              {groupedThemes.divided.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {groupedThemes.divided.map((theme) => (
                    <TopicCard
                      key={theme.id}
                      id={theme.id}
                      title={theme.title}
                      description={theme.description}
                      postCount={theme.postCount}
                      participantCount={theme.participantCount}
                      consensusScore={theme.consensusScore}
                      status={theme.status}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
                  分断が大きいトピックはまだありません
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-300">
                <Waves className="h-4 w-4" />
                収束中
              </p>
              {groupedThemes.activeDebate.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {groupedThemes.activeDebate.map((theme) => (
                    <TopicCard
                      key={theme.id}
                      id={theme.id}
                      title={theme.title}
                      description={theme.description}
                      postCount={theme.postCount}
                      participantCount={theme.participantCount}
                      consensusScore={theme.consensusScore}
                      status={theme.status}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
                  収束中のトピックはまだありません
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-300">
                <Handshake className="h-4 w-4" />
                合意形成
              </p>
              {groupedThemes.converging.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {groupedThemes.converging.map((theme) => (
                    <TopicCard
                      key={theme.id}
                      id={theme.id}
                      title={theme.title}
                      description={theme.description}
                      postCount={theme.postCount}
                      participantCount={theme.participantCount}
                      consensusScore={theme.consensusScore}
                      status={theme.status}
                    />
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-border/70 bg-card/70 px-4 py-3 text-sm text-muted-foreground">
                  合意形成が進んだトピックはまだありません
                </p>
              )}
            </div>
          </div>
        </section>

        {posts.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              最近の声
            </p>
            <div className="space-y-3">
              {posts.map((post) => (
                <OpinionCardCompact
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
                  averageScore={post.averageScore}
                />
              ))}
            </div>
            <div className="mt-3 text-center">
              <Link href="/explore" className="text-sm font-medium text-primary hover:underline">
                もっと意見を探索する
              </Link>
            </div>
          </section>
        )}
      </div>

      <ComposeModal
        open={composeOpen}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) {
            setComposeThemeId(undefined);
            setComposeThemeName(undefined);
          }
        }}
        onSubmit={handleCompose}
        defaultThemeId={composeThemeId}
        defaultThemeName={composeThemeName}
      />
    </div>
  );
}
