import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReactorAttributeSnapshot } from "@/types/database";
import {
  calculateConsensusScore,
  calculateAttributeBreakdown,
} from "@/lib/utils/consensus";

// GET /api/themes/:id/consensus - Get consensus score + attribute breakdown
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: themeId } = await params;
    const supabase = await createClient();

    // Verify theme exists
    const { data: theme } = await supabase
      .from("themes")
      .select("id")
      .eq("id", themeId)
      .single();

    if (!theme) {
      return NextResponse.json(
        { error: "テーマが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Get post IDs for this theme
    const { data: themePosts } = await supabase
      .from("theme_posts")
      .select("post_id")
      .eq("theme_id", themeId);

    const postIds = themePosts?.map((tp) => tp.post_id) ?? [];

    if (postIds.length === 0) {
      return NextResponse.json({
        data: {
          score: 0,
          totalReactions: 0,
          averageScore: null,
          distribution: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          attributeBreakdown: [],
        },
        status: 200,
      });
    }

    // Get all reactions for theme posts with attribute snapshots
    const { data: reactions } = await supabase
      .from("reactions")
      .select("reaction_score, reactor_attribute_snapshot")
      .in("post_id", postIds);

    const reactionsList = (reactions ?? []).map((r) => ({
      reaction_score: r.reaction_score,
      reactor_attribute_snapshot:
        r.reactor_attribute_snapshot as ReactorAttributeSnapshot | null,
    }));

    const score = calculateConsensusScore(reactionsList);
    const attributeBreakdown = calculateAttributeBreakdown(reactionsList);

    // Calculate average score
    let averageScore: number | null = null;
    if (reactionsList.length > 0) {
      const sum = reactionsList.reduce((acc, r) => acc + r.reaction_score, 0);
      averageScore = Math.round(sum / reactionsList.length);
    }

    // Build 10-bin distribution histogram
    // Bins: [0-9, 10-19, 20-29, 30-39, 40-49, 50-59, 60-69, 70-79, 80-89, 90-100]
    const distribution = new Array<number>(10).fill(0);
    for (const r of reactionsList) {
      const bin = r.reaction_score >= 100 ? 9 : Math.floor(r.reaction_score / 10);
      distribution[bin]++;
    }

    return NextResponse.json({
      data: {
        score,
        totalReactions: reactionsList.length,
        averageScore,
        distribution,
        attributeBreakdown,
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
