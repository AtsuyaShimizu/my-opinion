"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Compass,
  PenSquare,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { ComposeModal } from "@/components/post/ComposeModal";
import { apiFetch } from "@/lib/api/client";

const navItems = [
  { href: "/home", label: "トピック", icon: MessageSquare },
  { href: "/explore", label: "探索", icon: Compass },
  { href: "/compose", label: "意見", icon: PenSquare, isCompose: true },
  { href: "/notifications", label: "通知", icon: Bell },
  { href: "/profile", label: "マイページ", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  const unreadCount = useUnreadCount();
  const [composeOpen, setComposeOpen] = useState(false);

  async function handlePost(content: string) {
    await apiFetch("/api/posts", {
      method: "POST",
      body: JSON.stringify({ content }),
    });
    window.dispatchEvent(new Event("post-created"));
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/90 backdrop-blur-xl lg:hidden">
      <div className="mx-auto flex h-16 max-w-lg items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isNotification = item.href === "/notifications";
          const isCompose = item.isCompose;

          if (isCompose) {
            return (
              <button
                key={item.href}
                type="button"
                onClick={() => setComposeOpen(true)}
                aria-label="意見を書く"
                className="flex items-center justify-center"
              >
                <span className="relative -top-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-[0_10px_24px_-12px_var(--primary)] transition-transform active:scale-90">
                  <PenSquare className="h-6 w-6" />
                </span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 text-[0.625rem] transition-colors duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground active:text-foreground"
              )}
            >
              <span className="relative">
                <item.icon
                  className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isActive && "scale-110"
                  )}
                />
                {isNotification && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground animate-unread-pulse">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span className={cn("transition-all duration-200", isActive && "font-semibold")}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>

      <ComposeModal
        open={composeOpen}
        onOpenChange={setComposeOpen}
        onSubmit={handlePost}
      />
    </nav>
  );
}
