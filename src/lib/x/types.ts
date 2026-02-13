import type { AttributeInference, DataProvenance, SourceType } from "@/types/database";

export type XIssueSeed = {
  title: string;
  query: string;
  description?: string;
};

export type XPublicMetrics = {
  like_count: number;
  reply_count: number;
  repost_count: number;
  quote_count: number;
  bookmark_count: number;
  impression_count: number;
};

export type XTweetAuthor = {
  id: string;
  username: string;
  name?: string;
};

export type XTweetRecord = {
  sourceType: SourceType;
  sourcePostId: string;
  authorHandle: string;
  authorDisplayName: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  postedAt: string;
  metrics: XPublicMetrics;
  stanceScore: number | null;
  inferredAttributes: AttributeInference[] | null;
  inferenceConfidence: number | null;
  dataProvenance: DataProvenance;
  rawPayload: Record<string, unknown> | null;
};

export type XSearchResult = {
  tweets: XTweetRecord[];
  nextToken: string | null;
  resultCount: number;
};

export type IssueInsights = {
  issueId: string;
  sourceType: SourceType;
  sampleSize: number;
  consensusScore: number;
  splitScore: number;
  averageStanceScore: number | null;
  stanceDistribution: number[];
  topHandles: Array<{
    handle: string;
    posts: number;
    avgStanceScore: number | null;
  }>;
  attributeSummary: Array<{
    attribute: string;
    label: string;
    distribution: Array<{ value: string; count: number; ratio: number }>;
  }>;
  provenance: {
    refreshedAt: string;
    query: string;
    textPolicy: "broad" | "link_only" | "aggregated";
  };
};
