import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { replySchema } from "@/lib/validations/post";

// POST /api/posts/:id/reply - Reply to a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: parentPostId } = await params;
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
    const parsed = replySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, status: 400 },
        { status: 400 }
      );
    }

    // Verify parent post exists
    const { data: parentPost } = await supabase
      .from("posts")
      .select("id, parent_post_id")
      .eq("id", parentPostId)
      .single();

    if (!parentPost) {
      return NextResponse.json(
        { error: "返信先の投稿が見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // If replying to a reply, flatten to the root post
    const rootPostId = parentPost.parent_post_id ?? parentPostId;

    const { data: reply, error } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        content: parsed.data.content,
        parent_post_id: rootPostId,
      })
      .select()
      .single();

    if (error || !reply) {
      return NextResponse.json(
        { error: "返信の作成に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    // Create notification for the parent post author
    const { data: rootPost } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", rootPostId)
      .single();

    if (rootPost && rootPost.user_id !== user.id) {
      const serviceClient = createServiceClient();
      await serviceClient.from("notifications").insert({
        user_id: rootPost.user_id,
        type: "reply",
        reference_id: reply.id,
        message: "あなたの投稿に返信がありました",
      });
    }

    return NextResponse.json({ data: reply, status: 201 }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
