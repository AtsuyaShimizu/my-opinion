"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface Theme {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string | null;
  status: "active" | "ended";
  created_at: string;
}

export default function AdminThemesPage() {
  const router = useRouter();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  function fetchThemes() {
    setLoading(true);
    apiFetch<Theme[]>("/api/themes?includeEnded=true")
      .then(setThemes)
      .catch(() => setThemes([]))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchThemes();
  }, []);

  async function handleCreate() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await apiFetch("/api/admin/themes", {
        method: "POST",
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null }),
      });
      setTitle("");
      setDescription("");
      setCreateOpen(false);
      fetchThemes();
    } catch {
      // handle error
    } finally {
      setCreating(false);
    }
  }

  async function handleEnd(themeId: string) {
    setUpdatingId(themeId);
    try {
      await apiFetch(`/api/admin/themes/${themeId}`, {
        method: "PUT",
        body: JSON.stringify({ status: "ended" }),
      });
      fetchThemes();
    } catch {
      // handle error
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div>
      <div className="sticky top-14 z-40 border-b bg-background/95 backdrop-blur lg:top-0">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-bold">テーマ管理</h1>
          </div>
          <Button size="sm" className="gap-1" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            作成
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : themes.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          テーマがありません
        </div>
      ) : (
        <div className="divide-y">
          {themes.map((theme) => (
            <div key={theme.id} className="px-4 py-4">
              <div className="flex items-start justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="font-semibold">{theme.title}</h2>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        theme.status === "active"
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      )}
                    >
                      {theme.status === "active" ? "アクティブ" : "終了"}
                    </span>
                  </div>
                  {theme.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {theme.description}
                    </p>
                  )}
                </div>
                {theme.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingId === theme.id}
                    onClick={() => handleEnd(theme.id)}
                  >
                    {updatingId === theme.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      "終了"
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>新しいテーマを作成</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">タイトル</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                placeholder="テーマのタイトル"
              />
              <p className="text-xs text-muted-foreground">{title.length}/50</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="desc">説明（任意）</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                placeholder="テーマの説明"
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">{description.length}/500</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setCreateOpen(false)} className="flex-1">
                キャンセル
              </Button>
              <Button onClick={handleCreate} disabled={!title.trim() || creating} className="flex-1">
                {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                作成
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
