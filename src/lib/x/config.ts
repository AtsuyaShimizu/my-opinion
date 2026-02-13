import type { XIssueSeed } from "@/lib/x/types";

const DEFAULT_ISSUE_SEEDS: XIssueSeed[] = [
  {
    title: "消費税・物価対策",
    query: '(消費税 OR 物価高 OR 減税) lang:ja -is:retweet',
    description: "消費税や生活コストに関する議論",
  },
  {
    title: "エネルギー・原発",
    query: '(原発 OR 再エネ OR 電気料金) lang:ja -is:retweet',
    description: "電力政策やエネルギー選択に関する議論",
  },
  {
    title: "育児・少子化",
    query: '(少子化 OR 子育て支援 OR 保育園) lang:ja -is:retweet',
    description: "少子化対策・育児支援の議論",
  },
];

export function getXApiBaseUrl(): string {
  return process.env.X_API_BASE_URL?.trim() || "https://api.x.com/2";
}

export function getXBearerToken(): string | null {
  const token = process.env.X_API_BEARER_TOKEN?.trim();
  return token && token.length > 0 ? token : null;
}

export function getXTextPolicy(): "broad" | "link_only" | "aggregated" {
  const raw = process.env.X_TEXT_POLICY?.trim();
  if (raw === "link_only" || raw === "aggregated" || raw === "broad") {
    return raw;
  }
  return "broad";
}

export function getXIssueSeeds(): XIssueSeed[] {
  const raw = process.env.X_ISSUE_SEEDS_JSON?.trim();
  if (!raw) return DEFAULT_ISSUE_SEEDS;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return DEFAULT_ISSUE_SEEDS;

    const seeds = parsed
      .map((item): XIssueSeed | null => {
        if (
          typeof item === "object" &&
          item !== null &&
          typeof (item as Record<string, unknown>).title === "string" &&
          typeof (item as Record<string, unknown>).query === "string"
        ) {
          const obj = item as Record<string, unknown>;
          return {
            title: obj.title as string,
            query: obj.query as string,
            description:
              typeof obj.description === "string" ? obj.description : undefined,
          };
        }
        return null;
      })
      .filter((seed): seed is XIssueSeed => seed !== null);

    return seeds.length > 0 ? seeds : DEFAULT_ISSUE_SEEDS;
  } catch {
    return DEFAULT_ISSUE_SEEDS;
  }
}
