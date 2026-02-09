import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateConsensusScore } from "@/lib/utils/consensus";

// GET /api/themes/:id - Get theme detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: theme, error } = await supabase
      .from("themes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !theme) {
      return NextResponse.json(
        { error: "テーマが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Get theme posts
    const { data: themePosts } = await supabase
      .from("theme_posts")
      .select("post_id")
      .eq("theme_id", id);

    const postIds = themePosts?.map((tp) => tp.post_id) ?? [];
    const postCount = postIds.length;

    // Get unique participant count
    let participantCount = 0;
    if (postIds.length > 0) {
      const { data: posts } = await supabase
        .from("posts")
        .select("user_id")
        .in("id", postIds);
      const uniqueUsers = new Set(posts?.map((p) => p.user_id) ?? []);
      participantCount = uniqueUsers.size;
    }

    // Calculate consensus score
    let consensusScore = 0;
    if (postIds.length > 0) {
      const { data: reactions } = await supabase
        .from("reactions")
        .select("reaction_score")
        .in("post_id", postIds);
      consensusScore = calculateConsensusScore(reactions ?? []);
    }

    return NextResponse.json({
      data: { ...theme, postCount, participantCount, consensusScore },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
