import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { enrichPostsWithAuthorAndReactions } from "@/lib/utils/enrichPosts";

const DEFAULT_LIMIT = 20;
const VALID_SORT = ["latest", "popular", "controversial"] as const;
const VALID_FILTER_KEYS = ["gender", "age_range", "occupation", "political_stance"] as const;

// GET /api/timeline/explore - Explore timeline (all public posts)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const cursor = searchParams.get("cursor");
    const sort = VALID_SORT.includes(searchParams.get("sort") as typeof VALID_SORT[number])
      ? (searchParams.get("sort") as typeof VALID_SORT[number])
      : "latest";
    const limit = Math.min(
      parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10),
      50
    );

    // Parse attribute filters
    const filters: Record<string, string> = {};
    for (const key of VALID_FILTER_KEYS) {
      const val = searchParams.get(key);
      if (val) filters[key] = val;
    }
    const hasFilters = Object.keys(filters).length > 0;

    // TODO: popular/controversial/フィルタ使用時は最大200件を取得してインメモリ処理している。
    // 投稿数が増えた場合、DBレベルでのJOIN+ソートやマテリアライズドビューへの移行を検討すること。
    const needsInMemorySort = sort === "popular" || sort === "controversial" || hasFilters;
    const fetchLimit = needsInMemorySort ? 200 : limit + 1;

    let query = supabase
      .from("posts")
      .select("*")
      .is("parent_post_id", null)
      .order("created_at", { ascending: false })
      .limit(fetchLimit);

    if (cursor && !needsInMemorySort) {
      query = query.lt("created_at", cursor);
    }

    const { data: posts, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "タイムラインの取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let enrichedPosts = await enrichPostsWithAuthorAndReactions(
      supabase,
      posts ?? [],
      currentUser?.id ?? null
    );

    // Apply attribute filters
    if (hasFilters) {
      enrichedPosts = enrichedPosts.filter((post) => {
        if (!post.author?.attributes) return false;
        const attrs = post.author.attributes as Record<string, string | null>;
        return Object.entries(filters).every(
          ([key, val]) => attrs[key] === val
        );
      });
    }

    // Sort by popularity if requested (by reaction count, then by average score)
    if (sort === "popular") {
      enrichedPosts.sort((a, b) => b.reactionCount - a.reactionCount || (b.averageScore ?? 0) - (a.averageScore ?? 0));
    }

    // Sort by controversy: averageScore close to 50 + high reactionCount
    if (sort === "controversial") {
      enrichedPosts.sort((a, b) => {
        const aScore = a.reactionCount * (1 - Math.abs((a.averageScore ?? 50) - 50) / 50);
        const bScore = b.reactionCount * (1 - Math.abs((b.averageScore ?? 50) - 50) / 50);
        return bScore - aScore;
      });
    }

    // Paginate (cursor-based for popular/controversial/filtered uses offset)
    const cursorOffset = cursor ? parseInt(cursor, 10) : 0;
    if (needsInMemorySort) {
      enrichedPosts = enrichedPosts.slice(cursorOffset, cursorOffset + limit);
    } else {
      // Already paginated via DB cursor for latest
      const dbHasMore = (posts?.length ?? 0) > limit;
      enrichedPosts = dbHasMore ? enrichedPosts.slice(0, limit) : enrichedPosts;
    }

    const resultHasMore = needsInMemorySort
      ? enrichedPosts.length === limit
      : (posts?.length ?? 0) > limit;
    const resultNextCursor = needsInMemorySort
      ? (resultHasMore ? String(cursorOffset + limit) : null)
      : (resultHasMore ? enrichedPosts[enrichedPosts.length - 1]?.created_at ?? null : null);

    return NextResponse.json({
      data: {
        items: enrichedPosts,
        nextCursor: resultNextCursor,
        hasMore: resultHasMore,
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
