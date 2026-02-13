"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Compass, LayoutGrid, PenSquare, Settings, Target, User } from "lucide-react";
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

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "トピックハブ", icon: LayoutGrid },
  { href: "/explore", label: "意見を探す", icon: Compass },
  { href: "/notifications", label: "通知", icon: Bell },
  { href: "/settings/echo-chamber", label: "わたしの立ち位置", icon: Target },
  { href: "/profile", label: "プロフィール", icon: User },
];

function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  compact,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
  compact?: boolean;
}) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(href);
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center justify-between rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
        compact && "px-2.5 py-1.5 text-xs",
        isActive
          ? "border-primary/40 bg-primary/10 font-semibold text-primary"
          : "border-transparent text-muted-foreground hover:border-border hover:bg-accent/60 hover:text-foreground"
      )}
    >
      <span className="flex items-center gap-2">
        <Icon className={cn(compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        {label}
      </span>
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

function TopicNavItem({ theme }: { theme: ActiveTheme }) {
  const statusLabel = theme.consensusScore < 40 ? "分断中" : theme.consensusScore < 70 ? "収束中" : "合意形成";

  return (
    <Link
      href={`/themes/${theme.id}`}
      className="block rounded-xl border border-border/70 bg-background/70 px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/40"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold line-clamp-1">{theme.title}</p>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          {statusLabel}
        </span>
      </div>
      <div className="mt-2">
        <ConsensusMeterMini score={theme.consensusScore} />
      </div>
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
    <aside className="sticky top-0 flex h-screen flex-col overflow-y-auto border-r border-border/70 bg-gradient-to-b from-sidebar via-sidebar/95 to-sidebar/80">
      <div className="px-5 pb-3 pt-5">
        <Link
          href="/home"
          className="text-xl font-bold tracking-tight text-primary transition-opacity hover:opacity-80"
        >
          My Opinion
        </Link>
        <p className="mt-1 text-xs text-muted-foreground">Opinion Observatory</p>
      </div>

      <nav className="space-y-1 px-3 py-2">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            badge={item.href === "/notifications" ? unreadCount : undefined}
          />
        ))}
      </nav>

      <Separator />

      <div className="px-3 py-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          観測ショートカット
        </p>
        <div className="space-y-1">
          <NavLink href="/themes" label="全トピックを見る" icon={LayoutGrid} compact />
          <NavLink href="/explore" label="多様な意見を探す" icon={Compass} compact />
        </div>
      </div>

      <Separator />

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          いま議論が動くトピック
        </p>
        {activeThemes.length > 0 ? (
          <div className="space-y-2">
            {activeThemes.map((theme) => (
              <TopicNavItem key={theme.id} theme={theme} />
            ))}
          </div>
        ) : (
          <p className="px-2 text-xs text-muted-foreground">
            観測中のトピックはまだありません
          </p>
        )}
      </div>

      <div className="space-y-2 border-t border-border/70 p-3">
        <Button className="w-full gap-2 rounded-xl" asChild>
          <Link href="/compose">
            <PenSquare className="h-5 w-5" />
            新しい意見を投じる
          </Link>
        </Button>
        <div className="flex items-center justify-between">
          <NavLink href="/settings" label="設定" icon={Settings} compact />
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
