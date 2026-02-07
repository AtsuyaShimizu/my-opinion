"use client";

import { useState, useEffect, useCallback, use } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/user/UserAvatar";
import { AttributeBadge } from "@/components/user/AttributeBadge";
import { PostCard } from "@/components/post/PostCard";
import { EmptyState } from "@/components/common/EmptyState";
import { InfiniteScroll } from "@/components/common/InfiniteScroll";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiFetch } from "@/lib/api/client";

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
  content: string;
  created_at: string;
  user_id: string;
  goodCount: number;
  badCount?: number;
  replyCount: number;
  repostCount: number;
  currentUserReaction: "good" | "bad" | null;
  author: {
    user_handle: string;
    display_name: string;
    avatar_url: string | null;
    attributes: Record<string, string | null> | null;
  } | null;
}

const ATTRIBUTE_LABELS: Record<string, Record<string, string>> = {
  gender: { male: "男性", female: "女性", other: "その他", no_answer: "回答しない" },
  age_range: { "18-24": "18-24歳", "25-29": "25-29歳", "30-34": "30-34歳", "35-39": "35-39歳", "40-44": "40-44歳", "45-49": "45-49歳", "50-54": "50-54歳", "55-59": "55-59歳", "60-64": "60-64歳", "65_and_over": "65歳以上" },
  education: { junior_high: "中学校卒", high_school: "高校卒", vocational: "専門学校卒", junior_college: "短大卒", university: "大学卒", masters: "大学院卒（修士）", doctorate: "大学院卒（博士）", other: "その他" },
  occupation: { company_employee: "会社員", civil_servant: "公務員", self_employed: "自営業", executive: "経営者", professional: "専門職", educator_researcher: "教育・研究職", student: "学生", homemaker: "主婦・主夫", part_time: "パート・アルバイト", unemployed: "無職", retired: "退職者", other: "その他" },
  political_party: { ldp: "自由民主党", cdp: "立憲民主党", nippon_ishin: "日本維新の会", komeito: "公明党", dpfp: "国民民主党", jcp: "日本共産党", reiwa: "れいわ新選組", sdp: "社会民主党", sanseito: "参政党", other: "その他", no_party: "支持政党なし", no_answer: "回答しない" },
  political_stance: { left: "左派", center_left: "やや左派", center: "中道", center_right: "やや右派", right: "右派" },
};

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

export default function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiFetch<UserProfile>(`/api/users/${handle}`);
      setProfile(data);
    } catch {
      // handle error
    }
  }, [handle]);

  // TODO: /api/users/${handle}/posts APIルートが未実装。バックエンドエンジニアが作成する必要がある。
  const fetchPosts = useCallback(async (cursorParam?: string | null) => {
    try {
      const url = cursorParam
        ? `/api/users/${handle}/posts?cursor=${cursorParam}`
        : `/api/users/${handle}/posts`;
      const data = await apiFetch<{ posts: UserPost[]; nextCursor: string | null }>(url);
      if (cursorParam) {
        setPosts((prev) => [...prev, ...data.posts]);
      } else {
        setPosts(data.posts);
      }
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch {
      setHasMore(false);
    }
  }, [handle]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfile(), fetchPosts()]).finally(() =>
      setLoading(false)
    );
  }, [fetchProfile, fetchPosts]);

  // TODO: /api/users/${handle}/follow APIルートが未実装。
  // 現在フォローAPIは /api/follows/[userId] (IDベース) で実装されている。
  // ハンドルベースのフォローAPIを追加するか、プロフィールのIDを使ってフォローする必要がある。
  async function handleFollow() {
    if (!profile) return;
    try {
      if (profile.isFollowing) {
        await apiFetch(`/api/follows/${profile.id}`, { method: "DELETE" });
      } else {
        await apiFetch(`/api/follows/${profile.id}`, { method: "POST" });
      }
      fetchProfile();
    } catch {
      // handle error
    }
  }

  function handleLoadMore() {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    fetchPosts(cursor).finally(() => setLoadingMore(false));
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
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
    <div>
      {/* Profile Header */}
      <div className="px-4 py-6">
        <div className="flex items-start justify-between">
          <UserAvatar
            src={profile.avatar_url}
            displayName={profile.display_name}
            size="lg"
          />
          {profile.isOwnProfile ? (
            <Button variant="outline" size="sm" asChild>
              <Link href="/settings/profile">プロフィール編集</Link>
            </Button>
          ) : (
            <Button
              variant={profile.isFollowing ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
            >
              {profile.isFollowing ? "フォロー中" : "フォローする"}
            </Button>
          )}
        </div>

        <div className="mt-4">
          <h1 className="text-xl font-bold">{profile.display_name}</h1>
          <p className="text-sm text-muted-foreground">@{profile.user_handle}</p>
        </div>

        {profile.bio && (
          <p className="mt-3 text-sm leading-relaxed">{profile.bio}</p>
        )}

        {publicAttrs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {publicAttrs.map((attr) => (
              <AttributeBadge
                key={attr.type}
                type={attr.type}
                value={attr.value}
              />
            ))}
          </div>
        )}

        <div className="mt-4 flex gap-4 text-sm">
          <Link
            href={`/users/${profile.user_handle}/follows?tab=following`}
            className="hover:underline"
          >
            <span className="font-semibold">{profile.followingCount}</span>{" "}
            <span className="text-muted-foreground">フォロー中</span>
          </Link>
          <Link
            href={`/users/${profile.user_handle}/follows?tab=followers`}
            className="hover:underline"
          >
            <span className="font-semibold">{profile.followerCount}</span>{" "}
            <span className="text-muted-foreground">フォロワー</span>
          </Link>
        </div>
      </div>

      <Separator />

      {/* Posts */}
      <InfiniteScroll
        hasMore={hasMore}
        isLoading={loadingMore}
        onLoadMore={handleLoadMore}
      >
        {posts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            まだ投稿がありません
          </div>
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
              replyCount={post.replyCount ?? 0}
              repostCount={post.repostCount ?? 0}
              isOwnPost={post.badCount !== undefined}
              userReaction={post.currentUserReaction}
            />
          ))
        )}
      </InfiniteScroll>
    </div>
  );
}
