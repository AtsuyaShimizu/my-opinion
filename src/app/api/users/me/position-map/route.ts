import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/users/me/position-map - Get position map data (radar chart)
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

    // Get user's posts that are linked to themes
    const { data: userPosts } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", user.id);

    const userPostIds = userPosts?.map((p) => p.id) ?? [];

    if (userPostIds.length === 0) {
      return NextResponse.json({
        data: {
          axes: [],
          echoChamberScore: null,
          message: "投稿がないため、ポジションマップを表示できません",
        },
        status: 200,
      });
    }

    // Get theme_posts for user's posts
    const { data: themePostLinks } = await supabase
      .from("theme_posts")
      .select("theme_id, post_id")
      .in("post_id", userPostIds);

    if (!themePostLinks || themePostLinks.length === 0) {
      return NextResponse.json({
        data: {
          axes: [],
          echoChamberScore: null,
          message:
            "テーマに投稿していないため、ポジションマップを表示できません",
        },
        status: 200,
      });
    }

    // Group user posts by theme
    const themePostMap = new Map<string, string[]>();
    for (const link of themePostLinks) {
      const posts = themePostMap.get(link.theme_id) ?? [];
      posts.push(link.post_id);
      themePostMap.set(link.theme_id, posts);
    }

    const themeIds = [...themePostMap.keys()];

    // Get theme titles
    const { data: themes } = await supabase
      .from("themes")
      .select("id, title")
      .in("id", themeIds);

    const themeTitleMap = new Map(
      themes?.map((t) => [t.id, t.title]) ?? []
    );

    // Batch: get all reactions for all user's theme-linked posts at once
    const allThemePostIds = [...new Set(themePostLinks.map((l) => l.post_id))];
    const { data: allReactions } = await supabase
      .from("reactions")
      .select("post_id, reaction_score")
      .in("post_id", allThemePostIds);

    // Group reactions by post_id
    const reactionsByPost = new Map<string, number[]>();
    for (const r of allReactions ?? []) {
      const list = reactionsByPost.get(r.post_id) ?? [];
      list.push(r.reaction_score);
      reactionsByPost.set(r.post_id, list);
    }

    // For each theme, calculate the average reaction score on user's posts
    const axes: { themeTitle: string; score: number }[] = [];

    for (const [themeId, postIds] of themePostMap) {
      const title = themeTitleMap.get(themeId);
      if (!title) continue;

      // Collect reaction scores from pre-fetched data
      const themeScores: number[] = [];
      for (const pid of postIds) {
        const scores = reactionsByPost.get(pid);
        if (scores) themeScores.push(...scores);
      }

      if (themeScores.length === 0) {
        axes.push({
          themeTitle: title.length > 15 ? title.slice(0, 15) + "..." : title,
          score: 50, // Neutral if no reactions
        });
        continue;
      }

      // Score 0-100: average reaction score
      const score = Math.round(themeScores.reduce((a, b) => a + b, 0) / themeScores.length);

      axes.push({
        themeTitle: title.length > 15 ? title.slice(0, 15) + "..." : title,
        score,
      });
    }

    // Take top 6 themes
    const axesSorted = axes.slice(0, 6);

    // Calculate echo chamber score using the existing logic
    // Get following list
    const { data: follows } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);

    const followingIds = follows?.map((f) => f.following_id) ?? [];

    let echoChamberScore: number | null = null;
    let message = "フォローしているユーザーがいないため、指標を計算できません";

    if (followingIds.length > 0) {
      const { data: attributes } = await supabase
        .from("user_attributes")
        .select(
          "gender, age_range, education, occupation, political_party, political_stance"
        )
        .in("user_id", followingIds);

      if (attributes && attributes.length > 0) {
        const attributeKeys = [
          "gender",
          "age_range",
          "education",
          "occupation",
          "political_party",
          "political_stance",
        ] as const;

        let totalScore = 0;
        let validDimensions = 0;

        for (const key of attributeKeys) {
          const counts: Record<string, number> = {};
          for (const attr of attributes) {
            const value = attr[key];
            if (value != null) {
              const strValue = String(value);
              counts[strValue] = (counts[strValue] ?? 0) + 1;
            }
          }

          const values = Object.values(counts);
          const total = values.reduce((a, b) => a + b, 0);
          if (total < 3) continue;

          const numCategories = values.length;
          if (numCategories <= 1) {
            validDimensions++;
            continue;
          }

          let entropy = 0;
          for (const count of values) {
            const p = count / total;
            if (p > 0) entropy -= p * Math.log2(p);
          }

          const maxEntropy = Math.log2(numCategories);
          const normalizedEntropy =
            maxEntropy > 0 ? entropy / maxEntropy : 0;

          totalScore += normalizedEntropy * 100;
          validDimensions++;
        }

        echoChamberScore =
          validDimensions > 0
            ? Math.round(totalScore / validDimensions)
            : null;

        message =
          echoChamberScore !== null
            ? echoChamberScore >= 70
              ? "フォロー先は多様です"
              : echoChamberScore >= 40
                ? "やや偏りがあります"
                : "かなり偏りがあります。多様なユーザーをフォローしてみましょう"
            : "データが不足しています";
      }
    }

    return NextResponse.json({
      data: {
        axes: axesSorted,
        echoChamberScore,
        message,
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
