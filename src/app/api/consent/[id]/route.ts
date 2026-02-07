import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// DELETE /api/consent/:id - Revoke consent
export async function DELETE(
  _request: NextRequest,
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

    // Verify the consent belongs to this user
    const { data: consent } = await supabase
      .from("consent_records")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .single();

    if (!consent) {
      return NextResponse.json(
        { error: "同意記録が見つかりません", status: 404 },
        { status: 404 }
      );
    }

    // Revoke consent by setting revoked_at
    const { error } = await supabase
      .from("consent_records")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { error: "同意の撤回に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    // If sensitive info consent is revoked, hide political attributes
    if (consent.consent_type === "sensitive_personal_info") {
      await supabase
        .from("user_attributes")
        .update({
          is_political_party_public: false,
          is_political_stance_public: false,
        })
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      data: { message: "同意を撤回しました" },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
