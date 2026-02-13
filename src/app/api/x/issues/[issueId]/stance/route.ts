import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function toInt(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value)) return null;
  return value;
}

// GET /api/x/issues/:issueId/stance
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
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

    const [{ data: stance }, { data: history }] = await Promise.all([
      supabase
        .from("user_issue_stances")
        .select("*")
        .eq("user_id", user.id)
        .eq("issue_id", issueId)
        .maybeSingle(),
      supabase
        .from("user_issue_stance_events")
        .select("stance_score, confidence, source_type, created_at")
        .eq("user_id", user.id)
        .eq("issue_id", issueId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    return NextResponse.json({
      data: {
        current: stance,
        history: history ?? [],
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "スタンスの取得に失敗しました", status: 500 },
      { status: 500 }
    );
  }
}

// POST /api/x/issues/:issueId/stance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
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
    const stanceScore = toInt(body.stanceScore);
    const confidence = body.confidence == null ? null : toInt(body.confidence);
    const note = typeof body.note === "string" ? body.note.trim() : null;

    if (stanceScore === null || stanceScore < 0 || stanceScore > 100) {
      return NextResponse.json(
        { error: "stanceScore は0-100の整数で指定してください", status: 400 },
        { status: 400 }
      );
    }

    if (confidence !== null && (confidence < 0 || confidence > 100)) {
      return NextResponse.json(
        { error: "confidence は0-100の整数で指定してください", status: 400 },
        { status: 400 }
      );
    }

    const { data: issue } = await supabase
      .from("x_issues")
      .select("id")
      .eq("id", issueId)
      .maybeSingle();

    if (!issue) {
      return NextResponse.json(
        { error: "イシューが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    const { error: upsertError } = await supabase
      .from("user_issue_stances")
      .upsert(
        {
          user_id: user.id,
          issue_id: issueId,
          stance_score: stanceScore,
          confidence,
          note,
          source_type: "internal",
          updated_at: now,
        },
        { onConflict: "user_id,issue_id" }
      );

    if (upsertError) {
      return NextResponse.json(
        { error: "スタンスの保存に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const { error: historyError } = await supabase
      .from("user_issue_stance_events")
      .insert({
        user_id: user.id,
        issue_id: issueId,
        stance_score: stanceScore,
        confidence,
        source_type: "internal",
      });

    if (historyError) {
      return NextResponse.json(
        { error: "スタンス履歴の保存に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        issueId,
        stanceScore,
        confidence,
        updatedAt: now,
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "スタンスの更新に失敗しました", status: 500 },
      { status: 500 }
    );
  }
}
