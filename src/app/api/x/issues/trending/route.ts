import { NextRequest, NextResponse } from "next/server";
import { getXBearerToken, getXIssueSeeds } from "@/lib/x/config";
import {
  ensureIssueFromSeed,
  syncIssueFromX,
  listActiveIssues,
  buildIssueInsights,
} from "@/lib/x/store";

// GET /api/x/issues/trending
// X由来の論点を取得し、必要に応じて同期して返す。
export async function GET(request: NextRequest) {
  try {
    const shouldRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") ?? "10", 10),
      20
    );

    const seeds = getXIssueSeeds();
    const issues = await Promise.all(seeds.map((seed) => ensureIssueFromSeed(seed)));

    if (shouldRefresh && getXBearerToken()) {
      await Promise.all(
        issues.map(async (issue) => {
          try {
            await syncIssueFromX({
              issueId: issue.id,
              query: issue.query,
              maxResults: 40,
            });
          } catch {
            // 個別の同期失敗は他のイシューに影響させない
          }
        })
      );
    }

    const active = await listActiveIssues(limit);

    const insightsByIssue = await Promise.all(
      active.map(async (issue) => {
        try {
          return await buildIssueInsights(issue.id);
        } catch {
          return null;
        }
      })
    );

    const merged = active.map((issue) => {
      const insight = insightsByIssue.find((item) => item?.issueId === issue.id) ?? null;
      return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        query: issue.query,
        sourceType: issue.source_type,
        postCount: issue.postCount,
        latestPostedAt: issue.latestPostedAt,
        consensusScore: insight?.consensusScore ?? 0,
        splitScore: insight?.splitScore ?? 0,
        averageStanceScore: insight?.averageStanceScore ?? null,
        sampleSize: insight?.sampleSize ?? 0,
        provenance: insight?.provenance ?? {
          refreshedAt: issue.updated_at,
          query: issue.query,
          textPolicy: "broad",
        },
      };
    });

    return NextResponse.json({
      data: {
        items: merged,
        synced: shouldRefresh,
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "Xイシューの取得に失敗しました", status: 500 },
      { status: 500 }
    );
  }
}
