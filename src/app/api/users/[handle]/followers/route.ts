import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 20;

// GET /api/users/:handle/followers - Get user's followers
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const supabase = await createClient();

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      50
    );

    // Get user by handle
    const { data: targetUser } = await supabase
      .from("users")
      .select("id")
      .eq("user_handle", handle)
      .eq("status", "active")
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    let query = supabase
      .from("follows")
      .select("follower_id, created_at")
      .eq("following_id", targetUser.id)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: follows, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "フォロワー一覧の取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const hasMore = (follows?.length ?? 0) > limit;
    const items = hasMore ? follows!.slice(0, limit) : (follows ?? []);
    const nextCursor = hasMore ? items[items.length - 1].created_at : null;

    // Get follower user details
    const followerIds = items.map((f) => f.follower_id);

    const { data: users } = await supabase
      .from("users")
      .select("id, user_handle, display_name, avatar_url, bio")
      .in("id", followerIds.length > 0 ? followerIds : ["__none__"]);

    const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);
    const enrichedFollowers = items
      .map((f) => userMap.get(f.follower_id))
      .filter(Boolean);

    return NextResponse.json({
      data: {
        items: enrichedFollowers,
        nextCursor,
        hasMore,
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
