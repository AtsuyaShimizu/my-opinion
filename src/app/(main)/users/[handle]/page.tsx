"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { UserAvatar } from "@/components/user/UserAvatar";
import { AttributePanel } from "@/components/user/AttributePanel";
import { PositionMap } from "@/components/user/PositionMap";
import { OpinionTile } from "@/components/post/OpinionTile";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { InfiniteScroll } from "@/components/common/InfiniteScroll";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { mapAttributes } from "@/lib/utils/mapAttributes";
import { useAuth } from "@/hooks/useAuth";
import { useReactionHandler } from "@/hooks/useReactionHandler";
import { ATTRIBUTE_LABELS } from "@/lib/constants";
import { toast } from "sonner";

interface UserProfile {
  id: string;
  user_handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isOwnProfile: boolean;
  attributes: {
    gender: string | null;
    age_range: string | null;
    education: string | null;
    occupation: string | null;
    political_party: string | null;
    political_stance: string | null;
  } | null;
}

interface UserPost {
  id: string;
  title?: string | null;
  content: string;
  created_at: string;
  user_id: string;
  reactionCount: number;
  averageScore: number | null;
  replyCount: number;
  repostCount: number;
  currentUserScore: number | null;
  author: {
    user_handle: string;
    display_name: string;
    avatar_url: string | null;
    attributes: Record<string, string | null> | null;
  } | null;
}

