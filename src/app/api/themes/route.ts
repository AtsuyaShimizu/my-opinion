import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateConsensusScore } from "@/lib/utils/consensus";

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

    const themeList = themes ?? [];
    if (themeList.length === 0) {
      return NextResponse.json({ data: [], status: 200 });
    }

    const themeIds = themeList.map((t) => t.id);

    // Batch: get all theme_posts for all themes at once
    const { data: allThemePosts } = await supabase
      .from("theme_posts")
      .select("theme_id, post_id")
      .in("theme_id", themeIds);

    // Group post IDs by theme
    const themePostMap = new Map<string, string[]>();
    for (const tp of allThemePosts ?? []) {
      const posts = themePostMap.get(tp.theme_id) ?? [];
      posts.push(tp.post_id);
      themePostMap.set(tp.theme_id, posts);
    }

    // Collect all unique post IDs across all themes
    const allPostIds = [...new Set((allThemePosts ?? []).map((tp) => tp.post_id))];

    // Batch: get user_ids for participant counts + reactions for consensus scores
    const [postsResult, reactionsResult] = await Promise.all([
      allPostIds.length > 0
        ? supabase.from("posts").select("id, user_id").in("id", allPostIds)
        : Promise.resolve({ data: [] as { id: string; user_id: string }[] }),
      allPostIds.length > 0
        ? supabase.from("reactions").select("post_id, reaction_score").in("post_id", allPostIds)
        : Promise.resolve({ data: [] as { post_id: string; reaction_score: number }[] }),
    ]);

    const postUserMap = new Map<string, string>();
    for (const p of postsResult.data ?? []) {
      postUserMap.set(p.id, p.user_id);
    }

    // Group reactions by post_id
    const reactionsByPost = new Map<string, { reaction_score: number }[]>();
    for (const r of reactionsResult.data ?? []) {
      const list = reactionsByPost.get(r.post_id) ?? [];
      list.push({ reaction_score: r.reaction_score });
      reactionsByPost.set(r.post_id, list);
    }

    // Enrich each theme using pre-fetched data
    const enrichedThemes = themeList.map((theme) => {
      const postIds = themePostMap.get(theme.id) ?? [];
      const postCount = postIds.length;

      // Participant count
      const uniqueUsers = new Set<string>();
      for (const pid of postIds) {
        const uid = postUserMap.get(pid);
        if (uid) uniqueUsers.add(uid);
      }
      const participantCount = uniqueUsers.size;

      // Consensus score
      const themeReactions: { reaction_score: number }[] = [];
      for (const pid of postIds) {
        const reactions = reactionsByPost.get(pid);
        if (reactions) themeReactions.push(...reactions);
      }
      const consensusScore = calculateConsensusScore(themeReactions);

      return {
        ...theme,
        postCount,
        participantCount,
        consensusScore,
      };
    });

    return NextResponse.json({ data: enrichedThemes, status: 200 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
