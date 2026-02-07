import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/admin/reports/:id - Update report status (admin only)
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
    const { status } = body;

    const validStatuses = ["pending", "reviewed", "resolved"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "status は pending, reviewed, resolved のいずれかを指定してください", status: 400 },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: user.id,
    };

    if (status === "resolved") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("reports")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "通報ステータスの更新に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { message: "通報ステータスを更新しました" },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
