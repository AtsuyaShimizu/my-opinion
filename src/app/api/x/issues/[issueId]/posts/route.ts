import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getXBearerToken, getXTextPolicy } from "@/lib/x/config";
import { getIssuePosts, syncIssueFromX } from "@/lib/x/store";
import type { XIssuePost } from "@/types/database";

function mapForPolicy(item: XIssuePost, textPolicy: "broad" | "link_only" | "aggregated") {
  const textVisible = textPolicy === "broad";
  return {
    id: item.id,
    sourcePostId: item.source_post_id,
    sourceType: item.source_type,
    author: {
      handle: item.author_handle,
      displayName: item.author_display_name,
    },
    content: textVisible ? item.content : null,
    url: item.url,
    postedAt: item.posted_at,
    language: item.language,
    metrics: {
      likeCount: item.like_count,
      replyCount: item.reply_count,
      repostCount: item.repost_count,
      quoteCount: item.quote_count,
      bookmarkCount: item.bookmark_count,
      viewCount: item.view_count,
    },
    stanceScore: item.stance_score,
    inferredAttributes: item.inferred_attributes,
    inferenceConfidence: item.inference_confidence,
    provenance: item.data_provenance,
    policy: {
      textPolicy,
      attributionRequired: true,
      externalLinkRequired: true,
    },
  };
}

// GET /api/x/issues/:issueId/posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ issueId: string }> }
) {
  try {
    const { issueId } = await params;
    const limit = Math.min(
      parseInt(request.nextUrl.searchParams.get("limit") ?? "20", 10),
      50
    );
    const cursor = request.nextUrl.searchParams.get("cursor");
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
          maxResults: 30,
        });
      } catch {
        // 同期失敗時もキャッシュは返す
      }
    }

    const page = await getIssuePosts({ issueId, limit, cursor });
    const textPolicy = getXTextPolicy();

    return NextResponse.json({
      data: {
        items: page.items.map((item) => mapForPolicy(item, textPolicy)),
        nextCursor: page.nextCursor,
        hasMore: page.hasMore,
        textPolicy,
      },
      status: 200,
    });
  } catch {
    return NextResponse.json(
      { error: "X投稿の取得に失敗しました", status: 500 },
      { status: 500 }
    );
  }
}
