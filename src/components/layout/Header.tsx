"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

export function Header() {
  const unreadCount = useUnreadCount();
  const [echoScore, setEchoScore] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<{ score: number | null }>("/api/users/me/echo-chamber")
      .then((data) => setEchoScore(data.score))
      .catch(() => {});
  }, []);

  const scoreColor =
    echoScore === null
      ? "text-muted-foreground"
      : echoScore >= 70
        ? "text-emerald-500"
        : echoScore >= 40
          ? "text-amber-500"
          : "text-destructive";

  const circumference = 2 * Math.PI * 10;
  const strokeDashoffset = circumference * (1 - (echoScore ?? 0) / 100);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg lg:hidden">
      <div className="flex h-14 items-center justify-between px-4">
        <Link
          href="/home"
          className="text-lg font-bold tracking-tight text-primary"
        >
          My Opinion
        </Link>
        <div className="flex items-center gap-1">
          {echoScore !== null && (
            <Link href="/settings/echo-chamber" aria-label="視野スコア" className="relative flex h-9 w-9 items-center justify-center">
              <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" className="text-border" strokeWidth="2" />
                <circle
                  cx="12" cy="12" r="10" fill="none" stroke="currentColor"
                  className={cn("transition-all duration-500", scoreColor)}
                  strokeWidth="2" strokeLinecap="round"
                  strokeDasharray={circumference} strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <span className={cn("absolute inset-0 flex items-center justify-center text-[8px] font-bold", scoreColor)}>
                {echoScore}
              </span>
            </Link>
          )}
          <ThemeToggle />
          <Button variant="ghost" size="icon" className="relative" asChild>
            <Link href="/notifications">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
              <span className="sr-only">通知</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
