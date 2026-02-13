"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface Report {
  id: string;
  reporter_id: string;
  target_type: "post" | "user";
  target_id: string;
  reason: string;
  detail: string | null;
  status: "pending" | "reviewed" | "resolved";
  created_at: string;
}

const REASON_LABELS: Record<string, string> = {
  attribute_discrimination: "属性差別",
  defamation: "誹謗中傷",
  fake_attribute: "虚偽属性",
  impersonation: "なりすまし",
  spam: "スパム",
  other: "その他",
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "未対応", color: "bg-amber-50/80 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400" },
  reviewed: { label: "確認中", color: "bg-sky-50/80 text-sky-700 dark:bg-sky-950/30 dark:text-sky-400" },
  resolved: { label: "対応済み", color: "bg-emerald-50/80 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400" },
};

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("ja-JP", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchReports = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    const url = `/api/admin/reports${params.toString() ? `?${params}` : ""}`;
    apiFetch<{ reports: Report[] }>(url)
      .then((data) => setReports(data.reports))
      .catch(() => setReports([]))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  async function handleStatusChange(reportId: string, newStatus: string) {
    setUpdatingId(reportId);
    try {
      await apiFetch(`/api/admin/reports/${reportId}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      fetchReports();
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
          <h1 className="text-lg font-bold">通報管理</h1>
        </div>
      </div>

      <div className="border-b px-4 py-3">
        <div className="flex gap-2">
          {["", "pending", "reviewed", "resolved"].map((s) => (
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
      ) : reports.length === 0 ? (
        <div className="px-4 py-8 text-center text-sm text-muted-foreground">
          通報がありません
        </div>
      ) : (
        <div className="divide-y">
          {reports.map((report) => (
            <div key={report.id} className="px-4 py-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-muted px-2 py-0.5 text-xs">
                      {report.target_type === "post" ? "投稿" : "ユーザー"}
                    </span>
                    <span className="text-sm font-medium">
                      {REASON_LABELS[report.reason] ?? report.reason}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs",
                        STATUS_LABELS[report.status]?.color ?? "bg-muted"
                      )}
                    >
                      {STATUS_LABELS[report.status]?.label ?? report.status}
                    </span>
                  </div>
                  {report.detail && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {report.detail}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatDate(report.created_at)}
                  </p>
                </div>
              </div>
              {report.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updatingId === report.id}
                    onClick={() => handleStatusChange(report.id, "reviewed")}
                  >
                    確認中にする
                  </Button>
                  <Button
                    size="sm"
                    disabled={updatingId === report.id}
                    onClick={() => handleStatusChange(report.id, "resolved")}
                  >
                    {updatingId === report.id && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    対応済みにする
                  </Button>
                </div>
              )}
              {report.status === "reviewed" && (
                <div className="mt-3">
                  <Button
                    size="sm"
                    disabled={updatingId === report.id}
                    onClick={() => handleStatusChange(report.id, "resolved")}
                  >
                    {updatingId === report.id && (
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    )}
                    対応済みにする
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
