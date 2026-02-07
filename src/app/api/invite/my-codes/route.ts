import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/invite/my-codes - List user's invite codes
export async function GET() {
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

    const { data: codes, error } = await supabase
      .from("invite_codes")
      .select("id, code, used_by, expires_at, used_at, created_at")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "招待コードの取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: codes ?? [], status: 200 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
