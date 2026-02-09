import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPostSchema } from "@/lib/validations/post";

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const parsed = createPostSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, status: 400 },
        { status: 400 }
      );
    }

    const { title, content, themeId } = parsed.data;

    // Normalize title: empty string -> null
    const normalizedTitle = title?.trim() || null;

    // Create post
    const { data: post, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: user.id,
        title: normalizedTitle,
        content,
      })
      .select()
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: "投稿の作成に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    // Link to theme if specified
    if (themeId) {
      const { data: theme } = await supabase
        .from("themes")
        .select("id")
        .eq("id", themeId)
        .eq("status", "active")
        .single();

      if (theme) {
        await supabase.from("theme_posts").insert({
          theme_id: themeId,
          post_id: post.id,
        });
      }
    }

    return NextResponse.json({ data: post, status: 201 }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
