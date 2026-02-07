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
      .select("reaction_type, reactor_attribute_snapshot")
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

    // Calculate Good/Bad ratio
    const goodCount = reactions!.filter((r) => r.reaction_type === "good").length;
    const badCount = totalReactions - goodCount;

    // Build attribute distributions and cross-tabulations
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
      Record<string, { good: number; bad: number }>
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

        // Cross-tabulation
        if (!crossTabulation[key][strValue]) {
          crossTabulation[key][strValue] = { good: 0, bad: 0 };
        }
        if (reaction.reaction_type === "good") {
          crossTabulation[key][strValue].good++;
        } else {
          crossTabulation[key][strValue].bad++;
        }
      }
    }

    // Apply k-anonymization: hide cells with fewer than MIN_CELL_SIZE
    const filteredDistribution: Record<string, Record<string, number>> = {};
    const filteredCrossTab: Record<
      string,
      Record<string, { good: number; bad: number }>
    > = {};

    for (const key of attributeKeys) {
      filteredDistribution[key] = {};
      filteredCrossTab[key] = {};

      for (const [value, count] of Object.entries(attributeDistribution[key])) {
        if (count >= MIN_CELL_SIZE) {
          filteredDistribution[key][value] = count;
          filteredCrossTab[key][value] = crossTabulation[key][value];
        }
      }
    }

    return NextResponse.json({
      data: {
        available: true,
        totalReactions,
        goodBadRatio: {
          good: goodCount,
          bad: badCount,
          goodRate: Math.round((goodCount / totalReactions) * 100),
          badRate: Math.round((badCount / totalReactions) * 100),
        },
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
