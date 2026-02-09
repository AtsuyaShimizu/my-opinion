import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichPostsWithAuthorAndReactions } from "@/lib/utils/enrichPosts";

const DEFAULT_LIMIT = 20;

// GET /api/posts/:id/replies - Get replies to a post with reaction data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      50
    );

    const supabase = await createClient();

    let query = supabase
      .from("posts")
      .select("*")
      .eq("parent_post_id", postId)
      .order("created_at", { ascending: true })
      .limit(limit + 1);

    if (cursor) {
      query = query.gt("created_at", cursor);
    }

    const { data: replies, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "返信の取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const hasMore = (replies?.length ?? 0) > limit;
    const items = hasMore ? replies!.slice(0, limit) : (replies ?? []);
    const nextCursor = hasMore ? items[items.length - 1].created_at : null;

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    const enrichedReplies = await enrichPostsWithAuthorAndReactions(
      supabase,
      items,
      currentUser?.id ?? null
    );

    // Add reply counts per reply
    const replyIds = items.map((r) => r.id);
    if (replyIds.length > 0) {
      const { data: nestedReplies } = await supabase
        .from("posts")
        .select("parent_post_id")
        .in("parent_post_id", replyIds);

      const replyCounts = new Map<string, number>();
      for (const r of nestedReplies ?? []) {
        if (r.parent_post_id) {
          replyCounts.set(r.parent_post_id, (replyCounts.get(r.parent_post_id) ?? 0) + 1);
        }
      }

      for (const reply of enrichedReplies) {
        (reply as typeof reply & { replyCount: number }).replyCount = replyCounts.get(reply.id) ?? 0;
      }
    }

    return NextResponse.json({
      data: {
        items: enrichedReplies,
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
