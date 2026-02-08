"use client";

import { useState, useEffect } from "react";
import { Loader2, Users, FileText, MessageSquare, AlertTriangle, TrendingUp, UserPlus } from "lucide-react";
import Link from "next/link";
import { apiFetch } from "@/lib/api/client";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalReactions: number;
  totalReports: number;
  pendingReports: number;
  postsToday: number;
  newUsersToday: number;
}

function StatCard({ label, value, icon: Icon, href }: { label: string; value: number; icon: React.ElementType; href?: string }) {
  const content = (
    <div className="rounded-lg border p-4 transition-colors hover:bg-accent/50">
      <div className="flex items-center justify-between">
        <Icon className="h-5 w-5 text-muted-foreground" />
        {href && <span className="text-xs text-primary">詳細</span>}
      </div>
      <p className="mt-3 text-2xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<AdminStats>("/api/admin/stats")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-16 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 px-4 py-3 backdrop-blur lg:top-0">
        <h1 className="text-lg font-bold">管理者ダッシュボード</h1>
      </div>

      <div className="space-y-6 px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="総ユーザー数" value={stats.totalUsers} icon={Users} href="/admin/users" />
          <StatCard label="アクティブユーザー" value={stats.activeUsers} icon={Users} />
          <StatCard label="総投稿数" value={stats.totalPosts} icon={FileText} />
          <StatCard label="総評価数" value={stats.totalReactions} icon={TrendingUp} />
          <StatCard label="通報件数" value={stats.totalReports} icon={AlertTriangle} href="/admin/reports" />
          <StatCard label="未対応通報" value={stats.pendingReports} icon={AlertTriangle} href="/admin/reports" />
        </div>

        <div>
          <h2 className="mb-3 font-semibold">今日のアクティビティ</h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="新規投稿" value={stats.postsToday} icon={MessageSquare} />
            <StatCard label="新規ユーザー" value={stats.newUsersToday} icon={UserPlus} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 font-semibold">管理メニュー</h2>
          <div className="space-y-2">
            <Link href="/admin/users" className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-accent/50">
              <Users className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">ユーザー管理</p>
                <p className="text-xs text-muted-foreground">ユーザーの検索、ステータス変更</p>
              </div>
            </Link>
            <Link href="/admin/reports" className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-accent/50">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">通報管理</p>
                <p className="text-xs text-muted-foreground">通報の確認、対応</p>
              </div>
            </Link>
            <Link href="/admin/themes" className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-accent/50">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">テーマ管理</p>
                <p className="text-xs text-muted-foreground">テーマの作成、編集、終了</p>
              </div>
            </Link>
            <Link href="/admin/invites" className="flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-accent/50">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">招待コード管理</p>
                <p className="text-xs text-muted-foreground">招待コードの一括生成</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
