import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReportStatus } from "@/types/database";

// GET /api/admin/reports - List reports (admin only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "管理者権限が必要です", status: 403 },
        { status: 403 }
      );
    }

    const { searchParams } = request.nextUrl;
    const status = searchParams.get("status");
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);

    let query = supabase
      .from("reports")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (status) {
      query = query.eq("status", status as ReportStatus);
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: reports, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "通報一覧の取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const hasMore = (reports?.length ?? 0) > limit;
    const items = hasMore ? reports!.slice(0, limit) : (reports ?? []);
    const nextCursor = hasMore ? items[items.length - 1].created_at : null;

    return NextResponse.json({
      data: { reports: items, nextCursor, hasMore },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
