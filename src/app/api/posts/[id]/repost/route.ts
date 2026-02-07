import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/posts/:id/repost - Repost a post
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: originalPostId } = await params;
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

    // Verify original post exists
    const { data: originalPost } = await supabase
      .from("posts")
      .select("id, user_id, content")
      .eq("id", originalPostId)
      .single();

    if (!originalPost) {
      return NextResponse.json(
        { error: "リポスト元の投稿が見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Check if already reposted
    const { data: existingRepost } = await supabase
      .from("posts")
      .select("id")
      .eq("user_id", user.id)
      .eq("repost_of_id", originalPostId)
      .single();

    if (existingRepost) {
      return NextResponse.json(
        { error: "既にリポスト済みです", status: 409 },
        { status: 409 }
      );
    }

    const { data: repost, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: originalPost.content,
        repost_of_id: originalPostId,
      })
      .select()
      .single();

    if (error || !repost) {
      return NextResponse.json(
        { error: "リポストの作成に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: repost, status: 201 }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
