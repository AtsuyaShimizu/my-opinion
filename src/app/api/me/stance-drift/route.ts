import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

    const { data: events, error } = await supabase
      .from("user_issue_stance_events")
      .select("issue_id, stance_score, confidence, source_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: "スタンス履歴の取得に失敗しました", status: 500 },
        { status: 500 }
      );
    }

    const issueIds = [...new Set((events ?? []).map((event) => event.issue_id))];
    const { data: issues } = issueIds.length > 0
      ? await supabase
          .from("x_issues")
          .select("id, title")
          .in("id", issueIds)
      : { data: [] as Array<{ id: string; title: string }> };

    const issueTitleMap = new Map(
      (issues ?? []).map((issue) => [issue.id, issue.title])
    );

    const grouped = new Map<
      string,
      Array<{
        score: number;
        confidence: number | null;
        sourceType: string;
        createdAt: string;
      }>
    >();

    for (const event of events ?? []) {
      const list = grouped.get(event.issue_id) ?? [];
      list.push({
        score: event.stance_score,
        confidence: event.confidence,
        sourceType: event.source_type,
        createdAt: event.created_at,
      });
      grouped.set(event.issue_id, list);
    }

    const perIssue = Array.from(grouped.entries()).map(([issueId, history]) => {
      const first = history[0];
      const last = history[history.length - 1];
      const drift = last.score - first.score;

      return {
        issueId,
        issueTitle: issueTitleMap.get(issueId) ?? "Unknown Issue",
        samples: history.length,
        firstScore: first.score,
        lastScore: last.score,
        drift,
        direction:
          drift > 0 ? "more_supportive" : drift < 0 ? "more_critical" : "stable",
        history,
      };
    });

    const totalSamples = perIssue.reduce((acc, item) => acc + item.samples, 0);
    const averageAbsDrift =
      perIssue.length > 0
        ? Math.round(
            (perIssue.reduce((acc, item) => acc + Math.abs(item.drift), 0) /
              perIssue.length) *
              10
          ) / 10
        : 0;

    return NextResponse.json({
      data: {
        summary: {
          issueCount: perIssue.length,
          totalSamples,
          averageAbsDrift,
          generatedAt: new Date().toISOString(),
        },
        items: perIssue,
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "スタンスドリフトの取得に失敗しました", status: 500 },
      { status: 500 }
    );
  }
}
