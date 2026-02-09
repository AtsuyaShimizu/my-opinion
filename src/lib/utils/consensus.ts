import type { ReactorAttributeSnapshot } from "@/types/database";

type AttributeKey = keyof ReactorAttributeSnapshot;

const ATTRIBUTE_KEYS: AttributeKey[] = [
  "gender",
  "age_range",
  "education",
  "occupation",
  "political_party",
  "political_stance",
];

const ATTRIBUTE_KEY_LABELS: Record<AttributeKey, string> = {
  gender: "性別",
  age_range: "年齢帯",
  education: "学歴",
  occupation: "職業",
  political_party: "支持政党",
  political_stance: "政治スタンス",
};

/**
 * Calculate consensus score for a set of reactions (score-based).
 * Based on standard deviation of reaction scores.
 * Score 0 = completely split, Score 100 = full agreement.
 * Formula: max(0, 100 - standardDeviation * 3)
 */
export function calculateConsensusScore(
  reactions: { reaction_score: number }[]
): number {
  if (reactions.length === 0) return 0;
  const scores = reactions.map((r) => r.reaction_score);
  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const variance = scores.reduce((acc, s) => acc + (s - mean) ** 2, 0) / scores.length;
  const stdDev = Math.sqrt(variance);
  return Math.round(Math.max(0, 100 - stdDev * 3));
}

export interface AttributeBreakdown {
  attribute: string;
  label: string;
  score: number;
}

/**
 * Calculate per-attribute consensus breakdown (score-based).
 * For each attribute, groups reactions by attribute value and computes
 * how much the average scores diverge across groups.
 */
export function calculateAttributeBreakdown(
  reactions: {
    reaction_score: number;
    reactor_attribute_snapshot: ReactorAttributeSnapshot | null;
  }[]
): AttributeBreakdown[] {
  const breakdown: AttributeBreakdown[] = [];

  for (const key of ATTRIBUTE_KEYS) {
    // Group reactions by attribute value
    const groups = new Map<string, number[]>();

    for (const r of reactions) {
      const snapshot = r.reactor_attribute_snapshot;
      if (!snapshot) continue;
      const value = snapshot[key];
      if (value == null) continue;
      const strValue = String(value);
      const arr = groups.get(strValue) ?? [];
      arr.push(r.reaction_score);
      groups.set(strValue, arr);
    }

    if (groups.size < 2) continue; // Need at least 2 groups to be meaningful

    // For each group, compute its average score
    const groupAverages: number[] = [];
    for (const [, scores] of groups) {
      if (scores.length < 3) continue; // Skip small groups
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      groupAverages.push(avg);
    }

    if (groupAverages.length < 2) continue;

    // Consensus = how similar the group averages are
    // If all groups have similar averages => high consensus across attributes
    // If groups diverge => low consensus
    const mean = groupAverages.reduce((a, b) => a + b, 0) / groupAverages.length;
    const variance =
      groupAverages.reduce((acc, a) => acc + (a - mean) ** 2, 0) /
      groupAverages.length;
    // Max possible variance for averages in [0,100] is 2500 (half at 0, half at 100)
    const score = Math.round(Math.max(0, (1 - variance / 2500)) * 100);

    breakdown.push({
      attribute: key,
      label: ATTRIBUTE_KEY_LABELS[key],
      score,
    });
  }

  return breakdown;
}

export { ATTRIBUTE_KEYS, ATTRIBUTE_KEY_LABELS };
export type { AttributeKey };
