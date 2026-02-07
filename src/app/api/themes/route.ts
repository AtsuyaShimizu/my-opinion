import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/themes - List active themes
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;
    const includeEnded = searchParams.get("includeEnded") === "true";

    let query = supabase
      .from("themes")
      .select("*")
      .order("created_at", { ascending: false });

    if (!includeEnded) {
      query = query.eq("status", "active");
    }

    const { data: themes, error } = await query;

    if (error) {
      return NextResponse.json(
        { error: "テーマ一覧の取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    // Get post counts and participant counts for each theme
    const enrichedThemes = await Promise.all(
      (themes ?? []).map(async (theme) => {
        const { count: postCount } = await supabase
          .from("theme_posts")
          .select("*", { count: "exact", head: true })
          .eq("theme_id", theme.id);

        // Get unique participant count
        const { data: themePosts } = await supabase
          .from("theme_posts")
          .select("post_id")
          .eq("theme_id", theme.id);

        let participantCount = 0;
        if (themePosts && themePosts.length > 0) {
          const postIds = themePosts.map((tp) => tp.post_id);
          const { data: posts } = await supabase
            .from("posts")
            .select("user_id")
            .in("id", postIds);
          const uniqueUsers = new Set(posts?.map((p) => p.user_id) ?? []);
          participantCount = uniqueUsers.size;
        }

        return {
          ...theme,
          postCount: postCount ?? 0,
          participantCount,
        };
      })
    );

    return NextResponse.json({ data: enrichedThemes, status: 200 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
