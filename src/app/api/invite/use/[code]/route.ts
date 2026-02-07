import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/invite/use/:code - Mark invite code as used
export async function PUT(
  _request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
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

    // Find valid invite code
    const { data: invite } = await supabase
      .from("invite_codes")
      .select("id")
      .eq("code", code)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (!invite) {
      return NextResponse.json(
        { error: "招待コードが無効または期限切れです", status: 400 },
        { status: 400 }
      );
    }

    // Mark as used
    const { error } = await supabase
      .from("invite_codes")
      .update({
        used_by: user.id,
        used_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (error) {
      return NextResponse.json(
        { error: "招待コードの使用に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { message: "招待コードを使用しました" },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
