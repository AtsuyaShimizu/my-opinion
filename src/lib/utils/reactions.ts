export type ReactionStats = {
  count: number;
  totalScore: number;
};

/**
 * Aggregate reaction scores into per-post stats.
 */
export function aggregateReactionStats(
  reactions: { post_id: string; reaction_score: number }[]
): Map<string, ReactionStats> {
  const stats = new Map<string, ReactionStats>();
  for (const r of reactions) {
    const s = stats.get(r.post_id) ?? { count: 0, totalScore: 0 };
    s.count++;
    s.totalScore += r.reaction_score;
    stats.set(r.post_id, s);
  }
  return stats;
}

/**
 * Compute the average score from aggregated stats.
 * Returns null if there are no reactions.
 */
export function computeAverageScore(
  stats: ReactionStats | undefined
): number | null {
  if (!stats || stats.count === 0) return null;
  return Math.round(stats.totalScore / stats.count);
}
