import { getXApiBaseUrl, getXBearerToken } from "@/lib/x/config";
import type { XSearchResult, XTweetAuthor } from "@/lib/x/types";
import { inferAttributesFromText, inferStanceScoreFromText } from "@/lib/x/inference";
import { buildDataProvenance, sanitizeExternalText } from "@/lib/x/policy";

type XApiTweet = {
  id: string;
  text?: string;
  lang?: string;
  created_at?: string;
  author_id?: string;
  public_metrics?: {
    like_count?: number;
    reply_count?: number;
    retweet_count?: number;
    quote_count?: number;
    bookmark_count?: number;
    impression_count?: number;
  };
};

type XApiResponse = {
  data?: XApiTweet[];
  includes?: {
    users?: Array<{
      id: string;
      username: string;
      name?: string;
    }>;
  };
  meta?: {
    next_token?: string;
    result_count?: number;
  };
};

function buildAuthorMap(includes: XApiResponse["includes"]): Map<string, XTweetAuthor> {
  const map = new Map<string, XTweetAuthor>();
  for (const user of includes?.users ?? []) {
    map.set(user.id, {
      id: user.id,
      username: user.username,
      name: user.name,
    });
  }
  return map;
}

export async function searchRecentTweets(params: {
  query: string;
  maxResults?: number;
  nextToken?: string;
}): Promise<XSearchResult> {
  const token = getXBearerToken();
  if (!token) {
    throw new Error("X API token is not configured");
  }

  const baseUrl = getXApiBaseUrl();
  const maxResults = Math.max(10, Math.min(params.maxResults ?? 25, 100));

  const url = new URL(`${baseUrl}/tweets/search/recent`);
  url.searchParams.set("query", params.query);
  url.searchParams.set("max_results", String(maxResults));
  url.searchParams.set(
    "tweet.fields",
    "author_id,created_at,lang,public_metrics"
  );
  url.searchParams.set("expansions", "author_id");
  url.searchParams.set("user.fields", "username,name");
  if (params.nextToken) {
    url.searchParams.set("next_token", params.nextToken);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`X API request failed: ${res.status}`);
    }

    const body = (await res.json()) as XApiResponse;
    const authorMap = buildAuthorMap(body.includes);
    const fetchedAt = new Date().toISOString();

    const tweets = (body.data ?? []).map((tweet) => {
      const author = tweet.author_id ? authorMap.get(tweet.author_id) : undefined;
      const content = sanitizeExternalText(tweet.text ?? null);
      const stanceScore = content ? inferStanceScoreFromText(content) : null;
      const inferred = content ? inferAttributesFromText(content) : { inferred: null, confidence: null };

      return {
        sourceType: "x" as const,
        sourcePostId: tweet.id,
        authorHandle: author?.username ?? "unknown",
        authorDisplayName: author?.name ?? null,
        content,
        url: author?.username
          ? `https://x.com/${author.username}/status/${tweet.id}`
          : null,
        language: tweet.lang ?? null,
        postedAt: tweet.created_at ?? fetchedAt,
        metrics: {
          like_count: tweet.public_metrics?.like_count ?? 0,
          reply_count: tweet.public_metrics?.reply_count ?? 0,
          repost_count: tweet.public_metrics?.retweet_count ?? 0,
          quote_count: tweet.public_metrics?.quote_count ?? 0,
          bookmark_count: tweet.public_metrics?.bookmark_count ?? 0,
          impression_count: tweet.public_metrics?.impression_count ?? 0,
        },
        stanceScore,
        inferredAttributes: inferred.inferred,
        inferenceConfidence: inferred.confidence,
        dataProvenance: buildDataProvenance({
          fetchedAt,
          query: params.query,
          confidence: inferred.confidence ?? undefined,
          textVisible: true,
        }),
        rawPayload: tweet as unknown as Record<string, unknown>,
      };
    });

    return {
      tweets,
      nextToken: body.meta?.next_token ?? null,
      resultCount: body.meta?.result_count ?? tweets.length,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
