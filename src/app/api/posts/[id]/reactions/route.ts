import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/posts/:id/reactions - Add reaction (Good/Bad)
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
    const reactionType = body.reactionType;

    if (reactionType !== "good" && reactionType !== "bad") {
      return NextResponse.json(
        { error: "reactionType は good または bad を指定してください", status: 400 },
        { status: 400 }
      );
    }

    // Verify post exists
    const { data: post } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (!post) {
      return NextResponse.json(
        { error: "投稿が見つかりません", status: 404 },
        { status: 404 }
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
      .select("id, reaction_type")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .single();

    if (existingReaction) {
      if (existingReaction.reaction_type === reactionType) {
        return NextResponse.json(
          { error: "既に同じ評価をしています", status: 409 },
          { status: 409 }
        );
      }
      // Switch reaction type
      const { error } = await supabase
        .from("reactions")
        .update({ reaction_type: reactionType })
        .eq("id", existingReaction.id);

      if (error) {
        return NextResponse.json(
          { error: "評価の更新に失敗しました", status: 500 },
          { status: 500 }
        );
      }

      return NextResponse.json({
        data: { message: "評価を更新しました", reactionType },
        status: 200,
      });
    }

    // Create new reaction
    const { error } = await supabase.from("reactions").insert({
      user_id: user.id,
      post_id: postId,
      reaction_type: reactionType,
      reactor_attribute_snapshot: attributes ?? undefined,
    });

    if (error) {
      return NextResponse.json(
        { error: "評価に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: "評価しました", reactionType }, status: 201 },
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
