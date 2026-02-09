import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichPostsWithAuthorAndReactions } from "@/lib/utils/enrichPosts";

const DEFAULT_LIMIT = 20;

// GET /api/timeline/home - Home timeline (posts from followed users)
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

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      50
    );

    // Get list of followed user IDs
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = follows?.map((f) => f.following_id) ?? [];
    // Include own posts
    followingIds.push(user.id);

    if (followingIds.length === 0) {
      return NextResponse.json({
        data: { items: [], nextCursor: null, hasMore: false },
        status: 200,
      });
    }

    let query = supabase
      .from("posts")
      .select("*")
      .in("user_id", followingIds)
      .is("parent_post_id", null) // Exclude replies from timeline
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "タイムラインの取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const hasMore = (posts?.length ?? 0) > limit;
    const items = hasMore ? posts!.slice(0, limit) : (posts ?? []);
    const nextCursor = hasMore ? items[items.length - 1].created_at : null;

    const enrichedPosts = await enrichPostsWithAuthorAndReactions(supabase, items, user.id);

    return NextResponse.json({
      data: {
        items: enrichedPosts,
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
