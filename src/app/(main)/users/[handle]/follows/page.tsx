"use client";

import { useState, useEffect, use } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { UserCard } from "@/components/user/UserCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

// API returns snake_case fields from the users table
interface FollowUserApi {
  id: string;
  user_handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
}

interface FollowUser {
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
}

export default function FollowsPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = use(params);
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "followers" ? "followers" : "following";
  const [tab, setTab] = useState<"following" | "followers">(initialTab);
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<{ items: FollowUserApi[]; nextCursor: string | null }>(`/api/users/${handle}/${tab}`)
      .then((data) => {
        setUsers(
          (data.items ?? []).map((u) => ({
            handle: u.user_handle,
            displayName: u.display_name,
            avatarUrl: u.avatar_url,
            bio: u.bio,
          }))
        );
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [handle, tab]);

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">@{handle}</h1>
        </div>
        <div className="flex">
          <button
            className={cn(
              "flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "following"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab("following")}
          >
            フォロー中
          </button>
          <button
            className={cn(
              "flex-1 border-b-2 px-4 py-3 text-sm font-medium transition-colors",
              tab === "followers"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
            onClick={() => setTab("followers")}
          >
            フォロワー
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          title={tab === "following" ? "フォロー中のユーザーがいません" : "フォロワーがいません"}
        />
      ) : (
        <div className="space-y-2 p-4">
          {users.map((user) => (
            <UserCard
              key={user.handle}
              handle={user.handle}
              displayName={user.displayName}
              avatarUrl={user.avatarUrl}
              bio={user.bio}
            />
          ))}
        </div>
      )}
    </div>
  );
}
