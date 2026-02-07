import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/admin/stats - Admin statistics dashboard
export async function GET() {
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

    // Fetch counts in parallel
    const [
      usersResult,
      activeUsersResult,
      postsResult,
      reactionsResult,
      reportsResult,
      pendingReportsResult,
    ] = await Promise.all([
      supabase
        .from("users")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("posts")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("reactions")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true }),
      supabase
        .from("reports")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    // Posts in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: postsToday } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    // New users in last 24 hours
    const { count: newUsersToday } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", oneDayAgo);

    return NextResponse.json({
      data: {
        totalUsers: usersResult.count ?? 0,
        activeUsers: activeUsersResult.count ?? 0,
        totalPosts: postsResult.count ?? 0,
        totalReactions: reactionsResult.count ?? 0,
        totalReports: reportsResult.count ?? 0,
        pendingReports: pendingReportsResult.count ?? 0,
        postsToday: postsToday ?? 0,
        newUsersToday: newUsersToday ?? 0,
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
