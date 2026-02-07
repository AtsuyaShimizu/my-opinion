import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserStatus } from "@/types/database";

// GET /api/admin/users - List users (admin only)
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
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 50);
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    let query = supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (status) {
      query = query.eq("status", status as UserStatus);
    }

    if (search) {
      // Sanitize search input to prevent SQL injection via .or() filter
      const sanitized = search.replace(/[%_\\]/g, "\\$&");
      query = query.or(
        `user_handle.ilike.%${sanitized}%,display_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`
      );
    }

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: users, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "ユーザー一覧の取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const hasMore = (users?.length ?? 0) > limit;
    const items = hasMore ? users!.slice(0, limit) : (users ?? []);
    const nextCursor = hasMore ? items[items.length - 1].created_at : null;

    return NextResponse.json({
      data: { users: items, nextCursor, hasMore },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
