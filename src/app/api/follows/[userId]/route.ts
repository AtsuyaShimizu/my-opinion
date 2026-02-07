import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

// POST /api/follows/:userId - Follow a user
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;
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

    if (user.id === targetUserId) {
      return NextResponse.json(
        { error: "自分自身をフォローすることはできません", status: 400 },
        { status: 400 }
      );
    }

    // Verify target user exists and is active
    const { data: targetUser } = await supabase
      .from("users")
      .select("id, status")
      .eq("id", targetUserId)
      .single();

    if (!targetUser || targetUser.status !== "active") {
      return NextResponse.json(
        { error: "ユーザーが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .single();

    if (existingFollow) {
      return NextResponse.json(
        { error: "既にフォロー済みです", status: 409 },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("follows").insert({
      follower_id: user.id,
      following_id: targetUserId,
    });

    if (error) {
      return NextResponse.json(
        { error: "フォローに失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const serviceClient = createServiceClient();
    await serviceClient.from("notifications").insert({
      user_id: targetUserId,
      type: "follow",
      reference_id: user.id,
      message: "新しいフォロワーがいます",
    });

    return NextResponse.json({
      data: { message: "フォローしました" },
      status: 201,
    }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

// DELETE /api/follows/:userId - Unfollow a user
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId: targetUserId } = await params;
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
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId);

    if (error) {
      return NextResponse.json(
        { error: "フォロー解除に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { message: "フォローを解除しました" },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
