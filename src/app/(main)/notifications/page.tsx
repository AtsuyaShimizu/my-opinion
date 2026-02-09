"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  MessageCircle,
  UserPlus,
  SlidersHorizontal,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { PostCardSkeleton } from "@/components/post/PostCardSkeleton";
import { EmptyState } from "@/components/common/EmptyState";
import { UserAvatar } from "@/components/user/UserAvatar";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils/formatTime";

interface NotificationItem {
  id: string;
  type: "reply" | "follow" | "reaction" | "theme_start" | "analysis_ready";
  message: string;
  is_read: boolean;
  created_at: string;
  reference_id: string | null;
  actor?: {
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
}

const notificationIcons = {
  reply: MessageCircle,
  follow: UserPlus,
  reaction: SlidersHorizontal,
  theme_start: MessageSquare,
  analysis_ready: BarChart3,
};

/** Extract reaction score from message like "あなたの意見に 78 で評価しました" */
function extractReactionScore(message: string): number | null {
  const match = message.match(/(\d+)\s*で評価/);
  return match ? parseInt(match[1], 10) : null;
}

function getNotificationLink(n: NotificationItem): string {
  switch (n.type) {
    case "reply":
    case "reaction":
      return n.reference_id ? `/posts/${n.reference_id}` : "#";
    case "follow":
      return n.actor ? `/users/${n.actor.handle}` : "#";
    case "theme_start":
      return n.reference_id ? `/themes/${n.reference_id}` : "#";
    case "analysis_ready":
      return n.reference_id ? `/posts/${n.reference_id}/analysis` : "#";
    default:
      return "#";
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ items: NotificationItem[]; nextCursor: string | null }>("/api/notifications")
      .then((data) => setNotifications(data.items ?? []))
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    try {
      await apiFetch("/api/notifications/read-all", { method: "PUT" });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // handle error
    }
  }

  if (loading) {
    return (
      <div>
        <div className="sticky top-14 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
          <h1 className="text-xl font-bold">通知</h1>
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <div className="sticky top-14 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
        <h1 className="text-xl font-bold">通知</h1>
        {notifications.some((n) => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={markAllRead}>
            すべて既読
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="通知はまだありません"
          description="フォローや返信があるとここに表示されます。"
        />
      ) : (
        <div className="divide-y">
          {notifications.map((n) => {
            const Icon = notificationIcons[n.type];
            const reactionScore = n.type === "reaction" ? extractReactionScore(n.message) : null;
            return (
              <Link
                key={n.id}
                href={getNotificationLink(n)}
                className={cn(
                  "flex items-start gap-3 px-4 py-4 transition-colors hover:bg-accent/40",
                  !n.is_read && "border-l-2 border-l-primary bg-primary/[0.06]"
                )}
              >
                {/* Show score badge for reaction notifications, avatar for actor-based, icon fallback */}
                {reactionScore !== null ? (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <span className="text-sm font-bold tabular-nums text-primary">{reactionScore}</span>
                  </div>
                ) : n.actor ? (
                  <UserAvatar
                    src={n.actor.avatar_url}
                    displayName={n.actor.display_name}
                    size="sm"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm", !n.is_read && "font-medium")}>
                    {n.actor && (
                      <span className="font-semibold">{n.actor.display_name}</span>
                    )}{" "}
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {formatRelativeTime(n.created_at)}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary animate-unread-pulse" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
