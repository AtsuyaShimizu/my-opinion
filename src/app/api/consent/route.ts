import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createConsentSchema } from "@/lib/validations/consent";

// GET /api/consent - Get user's consent records
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

    const { data: consents, error } = await supabase
      .from("consent_records")
      .select("*")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .order("consented_at", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "同意記録の取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: consents, status: 200 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}

// POST /api/consent - Create consent record
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
    const parsed = createConsentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, status: 400 },
        { status: 400 }
      );
    }

    const { consentType, consentVersion } = parsed.data;

    const { data: consent, error } = await supabase
      .from("consent_records")
      .insert({
        user_id: user.id,
        consent_type: consentType,
        consent_version: consentVersion,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "同意記録の作成に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: consent, status: 201 }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
