"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Loader2,
  Bell,
  MessageCircle,
  UserPlus,
  ThumbsUp,
  BarChart3,
  MessageSquare,
} from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { UserAvatar } from "@/components/user/UserAvatar";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: "reply" | "follow" | "good" | "theme_start" | "analysis_ready";
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
  good: ThumbsUp,
  theme_start: MessageSquare,
  analysis_ready: BarChart3,
};

function getNotificationLink(n: NotificationItem): string {
  switch (n.type) {
    case "reply":
    case "good":
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

function formatTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}日前`;
  if (hours > 0) return `${hours}時間前`;
  if (minutes > 0) return `${minutes}分前`;
  return "たった今";
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ notifications: NotificationItem[]; nextCursor: string | null }>("/api/notifications")
      .then((data) => setNotifications(data.notifications ?? []))
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
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="sticky top-14 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
        <h1 className="text-lg font-bold">通知</h1>
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
            return (
              <Link
                key={n.id}
                href={getNotificationLink(n)}
                className={cn(
                  "flex items-start gap-3 px-4 py-4 transition-colors hover:bg-accent/50",
                  !n.is_read && "bg-primary/5"
                )}
              >
                {n.actor ? (
                  <UserAvatar
                    src={n.actor.avatar_url}
                    displayName={n.actor.display_name}
                    size="sm"
                  />
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    {n.actor && (
                      <span className="font-semibold">{n.actor.display_name}</span>
                    )}{" "}
                    {n.message}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatTime(n.created_at)}
                  </p>
                </div>
                {!n.is_read && (
                  <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
