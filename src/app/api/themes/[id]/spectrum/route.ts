import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ReactorAttributeSnapshot } from "@/types/database";
import { ATTRIBUTE_KEYS } from "@/lib/utils/consensus";
import type { AttributeKey } from "@/lib/utils/consensus";

// Numeric mapping for attribute values on the X axis
const POLITICAL_STANCE_ORDER: Record<string, number> = {
  left: 0,
  center_left: 1,
  center: 2,
  center_right: 3,
  right: 4,
};

const AGE_RANGE_ORDER: Record<string, number> = {
  "18-24": 0,
  "25-29": 1,
  "30-34": 2,
  "35-39": 3,
  "40-44": 4,
  "45-49": 5,
  "50-54": 6,
  "55-59": 7,
  "60-64": 8,
  "65_and_over": 9,
};

const EDUCATION_ORDER: Record<string, number> = {
  junior_high: 0,
  high_school: 1,
  vocational: 2,
  junior_college: 3,
  university: 4,
  masters: 5,
  doctorate: 6,
  other: 7,
};

function getAttributeNumericValue(
  key: AttributeKey,
  value: string
): number | null {
  switch (key) {
    case "political_stance":
      return POLITICAL_STANCE_ORDER[value] ?? null;
    case "age_range":
      return AGE_RANGE_ORDER[value] ?? null;
    case "education":
      return EDUCATION_ORDER[value] ?? null;
    default:
      // For categorical attributes (gender, occupation, political_party),
      // assign sequential indices based on encountered values
      return null;
  }
}

// GET /api/themes/:id/spectrum - Get spectrum scatter data
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: themeId } = await params;
    const supabase = await createClient();
    const { searchParams } = request.nextUrl;

    // Validate attribute parameter
    const xAxis = searchParams.get("attribute") ?? "political_stance";
    if (!ATTRIBUTE_KEYS.includes(xAxis as AttributeKey)) {
      return NextResponse.json(
        { error: "無効な属性キーです", status: 400 },
        { status: 400 }
      );
    }
    const attributeKey = xAxis as AttributeKey;

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
        data: { points: [], xAxisLabels: [] },
        status: 200,
      });
    }

    // Get posts with author info
    const { data: posts } = await supabase
      .from("posts")
      .select("id, user_id, content")
      .in("id", postIds);

    if (!posts || posts.length === 0) {
      return NextResponse.json({
        data: { points: [], xAxisLabels: [] },
        status: 200,
      });
    }

    // Get author handles
    const authorIds = [...new Set(posts.map((p) => p.user_id))];
    const { data: users } = await supabase
      .from("users")
      .select("id, user_handle")
      .in("id", authorIds);
    const userHandleMap = new Map(
      users?.map((u) => [u.id, u.user_handle]) ?? []
    );

    // Get reactions grouped by post
    const { data: reactions } = await supabase
      .from("reactions")
      .select("post_id, reaction_score, reactor_attribute_snapshot")
      .in("post_id", postIds);

    // Build reaction stats per post
    const postReactions = new Map<
      string,
      { count: number; totalScore: number }
    >();
    for (const r of reactions ?? []) {
      const stats = postReactions.get(r.post_id) ?? { count: 0, totalScore: 0 };
      stats.count++;
      stats.totalScore += r.reaction_score;
      postReactions.set(r.post_id, stats);
    }

    // Calculate average reactor attribute per post for the selected axis
    const postAttributeValues = new Map<string, number>();
    const categoricalValueSet = new Set<string>();

    // First pass: collect categorical values for non-ordinal attributes
    for (const r of reactions ?? []) {
      const snapshot =
        r.reactor_attribute_snapshot as ReactorAttributeSnapshot | null;
      if (!snapshot) continue;
      const val = snapshot[attributeKey];
      if (val != null) categoricalValueSet.add(String(val));
    }

    // Build categorical index for non-ordinal attributes
    const categoricalValues = [...categoricalValueSet].sort();
    const categoricalIndex = new Map<string, number>();
    categoricalValues.forEach((v, i) => categoricalIndex.set(v, i));

    // Second pass: compute average attribute value of reactors per post
    const postReactorAttrs = new Map<string, number[]>();
    for (const r of reactions ?? []) {
      const snapshot =
        r.reactor_attribute_snapshot as ReactorAttributeSnapshot | null;
      if (!snapshot) continue;
      const val = snapshot[attributeKey];
      if (val == null) continue;
      const strVal = String(val);

      let numericVal = getAttributeNumericValue(attributeKey, strVal);
      if (numericVal === null) {
        numericVal = categoricalIndex.get(strVal) ?? 0;
      }

      const arr = postReactorAttrs.get(r.post_id) ?? [];
      arr.push(numericVal);
      postReactorAttrs.set(r.post_id, arr);
    }

    for (const [postId, values] of postReactorAttrs) {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      postAttributeValues.set(postId, avg);
    }

    // Build spectrum data points
    const points = posts
      .map((post) => {
        const stats = postReactions.get(post.id) ?? { count: 0, totalScore: 0 };
        if (stats.count === 0) return null;

        const x = postAttributeValues.get(post.id);
        if (x === undefined) return null;

        const y = Math.round(stats.totalScore / stats.count);

        return {
          postId: post.id,
          x: Math.round(x * 100) / 100,
          y,
          isOwnPost: user ? post.user_id === user.id : false,
          authorHandle: userHandleMap.get(post.user_id) ?? "",
          contentPreview: post.content.slice(0, 50),
          averageScore: y,
          reactionCount: stats.count,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    // Build axis labels
    let xAxisLabels: string[];
    const ordinalMap = getOrdinalLabels(attributeKey);
    if (ordinalMap) {
      xAxisLabels = ordinalMap;
    } else {
      xAxisLabels = categoricalValues;
    }

    return NextResponse.json({
      data: { points, xAxisLabels },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

function getOrdinalLabels(key: AttributeKey): string[] | null {
  switch (key) {
    case "political_stance":
      return ["左派", "やや左派", "中道", "やや右派", "右派"];
    case "age_range":
      return [
        "18-24",
        "25-29",
        "30-34",
        "35-39",
        "40-44",
        "45-49",
        "50-54",
        "55-59",
        "60-64",
        "65歳以上",
      ];
    case "education":
      return [
        "中学校",
        "高校",
        "専門学校",
        "短大",
        "大学",
        "大学院(修士)",
        "大学院(博士)",
        "その他",
      ];
    default:
      return null;
  }
}
