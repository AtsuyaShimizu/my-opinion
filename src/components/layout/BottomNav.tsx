"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  PenSquare,
  MessageSquare,
  Bell,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUnreadCount } from "@/hooks/useUnreadCount";

const navItems = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/explore", label: "探索", icon: Compass },
  { href: "/compose", label: "投稿", icon: PenSquare },
  { href: "/themes", label: "テーマ", icon: MessageSquare },
  { href: "/notifications", label: "通知", icon: Bell },
];

export function BottomNav() {
  const pathname = usePathname();
  const unreadCount = useUnreadCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isNotification = item.href === "/notifications";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 text-xs transition-colors",
                isActive
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="relative">
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                {isNotification && unreadCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
