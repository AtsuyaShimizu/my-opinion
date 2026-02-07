import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/admin/themes/:id - Update theme (admin only)
export async function PUT(
  request: NextRequest,
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

    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin) {
      return NextResponse.json(
        { error: "管理者権限が必要です", status: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, endDate, status } = body;

    const updateData: Record<string, unknown> = {};

    if (title !== undefined) {
      if (title.length === 0 || title.length > 50) {
        return NextResponse.json(
          { error: "タイトルは1〜50文字で入力してください", status: 400 },
          { status: 400 }
        );
      }
      updateData.title = title;
    }

    if (description !== undefined) {
      if (description && description.length > 500) {
        return NextResponse.json(
          { error: "説明文は500文字以内で入力してください", status: 400 },
          { status: 400 }
        );
      }
      updateData.description = description || null;
    }

    if (endDate !== undefined) {
      updateData.end_date = endDate;
    }

    if (status !== undefined) {
      const validStatuses = ["active", "ended"];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: "status は active または ended を指定してください", status: 400 },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "更新するフィールドを指定してください", status: 400 },
        { status: 400 }
      );
    }

    const { data: theme, error } = await supabase
      .from("themes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "テーマの更新に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: theme, status: 200 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
