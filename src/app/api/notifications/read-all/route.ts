import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/notifications/read-all - Mark all notifications as read
export async function PUT() {
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

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) {
      return NextResponse.json(
        { error: "通知の一括既読に失敗しました", status: 500 },
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
