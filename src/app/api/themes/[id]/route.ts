import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/themes/:id - Get theme detail
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: theme, error } = await supabase
      .from("themes")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !theme) {
      return NextResponse.json(
        { error: "テーマが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    const { count: postCount } = await supabase
      .from("theme_posts")
      .select("*", { count: "exact", head: true })
      .eq("theme_id", id);

    return NextResponse.json({
      data: { ...theme, postCount: postCount ?? 0 },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
