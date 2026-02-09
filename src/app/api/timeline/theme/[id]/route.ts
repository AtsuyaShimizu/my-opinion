import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichPostsWithAuthorAndReactions } from "@/lib/utils/enrichPosts";

const DEFAULT_LIMIT = 20;

// GET /api/timeline/theme/:id - Theme timeline
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: themeId } = await params;
    const supabase = await createClient();

    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      50
    );

    // Verify theme exists
    const { data: theme } = await supabase
      .from("themes")
      .select("*")
      .eq("id", themeId)
      .single();

    if (!theme) {
      return NextResponse.json(
        { error: "テーマが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Get post IDs linked to this theme
    const { data: themePosts } = await supabase
      .from("theme_posts")
      .select("post_id")
      .eq("theme_id", themeId);

    const postIds = themePosts?.map((tp) => tp.post_id) ?? [];

    if (postIds.length === 0) {
      return NextResponse.json({
        data: {
          theme,
          items: [],
          nextCursor: null,
          hasMore: false,
        },
        status: 200,
      });
    }

    let query = supabase
      .from("posts")
      .select("*")
      .in("id", postIds)
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

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const enrichedPosts = await enrichPostsWithAuthorAndReactions(
      supabase,
      items,
      currentUser?.id ?? null
    );

    return NextResponse.json({
      data: {
        theme,
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
