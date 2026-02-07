import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { randomBytes } from "crypto";

// POST /api/admin/invite/generate - Generate invite codes (admin only)
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

    // Check admin role
    const { data: userData } = await supabase
      .from("users")
      .select("status")
      .eq("id", user.id)
      .single();

    // Simple admin check via user_metadata
    const isAdmin = user.user_metadata?.role === "admin";
    if (!isAdmin || !userData) {
      return NextResponse.json(
        { error: "管理者権限が必要です", status: 403 },
        { status: 403 }
      );
    }

    const body = await request.json();
    const count = Math.min(Math.max(Number(body.count) || 1, 1), 100);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const codes = Array.from({ length: count }, () => ({
      code: randomBytes(4).toString("hex").toUpperCase(),
      created_by: user.id,
      expires_at: expiresAt.toISOString(),
    }));

    const { data: insertedCodes, error } = await supabase
      .from("invite_codes")
      .insert(codes)
      .select("id, code, expires_at, created_at");

    if (error) {
      return NextResponse.json(
        { error: "招待コードの生成に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { data: insertedCodes, status: 201 },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
