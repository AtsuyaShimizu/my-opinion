import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const publicAttributes = attributes
      ? {
          gender: attributes.is_gender_public ? attributes.gender : null,
          age_range: attributes.is_age_range_public ? attributes.age_range : null,
          education: attributes.is_education_public ? attributes.education : null,
          occupation: attributes.is_occupation_public ? attributes.occupation : null,
          political_party: attributes.is_political_party_public ? attributes.political_party : null,
          political_stance: attributes.is_political_stance_public ? attributes.political_stance : null,
        }
      : null;

    // Get reaction counts
    const [{ count: goodCount }, { count: badCount }] = await Promise.all([
      supabase
        .from("reactions")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id)
        .eq("reaction_type", "good"),
      supabase
        .from("reactions")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id)
        .eq("reaction_type", "bad"),
    ]);

    // Get reply count
    const { count: replyCount } = await supabase
      .from("posts")
      .select("*", { count: "exact", head: true })
      .eq("parent_post_id", id);

    // Check if current user reacted
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    let currentUserReaction: string | null = null;
    let showBadCount = false;

    if (currentUser) {
      const { data: reaction } = await supabase
        .from("reactions")
        .select("reaction_type")
        .eq("post_id", id)
        .eq("user_id", currentUser.id)
        .single();
      currentUserReaction = reaction?.reaction_type ?? null;
      showBadCount = currentUser.id === post.user_id;
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
        goodCount: goodCount ?? 0,
        badCount: showBadCount ? (badCount ?? 0) : undefined,
        replyCount: replyCount ?? 0,
        currentUserReaction,
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
