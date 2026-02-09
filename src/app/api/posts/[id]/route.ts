import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractPublicAttributes } from "@/lib/utils/attributes";

// GET /api/posts/:id - Get post detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: post, error } = await supabase
      .from("posts")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !post) {
      return NextResponse.json(
        { error: "投稿が見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Get post author info with public attributes
    const { data: author } = await supabase
      .from("users")
      .select("id, user_handle, display_name, avatar_url")
      .eq("id", post.user_id)
      .single();

    // TODO: 他ユーザーの属性取得はRLS制限によりnullが返る可能性がある（user_attributes参照に関するTODO参照）
    const { data: attributes } = await supabase
      .from("user_attributes")
      .select("*")
      .eq("user_id", post.user_id)
      .single();

    const publicAttributes = extractPublicAttributes(attributes);

    // Get reactions for score calculation
    const { data: reactions } = await supabase
      .from("reactions")
      .select("reaction_score")
      .eq("post_id", id);

    const reactionCount = reactions?.length ?? 0;
    const averageScore = reactionCount > 0
      ? Math.round((reactions!.reduce((sum, r) => sum + r.reaction_score, 0) / reactionCount))
      : null;

    // Get reply count
    const { count: replyCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("parent_post_id", id);

    // Check if current user reacted
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let currentUserScore: number | null = null;

    if (currentUser) {
      const { data: reaction } = await supabase
        .from("reactions")
        .select("reaction_score")
        .eq("post_id", id)
        .eq("user_id", currentUser.id)
        .single();
      currentUserScore = reaction?.reaction_score ?? null;
    }

    // Get repost origin if this is a repost
    let repostOf = null;
    if (post.repost_of_id) {
      const { data: originalPost } = await supabase
        .from("posts")
        .select("*")
        .eq("id", post.repost_of_id)
        .single();

      if (originalPost) {
        const { data: originalAuthor } = await supabase
          .from("users")
          .select("id, user_handle, display_name, avatar_url")
          .eq("id", originalPost.user_id)
          .single();
        repostOf = { ...originalPost, author: originalAuthor };
      }
    }

    return NextResponse.json({
      data: {
        ...post,
        author: { ...author, attributes: publicAttributes },
        reactionCount,
        averageScore,
        replyCount: replyCount ?? 0,
        currentUserScore,
        repostOf,
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

// DELETE /api/posts/:id - Delete own post
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Verify the post belongs to the user
    const { data: post } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", id)
      .single();

    if (!post) {
      return NextResponse.json(
        { error: "投稿が見つかりません", status: 404 },
        { status: 404 }
      );
    }

    if (post.user_id !== user.id) {
      return NextResponse.json(
        { error: "この投稿を削除する権限がありません", status: 403 },
        { status: 403 }
      );
    }

    const { error } = await supabase.from("posts").delete().eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "投稿の削除に失敗しました", status: 500 },
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
