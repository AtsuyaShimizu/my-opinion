import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_LIMIT = 20;

// GET /api/timeline/explore - Explore timeline (all public posts)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      50
    );

    let query = supabase
      .from("posts")
      .select("*")
      .is("parent_post_id", null)
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

    // Enrich with author info
    const userIds = [...new Set(items.map((p) => p.user_id))];
    const postIds = items.map((p) => p.id);

    // TODO: RLSにより user_attributes の SELECT は auth.uid() = user_id に制限されている。
    // 他ユーザーの属性を取得するにはサービスロールクライアントを使用するか、
    // 公開属性のみ読み取り可能なRLSポリシーを追加する必要がある。
    const [usersResult, attributesResult, reactionsResult] = await Promise.all([
      supabase
        .from("users")
        .select("id, user_handle, display_name, avatar_url")
        .in("id", userIds.length > 0 ? userIds : ["__none__"]),
      supabase
        .from("user_attributes")
        .select("*")
        .in("user_id", userIds.length > 0 ? userIds : ["__none__"]),
      supabase
        .from("reactions")
        .select("post_id, reaction_type")
        .in("post_id", postIds.length > 0 ? postIds : ["__none__"]),
    ]);

    const userMap = new Map(usersResult.data?.map((u) => [u.id, u]) ?? []);
    const attrMap = new Map(attributesResult.data?.map((a) => [a.user_id, a]) ?? []);

    const reactionCounts = new Map<string, { good: number; bad: number }>();
    for (const r of reactionsResult.data ?? []) {
      const counts = reactionCounts.get(r.post_id) ?? { good: 0, bad: 0 };
      if (r.reaction_type === "good") counts.good++;
      else counts.bad++;
      reactionCounts.set(r.post_id, counts);
    }

    // Get current user's reactions if authenticated
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let userReactionMap = new Map<string, string>();
    if (currentUser) {
      const { data: userReactions } = await supabase
        .from("reactions")
        .select("post_id, reaction_type")
        .eq("user_id", currentUser.id)
        .in("post_id", postIds.length > 0 ? postIds : ["__none__"]);
      userReactionMap = new Map(
        userReactions?.map((r) => [r.post_id, r.reaction_type]) ?? []
      );
    }

    const enrichedPosts = items.map((post) => {
      const author = userMap.get(post.user_id);
      const attrs = attrMap.get(post.user_id);
      const counts = reactionCounts.get(post.id) ?? { good: 0, bad: 0 };
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
        ...post,
        author: author ? { ...author, attributes: publicAttributes } : null,
        goodCount: counts.good,
        badCount: currentUser?.id === post.user_id ? counts.bad : undefined,
        currentUserReaction: userReactionMap.get(post.id) ?? null,
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
