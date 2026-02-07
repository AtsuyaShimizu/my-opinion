import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/admin/posts/:id - Delete post (admin only)
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

    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "管理者権限が必要です", status: 403 },
        { status: 403 }
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

    const { error } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId);

    if (error) {
      return NextResponse.json(
        { error: "投稿の削除に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    // Record admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: "delete_post",
      target_type: "post",
      target_id: postId,
    });

    return NextResponse.json({
      data: { message: "投稿を削除しました" },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
