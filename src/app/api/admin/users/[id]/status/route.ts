import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AdminActionType, UserStatus } from "@/types/database";

// PUT /api/admin/users/:id/status - Update user status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: targetUserId } = await params;
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
    const { status, reason } = body;

    const validStatuses = ["active", "suspended", "banned"];
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: "status は active, suspended, banned のいずれかを指定してください",
          status: 400,
        },
        { status: 400 }
      );
    }

    // Verify target user exists
    const { data: targetUser } = await supabase
      .from("users")
      .select("id, status")
      .eq("id", targetUserId)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { error: "ユーザーが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Update user status
    const typedStatus = status as UserStatus;
    const { error: updateError } = await supabase
      .from("users")
      .update({ status: typedStatus })
      .eq("id", targetUserId);

    if (updateError) {
      return NextResponse.json(
        { error: "ステータスの更新に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    // Map status to action type
    const actionTypeMap: Record<string, AdminActionType> = {
      suspended: "suspend",
      banned: "ban",
      active: "unban",
    };

    // Record admin action
    await supabase.from("admin_actions").insert({
      admin_id: user.id,
      action_type: actionTypeMap[status as string],
      target_type: "user" as const,
      target_id: targetUserId,
      reason: reason || null,
    });

    return NextResponse.json({
      data: { message: "ユーザーステータスを更新しました" },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
