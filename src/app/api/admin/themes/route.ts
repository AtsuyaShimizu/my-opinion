import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/admin/themes - Create theme (admin only)
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

    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "管理者権限が必要です", status: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, startDate, endDate } = body;

    if (!title || title.length > 50) {
      return NextResponse.json(
        { error: "タイトルは1〜50文字で入力してください", status: 400 },
        { status: 400 }
      );
    }

    if (description && description.length > 500) {
      return NextResponse.json(
        { error: "説明文は500文字以内で入力してください", status: 400 },
        { status: 400 }
      );
    }

    const { data: theme, error } = await supabase
      .from("themes")
      .insert({
        title,
        description: description || null,
        created_by: user.id,
        start_date: startDate || new Date().toISOString().split("T")[0],
        end_date: endDate || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "テーマの作成に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: theme, status: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
