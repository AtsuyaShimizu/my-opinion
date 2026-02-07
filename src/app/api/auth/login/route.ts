import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message, status: 400 },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: "メールアドレスまたはパスワードが正しくありません", status: 401 },
        { status: 401 }
      );
    }

    // Check user status
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (user?.status === "suspended") {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "アカウントが一時停止されています", status: 403 },
        { status: 403 }
      );
    }

    if (user?.status === "banned") {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "アカウントが凍結されています", status: 403 },
        { status: 403 }
      );
    }

    if (user?.status === "withdrawn") {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "退会済みのアカウントです", status: 403 },
        { status: 403 }
      );
    }

    return NextResponse.json({
      data: {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "サーバーエラーが発生しました", status: 500 },
      { status: 500 }
    );
  }
}
