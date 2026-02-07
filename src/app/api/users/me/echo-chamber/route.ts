import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/users/me/echo-chamber - Echo chamber index
export async function GET() {
  try {
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

    // Get following list
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = follows?.map((f) => f.following_id) ?? [];

    if (followingIds.length === 0) {
      return NextResponse.json({
        data: {
          score: null,
          message: "フォローしているユーザーがいないため、指標を計算できません",
          distribution: {},
          followingCount: 0,
        },
        status: 200,
      });
    }

    // TODO: RLSにより user_attributes の SELECT は auth.uid() = user_id に制限されている。
    // 他ユーザーの属性を取得するにはサービスロールクライアントを使用するか、
    // 公開属性のみ読み取り可能なRLSポリシーを追加する必要がある。
    // エコーチェンバー指数の計算には他ユーザーの属性が必要。
    const { data: attributes } = await supabase
      .from("user_attributes")
      .select(
        "gender, age_range, education, occupation, political_party, political_stance"
      )
      .in("user_id", followingIds);

    if (!attributes || attributes.length === 0) {
      return NextResponse.json({
        data: {
          score: null,
          message: "フォロー先の属性情報が不足しています",
          distribution: {},
          followingCount: followingIds.length,
        },
        status: 200,
      });
    }

    // Calculate attribute distributions
    const attributeKeys = [
      "gender",
      "age_range",
      "education",
      "occupation",
      "political_party",
      "political_stance",
    ] as const;

    const distribution: Record<string, Record<string, number>> = {};

    for (const key of attributeKeys) {
      distribution[key] = {};
      for (const attr of attributes) {
        const value = attr[key];
        if (value != null) {
          const strValue = String(value);
          distribution[key][strValue] =
            (distribution[key][strValue] ?? 0) + 1;
        }
      }
    }

    // Calculate echo chamber score (0-100)
    // Higher score = more diverse, lower = more echo chamber
    // Based on Shannon entropy normalized by max possible entropy
    let totalScore = 0;
    let validDimensions = 0;

    for (const key of attributeKeys) {
      const counts = Object.values(distribution[key]);
      const total = counts.reduce((a, b) => a + b, 0);
      if (total < 3) continue; // Need at least 3 data points

      const numCategories = counts.length;
      if (numCategories <= 1) {
        totalScore += 0; // Completely homogeneous
        validDimensions++;
        continue;
      }

      // Shannon entropy
      let entropy = 0;
      for (const count of counts) {
        const p = count / total;
        if (p > 0) {
          entropy -= p * Math.log2(p);
        }
      }

      // Normalize by max entropy (uniform distribution)
      const maxEntropy = Math.log2(numCategories);
      const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

      totalScore += normalizedEntropy * 100;
      validDimensions++;
    }

    const score =
      validDimensions > 0
        ? Math.round(totalScore / validDimensions)
        : null;

    return NextResponse.json({
      data: {
        score,
        message:
          score !== null
            ? score >= 70
              ? "フォロー先は多様です"
              : score >= 40
                ? "やや偏りがあります"
                : "かなり偏りがあります。多様なユーザーをフォローしてみましょう"
            : "データが不足しています",
        distribution,
        followingCount: followingIds.length,
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