function ProfileSkeleton() {
  return (
    <div>
      <div className="px-4 py-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2 pt-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-9 w-24 rounded-full" />
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
        <div className="mt-4 flex gap-5">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <div className="border-t" />
      {Array.from({ length: 3 }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </div>
  );
}

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [positionData, setPositionData] = useState<{
    axes: { themeTitle: string; score: number }[];
    echoChamberScore: number | null;
    message: string;
  } | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch<UserProfile>(`/api/users/${handle}`);
      setProfile(data);
    } catch {
      toast.error("プロフィールの取得に失敗しました");
    }
  }, [handle]);

  const fetchPosts = useCallback(async (cursorParam?: string | null) => {
    try {
      const url = cursorParam
        ? `/api/users/${handle}/posts?cursor=${cursorParam}`
        : `/api/users/${handle}/posts`;
      const data = await apiFetch<{ items: UserPost[]; nextCursor: string | null }>(url);
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
  }, [handle]);

  const fetchPositionData = useCallback(async () => {
    try {
      const data = await apiFetch<{
        axes: { themeTitle: string; score: number }[];
        echoChamberScore: number | null;
        message: string;
      }>("/api/users/me/position-map");
      setPositionData(data);
    } catch {
      // API may not exist yet
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfile(), fetchPosts()]).finally(() =>
      setLoading(false)
    );
  }, [fetchProfile, fetchPosts]);

  // Fetch position data for own profile after profile loads
  useEffect(() => {
    if (profile?.isOwnProfile) {
      fetchPositionData();
    }
  }, [profile?.isOwnProfile, fetchPositionData]);

  // Listen for posts created from the right-side ComposePanel
  useEffect(() => {
    function handlePostCreated() {
      fetchPosts();
    }
    window.addEventListener("post-created", handlePostCreated);
    return () => window.removeEventListener("post-created", handlePostCreated);
  }, [fetchPosts]);

  const { handleReaction, handleReactionRemove } = useReactionHandler(setPosts, fetchPosts);

  async function handleFollow() {
    if (!profile || followLoading) return;
    setFollowLoading(true);

    // Optimistic update
    setProfile((prev) =>
      prev
        ? {
            ...prev,
            isFollowing: !prev.isFollowing,
            followerCount: prev.followerCount + (prev.isFollowing ? -1 : 1),
          }
        : prev
    );

    try {
      if (profile.isFollowing) {
        await apiFetch(`/api/follows/${profile.id}`, { method: "DELETE" });
      } else {
        await apiFetch(`/api/follows/${profile.id}`, { method: "POST" });
      }
    } catch {
      fetchProfile();
      toast.error("フォロー操作に失敗しました");
    } finally {
      setFollowLoading(false);
    }
  }

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(cursor).finally(() => setLoadingMore(false));
  }

  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return (
      <EmptyState
        title="ユーザーが見つかりません"
        description="ユーザーが存在しないか、アカウントが停止されています。"
      />
    );
  }

  const publicAttrs: { type: "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party"; value: string }[] = [];
  if (profile.attributes) {
    for (const [key, value] of Object.entries(profile.attributes)) {
      if (value && ATTRIBUTE_LABELS[key]?.[value]) {
        publicAttrs.push({
          type: key as "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party",
          value: ATTRIBUTE_LABELS[key][value],
        });
      }
    }
  }

  return (
    <div className="animate-fade-in-up">
      {/* Profile Header */}
      <div className="relative">
        {/* Subtle gradient banner */}
        <div className="h-24 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />

        <div className="px-4 pb-5">
          {/* Avatar overlaps banner */}
          <div className="-mt-10 flex items-end justify-between">
            <div className="rounded-full border-4 border-background bg-background">
              <UserAvatar
                src={profile.avatar_url}
                displayName={profile.display_name}
                size="lg"
              />
            </div>
            {profile.isOwnProfile ? (
              <Button variant="outline" size="sm" className="rounded-full" asChild>
                <Link href="/settings/profile">プロフィールを編集</Link>
              </Button>
            ) : (
              <Button
                variant={profile.isFollowing ? "outline" : "default"}
                size="sm"
                className={cn(
                  "rounded-full min-w-[100px] transition-all duration-200",
                  profile.isFollowing && "hover:border-destructive hover:text-destructive"
                )}
                onClick={handleFollow}
                disabled={followLoading}
              >
                {profile.isFollowing ? "フォロー中" : "フォローする"}
              </Button>
            )}
          </div>

          {/* Name & handle */}
          <div className="mt-3">
            <h1 className="text-xl font-bold leading-tight">{profile.display_name}</h1>
            <p className="text-sm text-muted-foreground">@{profile.user_handle}</p>
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
          )}

          {/* Attribute Panel (grid layout) */}
          {publicAttrs.length > 0 && (
            <div className="mt-4">
              <AttributePanel attributes={publicAttrs} />
            </div>
          )}

          {/* Follower/Following counts */}
          <div className="mt-4 flex gap-5 text-sm">
            <Link
              href={`/users/${profile.user_handle}/follows?tab=following`}
              className="transition-colors hover:text-foreground"
            >
              <span className="font-bold">{profile.followingCount}</span>{" "}
              <span className="text-muted-foreground">フォロー中</span>
            </Link>
            <Link
              href={`/users/${profile.user_handle}/follows?tab=followers`}
              className="transition-colors hover:text-foreground"
            >
              <span className="font-bold">{profile.followerCount}</span>{" "}
              <span className="text-muted-foreground">フォロワー</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Position Map (own profile only) */}
      {profile.isOwnProfile && positionData && (
        <div className="border-b px-4 py-5">
          <PositionMap
            axes={positionData.axes}
            echoChamberScore={positionData.echoChamberScore}
            echoChamberMessage={positionData.message}
          />
        </div>
      )}

      {/* Tab-style divider */}
      <div className="border-b">
        <div className="flex justify-center">
          <span className="border-b-2 border-primary px-6 py-3 text-sm font-semibold">
            意見
          </span>
        </div>
      </div>

      {/* Posts - Masonry layout */}
      <InfiniteScroll
        hasMore={hasMore}
        isLoading={loadingMore}
        onLoadMore={handleLoadMore}
      >
        {posts.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-muted-foreground">
            まだ意見がありません
          </div>
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
        )}
      </InfiniteScroll>
    </div>
  );
}
