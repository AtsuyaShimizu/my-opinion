import { createServiceClient } from "@/lib/supabase/service";
import { searchRecentTweets } from "@/lib/x/client";
import type { IssueInsights, XIssueSeed, XTweetRecord } from "@/lib/x/types";
import type { AttributeInference, XIssue, XIssuePost } from "@/types/database";
import { getXTextPolicy } from "@/lib/x/config";

export async function ensureIssueFromSeed(seed: XIssueSeed): Promise<XIssue> {
  const service = createServiceClient();

  const { data: existing } = await service
    .from("x_issues")
    .select("*")
    .eq("source_type", "x")
    .eq("query", seed.query)
    .maybeSingle();

  if (existing) {
    if (existing.title !== seed.title || existing.description !== (seed.description ?? null)) {
      const { data: updated } = await service
        .from("x_issues")
        .update({
          title: seed.title,
          description: seed.description ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("*")
        .single();
      return (updated ?? existing) as XIssue;
    }
    return existing as XIssue;
  }

  const { data: inserted, error } = await service
    .from("x_issues")
    .insert({
      source_type: "x",
      title: seed.title,
      description: seed.description ?? null,
      query: seed.query,
      source_metadata: {
        seed: true,
      },
      is_active: true,
    })
    .select("*")
    .single();

  if (error || !inserted) {
    throw new Error("failed to create x issue seed");
  }

  return inserted as XIssue;
}

function toInsertPost(issueId: string, item: XTweetRecord) {
  return {
    issue_id: issueId,
    source_type: item.sourceType,
    source_post_id: item.sourcePostId,
    author_handle: item.authorHandle,
    author_display_name: item.authorDisplayName,
    content: item.content,
    url: item.url,
    language: item.language,
    posted_at: item.postedAt,
    like_count: item.metrics.like_count,
    reply_count: item.metrics.reply_count,
    repost_count: item.metrics.repost_count,
    quote_count: item.metrics.quote_count,
    bookmark_count: item.metrics.bookmark_count,
    view_count: item.metrics.impression_count,
    stance_score: item.stanceScore,
    inferred_attributes: item.inferredAttributes,
    inference_confidence: item.inferenceConfidence,
    data_provenance: item.dataProvenance,
    raw_payload: item.rawPayload,
    fetched_at: item.dataProvenance.fetched_at,
  };
}

export async function syncIssueFromX(params: {
  issueId: string;
  query: string;
  maxResults?: number;
}): Promise<{ fetched: number; inserted: number }> {
  const service = createServiceClient();
  const result = await searchRecentTweets({
    query: params.query,
    maxResults: params.maxResults ?? 30,
  });

  if (result.tweets.length === 0) {
    return { fetched: 0, inserted: 0 };
  }

  const inserts = result.tweets.map((tweet) => toInsertPost(params.issueId, tweet));

  const { error } = await service.from("x_issue_posts").upsert(inserts, {
    onConflict: "source_type,source_post_id",
    ignoreDuplicates: false,
  });

  if (error) {
    throw new Error(`failed to upsert x issue posts: ${error.message}`);
  }

  await service
    .from("x_issues")
    .update({
      updated_at: new Date().toISOString(),
      source_metadata: {
        last_sync: new Date().toISOString(),
        result_count: result.resultCount,
        next_token: result.nextToken,
      },
    })
    .eq("id", params.issueId);

  return {
    fetched: result.resultCount,
    inserted: inserts.length,
  };
}

export async function listActiveIssues(limit = 20): Promise<Array<XIssue & {
  postCount: number;
  latestPostedAt: string | null;
}>> {
  const service = createServiceClient();

  const { data: issues } = await service
    .from("x_issues")
    .select("*")
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  const issueRows = (issues ?? []) as XIssue[];
  if (issueRows.length === 0) return [];

  const issueIds = issueRows.map((issue) => issue.id);

  const { data: posts } = await service
    .from("x_issue_posts")
    .select("issue_id, posted_at")
    .in("issue_id", issueIds)
    .order("posted_at", { ascending: false });

  const stats = new Map<string, { count: number; latest: string | null }>();
  for (const issueId of issueIds) {
    stats.set(issueId, { count: 0, latest: null });
  }

  for (const post of posts ?? []) {
    const current = stats.get(post.issue_id) ?? { count: 0, latest: null };
    current.count += 1;
    if (!current.latest || post.posted_at > current.latest) {
      current.latest = post.posted_at;
    }
    stats.set(post.issue_id, current);
  }

  return issueRows.map((issue) => ({
    ...issue,
    postCount: stats.get(issue.id)?.count ?? 0,
    latestPostedAt: stats.get(issue.id)?.latest ?? null,
  }));
}

export async function getIssuePosts(params: {
  issueId: string;
  limit: number;
  cursor?: string | null;
}): Promise<{ items: XIssuePost[]; nextCursor: string | null; hasMore: boolean }> {
  const service = createServiceClient();

  let query = service
    .from("x_issue_posts")
    .select("*")
    .eq("issue_id", params.issueId)
    .order("posted_at", { ascending: false })
    .limit(params.limit + 1);

  if (params.cursor) {
    query = query.lt("posted_at", params.cursor);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`failed to fetch issue posts: ${error.message}`);
  }

  const rows = ((data ?? []) as XIssuePost[]);
  const hasMore = rows.length > params.limit;
  const items = hasMore ? rows.slice(0, params.limit) : rows;
  const nextCursor = hasMore ? items[items.length - 1]?.posted_at ?? null : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

function computeConsensusScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const mean = scores.reduce((acc, cur) => acc + cur, 0) / scores.length;
  const variance =
    scores.reduce((acc, cur) => acc + (cur - mean) * (cur - mean), 0) /
    scores.length;
  const stdDev = Math.sqrt(variance);
  return Math.max(0, Math.min(100, Math.round(100 - stdDev * 2)));
}

function computeSplitScore(scores: number[]): number {
  if (scores.length === 0) return 0;
  const low = scores.filter((score) => score < 34).length;
  const high = scores.filter((score) => score > 66).length;
  const polarized = low + high;
  return Math.round((polarized / scores.length) * 100);
}

function buildStanceDistribution(scores: number[]): number[] {
  const bins = new Array<number>(10).fill(0);
  for (const score of scores) {
    const bin = score >= 100 ? 9 : Math.floor(score / 10);
    bins[bin] += 1;
  }
  return bins;
}

function summarizeAttributes(posts: XIssuePost[]): IssueInsights["attributeSummary"] {
  const counters = new Map<string, Map<string, number>>();

  for (const post of posts) {
    const inferred = post.inferred_attributes as AttributeInference[] | null;
    if (!inferred) continue;

    for (const item of inferred) {
      const key = item.method;
      const label = item.inferred_label;
      const bucket = counters.get(key) ?? new Map<string, number>();
      bucket.set(label, (bucket.get(label) ?? 0) + 1);
      counters.set(key, bucket);
    }
  }

  return Array.from(counters.entries()).map(([attribute, valueMap]) => {
    const total = Array.from(valueMap.values()).reduce((acc, cur) => acc + cur, 0);
    const distribution = Array.from(valueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([value, count]) => ({
        value,
        count,
        ratio: total > 0 ? Math.round((count / total) * 100) / 100 : 0,
      }));

    return {
      attribute,
      label: attribute,
      distribution,
    };
  });
}

export async function buildIssueInsights(issueId: string): Promise<IssueInsights> {
  const service = createServiceClient();

  const [{ data: issue }, { data: posts }] = await Promise.all([
    service.from("x_issues").select("*").eq("id", issueId).single(),
    service.from("x_issue_posts").select("*").eq("issue_id", issueId),
  ]);

  if (!issue) {
    throw new Error("issue not found");
  }

  const rows = (posts ?? []) as XIssuePost[];
  const stanceScores = rows
    .map((post) => post.stance_score)
    .filter((score): score is number => typeof score === "number");

  const avg = stanceScores.length > 0
    ? Math.round(stanceScores.reduce((acc, score) => acc + score, 0) / stanceScores.length)
    : null;

  const handleStats = new Map<string, { count: number; sum: number; scoreCount: number }>();
  for (const post of rows) {
    const bucket = handleStats.get(post.author_handle) ?? {
      count: 0,
      sum: 0,
      scoreCount: 0,
    };
    bucket.count += 1;
    if (typeof post.stance_score === "number") {
      bucket.sum += post.stance_score;
      bucket.scoreCount += 1;
    }
    handleStats.set(post.author_handle, bucket);
  }

  const topHandles = Array.from(handleStats.entries())
    .map(([handle, stats]) => ({
      handle,
      posts: stats.count,
      avgStanceScore:
        stats.scoreCount > 0 ? Math.round(stats.sum / stats.scoreCount) : null,
    }))
    .sort((a, b) => b.posts - a.posts)
    .slice(0, 8);

  return {
    issueId,
    sourceType: issue.source_type,
    sampleSize: rows.length,
    consensusScore: computeConsensusScore(stanceScores),
    splitScore: computeSplitScore(stanceScores),
    averageStanceScore: avg,
    stanceDistribution: buildStanceDistribution(stanceScores),
    topHandles,
    attributeSummary: summarizeAttributes(rows),
    provenance: {
      refreshedAt: issue.updated_at,
      query: issue.query,
      textPolicy: getXTextPolicy(),
    },
  };
}
