import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getXBearerToken } from "@/lib/x/config";
import { buildIssueInsights, syncIssueFromX } from "@/lib/x/store";

// GET /api/x/issues/:issueId/insights
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const shouldRefresh = request.nextUrl.searchParams.get("refresh") === "true";

    const service = createServiceClient();
    const { data: issue } = await service
      .from("x_issues")
      .select("id,query")
      .eq("id", issueId)
      .maybeSingle();

    if (!issue) {
      return NextResponse.json(
        { error: "イシューが見つかりません", status: 404 },
        { status: 404 }
      );
    }

    if (shouldRefresh && getXBearerToken()) {
      try {
        await syncIssueFromX({
          issueId,
          query: issue.query,
          maxResults: 40,
        });
      } catch {
        // 同期失敗時も既存集計を返す
      }
    }

    const insights = await buildIssueInsights(issueId);

    return NextResponse.json({
      data: insights,
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "Xインサイトの取得に失敗しました", status: 500 },
      { status: 500 }
    );
  }
}
