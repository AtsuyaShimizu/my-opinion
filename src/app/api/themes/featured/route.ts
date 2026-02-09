import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateConsensusScore } from "@/lib/utils/consensus";

// GET /api/themes/featured - Get featured theme + trending themes
export async function GET() {
  try {
    const supabase = await createClient();

    // Get all active themes
    const { data: themes, error } = await supabase
      .from("themes")
      .select("*")
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "テーマの取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    if (!themes || themes.length === 0) {
      return NextResponse.json({
        data: { featured: null, trending: [] },
        status: 200,
      });
    }

    const themeIds = themes.map((t) => t.id);

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
    const enrichedThemes = themes.map((theme) => {
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
        id: theme.id,
        title: theme.title,
        description: theme.description,
        postCount,
        participantCount,
        consensusScore,
        start_date: theme.start_date,
        end_date: theme.end_date,
        status: theme.status,
      };
    });

    // Featured = most recent active theme (typically the "weekly theme")
    const featured = enrichedThemes[0] ?? null;

    // Trending = remaining themes sorted by post count descending
    const trending = enrichedThemes
      .slice(1)
      .sort((a, b) => b.postCount - a.postCount)
      .slice(0, 10);

    return NextResponse.json({
      data: { featured, trending },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
