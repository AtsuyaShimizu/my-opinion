"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserAvatar } from "@/components/user/UserAvatar";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  user_handle: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  status: "active" | "suspended" | "banned" | "withdrawn";
  created_at: string;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: "アクティブ", color: "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
  suspended: { label: "一時停止", color: "bg-amber-50/80 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  banned: { label: "凍結", color: "bg-red-50/80 text-red-700 dark:bg-red-950/30 dark:text-red-400" },
  withdrawn: { label: "退会済み", color: "bg-muted text-muted-foreground" },
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const url = `/api/admin/users${params.toString() ? `?${params}` : ""}`;
    apiFetch<{ users: AdminUser[] }>(url)
      .then((data) => setUsers(data.users))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  async function handleStatusChange(userId: string, newStatus: string) {
    setUpdatingId(userId);
    try {
      await apiFetch(`/api/admin/users/${userId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchUsers();
    } catch {
      // handle error
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-bold">ユーザー管理</h1>
        </div>
      </div>

      <div className="border-b px-4 py-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}
              placeholder="ユーザー検索..."
              className="pl-9"
            />
          </div>
          <Button onClick={fetchUsers} size="sm">
            検索
          </Button>
        </div>
        <div className="mt-2 flex gap-2">
          {["", "active", "suspended", "banned"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "rounded-full px-3 py-1 text-xs transition-colors",
                statusFilter === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {s === "" ? "すべて" : STATUS_LABELS[s]?.label ?? s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          ユーザーが見つかりません
        </div>
      ) : (
        <div className="divide-y">
          {users.map((user) => (
            <div key={user.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={user.avatar_url}
                  displayName={user.display_name}
                  size="sm"
                />
                <div>
                  <p className="text-sm font-medium">{user.display_name}</p>
                  <p className="text-xs text-muted-foreground">@{user.user_handle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-xs",
                    STATUS_LABELS[user.status]?.color ?? "bg-muted"
                  )}
                >
                  {STATUS_LABELS[user.status]?.label ?? user.status}
                </span>
                {user.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingId === user.id}
                    onClick={() => handleStatusChange(user.id, "suspended")}
                  >
                    {updatingId === user.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "停止"
                    )}
                  </Button>
                )}
                {user.status === "suspended" && (
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingId === user.id}
                      onClick={() => handleStatusChange(user.id, "active")}
                    >
                      解除
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={updatingId === user.id}
                      onClick={() => handleStatusChange(user.id, "banned")}
                    >
                      凍結
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
