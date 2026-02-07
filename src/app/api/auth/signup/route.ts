import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, status: 400 },
        { status: 400 }
      );
    }

    const {
      email,
      password,
      userHandle,
      displayName,
      inviteCode,
    } = parsed.data;

    const supabase = await createClient();

    // 1. Validate invite code
    const { data: invite, error: inviteError } = await supabase
      .from("invite_codes")
      .select("*")
      .eq("code", inviteCode)
      .is("used_by", null)
      .gt("expires_at", new Date().toISOString())
      .single();

    if (inviteError || !invite) {
      return NextResponse.json(
        { error: "招待コードが無効または期限切れです", status: 400 },
        { status: 400 }
      );
    }

    // 2. Check if user_handle is already taken
    const { data: existingHandle } = await supabase
      .from("users")
      .select("id")
      .eq("user_handle", userHandle)
      .single();

    if (existingHandle) {
      return NextResponse.json(
        { error: "このユーザーIDは既に使用されています", status: 409 },
        { status: 409 }
      );
    }

    // 3. Sign up with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          user_handle: userHandle,
          display_name: displayName,
        },
      },
    });

    if (authError) {
      if (authError.message.includes("already registered")) {
        return NextResponse.json(
          { error: "このメールアドレスは既に登録されています", status: 409 },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: authError.message, status: 400 },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: "ユーザー登録に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    // 4. Create user record in users table
    // TODO: Auth作成後にusersテーブルINSERTが失敗した場合、Authユーザーが残る。
    // 将来的にはトランザクション的なロールバック処理（auth.admin.deleteUser）を検討。
    const { error: userError } = await supabase.from("users").insert({
      id: authData.user.id,
      email,
      user_handle: userHandle,
      display_name: displayName,
    });

    if (userError) {
      return NextResponse.json(
        { error: "ユーザー情報の保存に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    // 5. Create user_attributes record (empty defaults)
    await supabase.from("user_attributes").insert({
      user_id: authData.user.id,
    });

    // 6. Record consent (terms, privacy, sensitive info)
    const consentVersion = "1.0";
    await supabase.from("consent_records").insert([
      {
        user_id: authData.user.id,
        consent_type: "terms_of_service",
        consent_version: consentVersion,
      },
      {
        user_id: authData.user.id,
        consent_type: "privacy_policy",
        consent_version: consentVersion,
      },
      {
        user_id: authData.user.id,
        consent_type: "sensitive_personal_info",
        consent_version: consentVersion,
      },
    ]);

    // 7. Mark invite code as used
    await supabase
      .from("invite_codes")
      .update({
        used_by: authData.user.id,
        used_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    return NextResponse.json(
      {
        data: {
          user: {
            id: authData.user.id,
            email,
            userHandle,
            displayName,
          },
        },
        status: 201,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
