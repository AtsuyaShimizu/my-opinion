import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/posts/:id/reactions - Add or update reaction score (0-100)
export async function POST(
  request: NextRequest,
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

    const body = await request.json();
    const reactionScore = body.reactionScore;

    if (
      typeof reactionScore !== "number" ||
      !Number.isInteger(reactionScore) ||
      reactionScore < 0 ||
      reactionScore > 100
    ) {
      return NextResponse.json(
        { error: "reactionScore は 0 以上 100 以下の整数を指定してください", status: 400 },
        { status: 400 }
      );
    }

    // Verify post exists and check ownership
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

    // Prevent self-reaction
    if (post.user_id === user.id) {
      return NextResponse.json(
        { error: "自分の投稿には評価できません", status: 403 },
        { status: 403 }
      );
    }

    // Get reactor's attribute snapshot
    const { data: attributes } = await supabase
      .from("user_attributes")
      .select("gender, age_range, education, occupation, political_party, political_stance")
      .eq("user_id", user.id)
      .single();

    // Check if user already reacted
    const { data: existingReaction } = await supabase
      .from("reactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    if (existingReaction) {
      // Update existing reaction score
      const { error } = await supabase
        .from("reactions")
        .update({ reaction_score: reactionScore })
        .eq("id", existingReaction.id);

      if (error) {
        return NextResponse.json(
          { error: "評価の更新に失敗しました", status: 500 },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: { message: "評価を更新しました", reactionScore },
        status: 200,
      });
    }

    // Create new reaction
    const { error } = await supabase.from("reactions").insert({
      user_id: user.id,
      post_id: postId,
      reaction_score: reactionScore,
      reactor_attribute_snapshot: attributes ?? undefined,
    });

    if (error) {
      return NextResponse.json(
        { error: "評価に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: "評価しました", reactionScore }, status: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/:id/reactions - Remove reaction
export async function DELETE(
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

    const { error } = await supabase
      .from("reactions")
      .delete()
      .eq("user_id", user.id)
      .eq("post_id", postId);

    if (error) {
      return NextResponse.json(
        { error: "評価の取り消しに失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: null, status: 200 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
