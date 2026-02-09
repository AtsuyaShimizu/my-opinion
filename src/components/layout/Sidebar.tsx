"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PenSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ConsensusMeterMini } from "@/components/theme/ConsensusMeterMini";
import { useUnreadCount } from "@/hooks/useUnreadCount";
import { apiFetch } from "@/lib/api/client";

interface ActiveTheme {
  id: string;
  title: string;
  consensusScore: number;
  status: string;
}

function NavLink({
  href,
  label,
  badge,
  small,
}: {
  href: string;
  label: string;
  badge?: number;
  small?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
        small && "text-xs px-2 py-1.5",
        isActive
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function TopicNavItem({ theme }: { theme: ActiveTheme }) {
  return (
    <Link
      href={`/themes/${theme.id}`}
      className="block rounded-lg px-2 py-2 transition-colors hover:bg-accent"
    >
      <p className="text-sm font-medium line-clamp-1">{theme.title}</p>
      <ConsensusMeterMini score={theme.consensusScore} />
    </Link>
  );
}

export function Sidebar() {
  const unreadCount = useUnreadCount();
  const [activeThemes, setActiveThemes] = useState<ActiveTheme[]>([]);

  useEffect(() => {
    apiFetch<ActiveTheme[]>("/api/themes")
      .then((data) => {
        setActiveThemes(
          (data ?? [])
            .filter((t) => t.status === "active")
            .slice(0, 5)
        );
      })
      .catch(() => {});
  }, []);

  return (
    <aside className="sticky top-0 flex h-screen flex-col overflow-y-auto border-r bg-gradient-to-b from-sidebar to-sidebar/80">
      {/* Logo */}
      <div className="flex h-14 items-center px-5">
        <Link
          href="/home"
          className="text-xl font-bold text-primary transition-opacity hover:opacity-80"
        >
          My Opinion
        </Link>
      </div>

      {/* Main nav: text-based links */}
      <nav className="px-3 py-2 space-y-0.5">
        <NavLink href="/home" label="ホーム" />
        <NavLink href="/explore" label="探索" />
        <NavLink href="/notifications" label="通知" badge={unreadCount} />
        <NavLink href="/profile" label="マイページ" />
      </nav>

      <Separator />

      {/* Active topics section */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
          アクティブなトピック
        </p>
        {activeThemes.length > 0 ? (
          activeThemes.map((theme) => (
            <TopicNavItem key={theme.id} theme={theme} />
          ))
        ) : (
          <p className="px-2 text-xs text-muted-foreground">
            トピックがありません
          </p>
        )}
      </div>

      {/* Compose button + settings */}
      <div className="border-t p-3 space-y-2">
        <Button className="w-full gap-2 rounded-xl" asChild>
          <Link href="/compose">
            <PenSquare className="h-5 w-5" />
            意見を書く
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <NavLink href="/settings" label="設定" small />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
