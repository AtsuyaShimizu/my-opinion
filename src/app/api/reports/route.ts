import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/reports - Create a report
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
    const { targetType, targetId, reason, detail } = body;

    if (!targetType || !targetId || !reason) {
      return NextResponse.json(
        { error: "targetType, targetId, reason は必須です", status: 400 },
        { status: 400 }
      );
    }

    const validTargetTypes = ["post", "user"];
    if (!validTargetTypes.includes(targetType)) {
      return NextResponse.json(
        { error: "targetType は post または user を指定してください", status: 400 },
        { status: 400 }
      );
    }

    const validReasons = [
      "attribute_discrimination",
      "defamation",
      "fake_attribute",
      "impersonation",
      "spam",
      "other",
    ];
    if (!validReasons.includes(reason)) {
      return NextResponse.json(
        { error: "無効な通報理由です", status: 400 },
        { status: 400 }
      );
    }

    // Verify target exists
    if (targetType === "post") {
      const { data: post } = await supabase
        .from("posts")
        .select("id")
        .eq("id", targetId)
        .single();
      if (!post) {
        return NextResponse.json(
          { error: "対象の投稿が見つかりません", status: 404 },
          { status: 404 }
        );
      }
    } else {
      const { data: targetUser } = await supabase
        .from("users")
        .select("id")
        .eq("id", targetId)
        .single();
      if (!targetUser) {
        return NextResponse.json(
          { error: "対象のユーザーが見つかりません", status: 404 },
          { status: 404 }
        );
      }
    }

    // Check for duplicate report
    const { data: existing } = await supabase
      .from("reports")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .eq("status", "pending")
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "既に同じ対象を通報済みです", status: 409 },
        { status: 409 }
      );
    }

    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason,
      detail: detail || null,
    });

    if (error) {
      return NextResponse.json(
        { error: "通報に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: { message: "通報を受け付けました" }, status: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
