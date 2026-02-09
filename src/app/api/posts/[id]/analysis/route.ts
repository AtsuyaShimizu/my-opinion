import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReactorAttributeSnapshot } from "@/types/database";

const MIN_SAMPLE_SIZE = 20;
const MIN_CELL_SIZE = 5;

type AttributeKey = keyof ReactorAttributeSnapshot;

// GET /api/posts/:id/analysis - Post analysis (author only)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    // Verify user owns this post
    const { data: post } = await supabase
      .from("posts")
      .select("id, user_id")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json(
        { error: "投稿が見つかりません", status: 404 },
        { status: 404 }
      );
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: "分析は投稿者本人のみ閲覧可能です", status: 403 },
        { status: 403 }
      );
    }

    // Get all reactions for this post
    const { data: reactions } = await supabase
      .from("reactions")
      .select("reaction_score, reactor_attribute_snapshot")
      .eq("post_id", postId);

    const totalReactions = reactions?.length ?? 0;

    if (totalReactions < MIN_SAMPLE_SIZE) {
      return NextResponse.json({
        data: {
          available: false,
          totalReactions,
          remainingForAnalysis: MIN_SAMPLE_SIZE - totalReactions,
          message: `あと${MIN_SAMPLE_SIZE - totalReactions}人の評価で分析が見られます`,
        },
        status: 200,
      });
    }

    // Calculate overall score stats
    const scores = reactions!.map((r) => r.reaction_score);
    const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / totalReactions);

    // Score distribution in 5 bins: 0-20, 21-40, 41-60, 61-80, 81-100
    const scoreDistribution = [
      { range: "0-20", count: 0 },
      { range: "21-40", count: 0 },
      { range: "41-60", count: 0 },
      { range: "61-80", count: 0 },
      { range: "81-100", count: 0 },
    ];
    for (const score of scores) {
      if (score <= 20) scoreDistribution[0].count++;
      else if (score <= 40) scoreDistribution[1].count++;
      else if (score <= 60) scoreDistribution[2].count++;
      else if (score <= 80) scoreDistribution[3].count++;
      else scoreDistribution[4].count++;
    }

    // Build attribute distributions and cross-tabulations (score-based)
    const attributeKeys: AttributeKey[] = [
      "gender",
      "age_range",
      "education",
      "occupation",
      "political_party",
      "political_stance",
    ];

    const attributeDistribution: Record<string, Record<string, number>> = {};
    const crossTabulation: Record<
      string,
      Record<string, { count: number; totalScore: number; averageScore: number }>
    > = {};

    for (const key of attributeKeys) {
      attributeDistribution[key] = {};
      crossTabulation[key] = {};
    }

    for (const reaction of reactions!) {
      const snapshot = reaction.reactor_attribute_snapshot as ReactorAttributeSnapshot | null;
      if (!snapshot) continue;

      for (const key of attributeKeys) {
        const value = snapshot[key];
        if (value == null) continue;
        const strValue = String(value);

        // Distribution
        attributeDistribution[key][strValue] =
          (attributeDistribution[key][strValue] ?? 0) + 1;

        // Cross-tabulation (score-based)
        if (!crossTabulation[key][strValue]) {
          crossTabulation[key][strValue] = { count: 0, totalScore: 0, averageScore: 0 };
        }
        crossTabulation[key][strValue].count++;
        crossTabulation[key][strValue].totalScore += reaction.reaction_score;
      }
    }

    // Calculate averages and apply k-anonymization
    const filteredDistribution: Record<string, Record<string, number>> = {};
    const filteredCrossTab: Record<
      string,
      Record<string, { count: number; averageScore: number }>
    > = {};

    for (const key of attributeKeys) {
      filteredDistribution[key] = {};
      filteredCrossTab[key] = {};

      for (const [value, count] of Object.entries(attributeDistribution[key])) {
        if (count >= MIN_CELL_SIZE) {
          filteredDistribution[key][value] = count;
          const ct = crossTabulation[key][value];
          filteredCrossTab[key][value] = {
            count: ct.count,
            averageScore: Math.round(ct.totalScore / ct.count),
          };
        }
      }
    }

    return NextResponse.json({
      data: {
        available: true,
        totalReactions,
        averageScore,
        scoreDistribution,
        attributeDistribution: filteredDistribution,
        crossTabulation: filteredCrossTab,
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
