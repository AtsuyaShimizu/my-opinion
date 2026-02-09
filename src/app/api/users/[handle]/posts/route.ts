import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { extractPublicAttributes } from "@/lib/utils/attributes";
import { aggregateReactionStats, computeAverageScore } from "@/lib/utils/reactions";

const DEFAULT_LIMIT = 20;

// GET /api/users/:handle/posts - Get posts by a specific user
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

    // Resolve handle to user id
    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("id, user_handle, display_name, avatar_url")
      .eq("user_handle", handle)
      .eq("status", "active")
      .single();

    if (userError || !targetUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Fetch posts by this user (exclude replies)
    let query = supabase
      .from("posts")
      .select("*")
      .eq("user_id", targetUser.id)
      .is("parent_post_id", null)
      .order("created_at", { ascending: false })
      .limit(limit + 1);

    if (cursor) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "投稿の取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const hasMore = (posts?.length ?? 0) > limit;
    const items = hasMore ? posts!.slice(0, limit) : (posts ?? []);
    const nextCursor = hasMore ? items[items.length - 1].created_at : null;

    const postIds = items.map((p) => p.id);

    // Fetch reactions and reply counts in parallel
    const [reactionsResult, repliesResult, attributesResult] = await Promise.all([
      supabase
        .from("reactions")
        .select("post_id, reaction_score")
        .in("post_id", postIds.length > 0 ? postIds : ["__none__"]),
      supabase
        .from("posts")
        .select("parent_post_id")
        .in("parent_post_id", postIds.length > 0 ? postIds : ["__none__"]),
      createServiceClient()
        .from("user_attributes")
        .select("*")
        .eq("user_id", targetUser.id)
        .single(),
    ]);

    const reactionStats = aggregateReactionStats(reactionsResult.data ?? []);

    // Count replies per post
    const replyCounts = new Map<string, number>();
    for (const r of repliesResult.data ?? []) {
      if (r.parent_post_id) {
        replyCounts.set(r.parent_post_id, (replyCounts.get(r.parent_post_id) ?? 0) + 1);
      }
    }

    // Get current user's reactions
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let userReactionMap = new Map<string, number>();
    if (currentUser) {
      const { data: userReactions } = await supabase
        .from("reactions")
        .select("post_id, reaction_score")
        .eq("user_id", currentUser.id)
        .in("post_id", postIds.length > 0 ? postIds : ["__none__"]);
      userReactionMap = new Map(
        userReactions?.map((r) => [r.post_id, r.reaction_score]) ?? []
      );
    }

    const publicAttributes = extractPublicAttributes(attributesResult.data);

    const enrichedPosts = items.map((post) => {
      const stats = reactionStats.get(post.id);
      return {
        ...post,
        author: {
          user_handle: targetUser.user_handle,
          display_name: targetUser.display_name,
          avatar_url: targetUser.avatar_url,
          attributes: publicAttributes,
        },
        reactionCount: stats?.count ?? 0,
        averageScore: computeAverageScore(stats),
        replyCount: replyCounts.get(post.id) ?? 0,
        repostCount: 0,
        currentUserScore: userReactionMap.get(post.id) ?? null,
      };
    });

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
