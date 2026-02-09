"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Bell,
  Shield,
  LogOut,
  Loader2,
  ChevronRight,
  AlertTriangle,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/api/client";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);

  const [notifyReply, setNotifyReply] = useState(true);
  const [notifyFollow, setNotifyFollow] = useState(true);
  const [notifyReaction, setNotifyReaction] = useState(true);
  const [notifyTheme, setNotifyTheme] = useState(true);
  const [notifyAnalysis, setNotifyAnalysis] = useState(true);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/login");
    } finally {
      setLoggingOut(false);
    }
  }

  // TODO: /api/auth/withdraw APIルートが未実装。退会処理のバックエンド実装が必要。
  async function handleWithdraw() {
    setWithdrawing(true);
    try {
      await apiFetch("/api/auth/withdraw", { method: "POST" });
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
    } catch {
      setWithdrawing(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="sticky top-14 z-40 border-b bg-background/80 backdrop-blur-lg lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">設定</h1>
        </div>
      </div>

      {/* Account Section */}
      <div className="px-4 pt-6 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          アカウント
        </h2>
      </div>
      <div className="divide-y">
        <SettingsLink
          href="/settings/profile"
          icon={User}
          title="プロフィール編集"
          description="表示名、自己紹介、プロフィール情報の編集"
        />
        <SettingsLink
          href="/settings/echo-chamber"
          icon={Shield}
          title="視野のひろがり"
          description="あなたの視野の広さをチェック"
        />
        <SettingsLink
          href="/settings/invites"
          icon={Ticket}
          title="招待コード"
          description="友人をMy Opinionに招待"
        />
      </div>

      {/* Notification Settings */}
      <div className="px-4 pt-8 pb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          通知設定
        </h2>
      </div>
      <div className="mx-4 rounded-xl border bg-card">
        <div className="divide-y">
          <NotificationToggle
            label="返信がついたとき"
            description="意見に返信がついたとき"
            checked={notifyReply}
            onCheckedChange={setNotifyReply}
          />
          <NotificationToggle
            label="新しいフォロワーがついたとき"
            description="新しいフォロワーがついたとき"
            checked={notifyFollow}
            onCheckedChange={setNotifyFollow}
          />
          <NotificationToggle
            label="リアクションがついたとき"
            description="意見にリアクションがついたとき"
            checked={notifyReaction}
            onCheckedChange={setNotifyReaction}
          />
          <NotificationToggle
            label="新しいトピックが始まったとき"
            description="新しいトピックが始まったとき"
            checked={notifyTheme}
            onCheckedChange={setNotifyTheme}
          />
          <NotificationToggle
            label="分析が見られるようになったとき"
            description="意見の分析が閲覧可能になったとき"
            checked={notifyAnalysis}
            onCheckedChange={setNotifyAnalysis}
          />
        </div>
      </div>

      {/* Account Actions */}
      <div className="mt-8 space-y-3 px-4 pb-8">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 rounded-xl"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <LogOut className="h-4 w-4" />
          )}
          ログアウト
        </Button>

        {!showWithdrawConfirm ? (
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
            onClick={() => setShowWithdrawConfirm(true)}
          >
            <AlertTriangle className="h-4 w-4" />
            アカウントを削除
          </Button>
        ) : (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <p className="text-sm font-medium text-destructive">
              本当にアカウントを削除しますか？
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              削除後30日間はデータが保持され、復旧が可能です。それ以降は完全に削除されます。
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="rounded-lg"
                onClick={() => setShowWithdrawConfirm(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="rounded-lg"
                onClick={handleWithdraw}
                disabled={withdrawing}
              >
                {withdrawing && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                削除する
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsLink({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between px-4 py-4 transition-colors duration-200 hover:bg-accent/50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function NotificationToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <div>
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
