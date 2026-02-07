import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/validations/profile";

// GET /api/users/me - Get current user's full profile
export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    const { data: attributes } = await supabase
      .from("user_attributes")
      .select("*")
      .eq("user_id", authUser.id)
      .single();

    return NextResponse.json({
      data: { ...user, attributes },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

// PUT /api/users/me - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json(
        { error: "認証が必要です", status: 401 },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, status: 400 },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (parsed.data.displayName !== undefined) {
      updateData.display_name = parsed.data.displayName;
    }
    if (parsed.data.bio !== undefined) {
      updateData.bio = parsed.data.bio;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "更新する項目がありません", status: 400 },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", authUser.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "プロフィールの更新に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: user, status: 200 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
