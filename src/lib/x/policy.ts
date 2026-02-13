import type { DataProvenance } from "@/types/database";

export function sanitizeExternalText(text: string | null | undefined): string | null {
  if (!text) return null;
  // 改行を抑え、過度に長い本文を切り詰める。
  const normalized = text.replace(/\s+/g, " ").trim();
  return normalized.length <= 280 ? normalized : `${normalized.slice(0, 277)}...`;
}

export function buildDataProvenance(params: {
  fetchedAt: string;
  query: string;
  confidence?: number;
  textVisible: boolean;
}): DataProvenance {
  return {
    source: "x",
    fetched_at: params.fetchedAt,
    query: params.query,
    confidence: params.confidence,
    policy_flags: {
      text_visible: params.textVisible,
      attribution_required: true,
      external_link_required: true,
    },
  };
}
