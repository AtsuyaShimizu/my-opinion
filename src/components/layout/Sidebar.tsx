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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUnreadCount } from "@/hooks/useUnreadCount";

const navItems = [
  { href: "/home", label: "ホーム", icon: Home },
  { href: "/explore", label: "探索", icon: Compass },
  { href: "/themes", label: "テーマ", icon: MessageSquare },
  { href: "/notifications", label: "通知", icon: Bell },
  { href: "/profile", label: "プロフィール", icon: User },
];

export function Sidebar() {
  const pathname = usePathname();
  const unreadCount = useUnreadCount();

  return (
    <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 lg:border-r lg:bg-background">
      <div className="flex h-14 items-center px-6">
        <Link href="/home" className="text-xl font-bold text-primary">
          My Opinion
        </Link>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const isNotification = item.href === "/notifications";
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn(
                "justify-start gap-3 text-base",
                isActive && "font-semibold"
              )}
              asChild
            >
              <Link href={item.href}>
                <span className="relative">
                  <item.icon className="h-5 w-5" />
                  {isNotification && unreadCount > 0 && (
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </Button>
          );
        })}
        <Separator className="my-2" />
        <Button className="gap-2" asChild>
          <Link href="/compose">
            <PenSquare className="h-5 w-5" />
            投稿する
          </Link>
        </Button>
      </nav>
    </aside>
  );
}
