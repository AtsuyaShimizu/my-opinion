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
  const [notifyGood, setNotifyGood] = useState(true);
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
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">設定</h1>
        </div>
      </div>

      <div className="divide-y">
        {/* Profile Edit Link */}
        <Link
          href="/settings/profile"
          className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">プロフィール編集</p>
              <p className="text-xs text-muted-foreground">
                表示名、自己紹介、属性情報の編集
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>

        {/* Echo Chamber Link */}
        <Link
          href="/settings/echo-chamber"
          className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">エコーチェンバー指標</p>
              <p className="text-xs text-muted-foreground">
                フォローの偏り度を確認
              </p>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        </Link>
      </div>

      {/* Notification Settings */}
      <div className="mt-6 px-4">
        <div className="flex items-center gap-2 pb-3">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="font-semibold">通知設定</h2>
        </div>
        <div className="space-y-4 rounded-lg border p-4">
          <NotificationToggle
            label="返信通知"
            description="投稿に返信がついたとき"
            checked={notifyReply}
            onCheckedChange={setNotifyReply}
          />
          <NotificationToggle
            label="フォロー通知"
            description="新しいフォロワーがついたとき"
            checked={notifyFollow}
            onCheckedChange={setNotifyFollow}
          />
          <NotificationToggle
            label="Good通知"
            description="投稿にGoodがついたとき"
            checked={notifyGood}
            onCheckedChange={setNotifyGood}
          />
          <NotificationToggle
            label="テーマ開始通知"
            description="新しいテーマが開始されたとき"
            checked={notifyTheme}
            onCheckedChange={setNotifyTheme}
          />
          <NotificationToggle
            label="分析解放通知"
            description="投稿の分析が閲覧可能になったとき"
            checked={notifyAnalysis}
            onCheckedChange={setNotifyAnalysis}
          />
        </div>
      </div>

      {/* Account Actions */}
      <div className="mt-6 space-y-3 px-4 pb-8">
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
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
          <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-4">
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
                onClick={() => setShowWithdrawConfirm(false)}
              >
                キャンセル
              </Button>
              <Button
                variant="destructive"
                size="sm"
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
    <div className="flex items-center justify-between">
      <div>
        <Label className="text-sm">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}
