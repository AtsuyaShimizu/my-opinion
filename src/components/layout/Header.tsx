"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnreadCount } from "@/hooks/useUnreadCount";

export function Header() {
  const unreadCount = useUnreadCount();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/home" className="text-xl font-bold text-primary">
          My Opinion
        </Link>
        <Button variant="ghost" size="icon" asChild>
          <Link href="/notifications" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
            <span className="sr-only">通知</span>
          </Link>
        </Button>
      </div>
    </header>
  );
}
