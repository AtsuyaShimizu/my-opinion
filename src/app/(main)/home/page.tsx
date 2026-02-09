"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { FeaturedTopicHero } from "@/components/theme/FeaturedTopicHero";
import { TopicCard } from "@/components/theme/TopicCard";
import { OpinionCardCompact } from "@/components/post/OpinionCardCompact";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { ComposeModal } from "@/components/post/ComposeModal";
import { apiFetch } from "@/lib/api/client";
import { mapAttributes } from "@/lib/utils/mapAttributes";
import { useAuth } from "@/hooks/useAuth";
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
  const { user } = useAuth();
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
        apiFetch<{ featured: ThemeWithConsensus; trending: ThemeWithConsensus[] }>("/api/themes/featured").catch(() => null),
        apiFetch<{ items: TimelinePost[]; nextCursor: string | null }>("/api/timeline/home").catch(() => null),
      ]);

      if (themeData) {
        setFeatured(themeData.featured);
        setTrending(themeData.trending);
      }
      if (timelineData) {
        setPosts(timelineData.items.slice(0, 3));
      }
    } catch {
      // Silent
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]);

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
      toast.error("投稿に失敗しました");
    }
  }

  if (loading) {
    return (
      <div>
        <div className="sticky top-14 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
          <h1 className="text-xl font-bold">トピック</h1>
        </div>
        <div className="space-y-4 p-4">
          <div className="h-48 animate-shimmer rounded-2xl bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-40 animate-shimmer rounded-2xl bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]" />
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
      <div className="sticky top-14 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
        <h1 className="text-xl font-bold">トピック</h1>
      </div>

      <div className="space-y-8 p-4">
        {/* Featured Topic Hero */}
        {featured && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              いま話題のトピック
            </p>
            <FeaturedTopicHero
              theme={featured}
              onParticipate={() => handleParticipate(featured.id, featured.title)}
            />
          </section>
        )}

        {/* Topic grid */}
        {trending.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              注目のトピック
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {trending.map((theme) => (
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
          </section>
        )}

        {/* Recent from following - compact cards */}
        {posts.length > 0 && (
          <section>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              フォロー中の最新
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
              <Link href="/explore?tab=posts" className="text-sm font-medium text-primary hover:underline">
                もっと見る
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
