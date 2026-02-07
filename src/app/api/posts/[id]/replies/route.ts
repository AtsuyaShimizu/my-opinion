import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 20;

// GET /api/posts/:id/replies - Get replies to a post
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

    // Enrich with author info
    const userIds = [...new Set(items.map((r) => r.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, user_handle, display_name, avatar_url")
      .in("id", userIds.length > 0 ? userIds : ["__none__"]);

    const { data: allAttributes } = await supabase
      .from("user_attributes")
      .select("*")
      .in("user_id", userIds.length > 0 ? userIds : ["__none__"]);

    const userMap = new Map(users?.map((u) => [u.id, u]) ?? []);
    const attrMap = new Map(allAttributes?.map((a) => [a.user_id, a]) ?? []);

    const enrichedReplies = items.map((reply) => {
      const author = userMap.get(reply.user_id);
      const attrs = attrMap.get(reply.user_id);
      const publicAttributes = attrs
        ? {
            gender: attrs.is_gender_public ? attrs.gender : null,
            age_range: attrs.is_age_range_public ? attrs.age_range : null,
            education: attrs.is_education_public ? attrs.education : null,
            occupation: attrs.is_occupation_public ? attrs.occupation : null,
            political_party: attrs.is_political_party_public ? attrs.political_party : null,
            political_stance: attrs.is_political_stance_public ? attrs.political_stance : null,
          }
        : null;

      return {
        ...reply,
        author: author ? { ...author, attributes: publicAttributes } : null,
      };
    });

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
