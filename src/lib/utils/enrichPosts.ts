import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createServiceClient } from "@/lib/supabase/service";
import { extractPublicAttributes } from "./attributes";
import { aggregateReactionStats, computeAverageScore } from "./reactions";

type DbPost = Database["public"]["Tables"]["posts"]["Row"];

/**
 * Enrich raw post rows with author info, public attributes, and reaction stats.
 * Shared across timeline/home, timeline/explore, timeline/theme, and posts/[id]/replies.
 */
export async function enrichPostsWithAuthorAndReactions(
  supabase: SupabaseClient<Database>,
  posts: DbPost[],
  currentUserId: string | null
) {
  if (posts.length === 0) return [];

  const userIds = [...new Set(posts.map((p) => p.user_id))];
  const postIds = posts.map((p) => p.id);

  // user_attributes SELECT is restricted by RLS (auth.uid() = user_id).
  // Use service client to fetch other users' attributes.
  const serviceClient = createServiceClient();
  const [usersResult, attributesResult, reactionsResult] = await Promise.all([
    supabase
      .from("users")
      .select("id, user_handle, display_name, avatar_url")
      .in("id", userIds),
    serviceClient
      .from("user_attributes")
      .select("*")
      .in("user_id", userIds),
    supabase
      .from("reactions")
      .select("post_id, reaction_score")
      .in("post_id", postIds),
  ]);

  const userMap = new Map(usersResult.data?.map((u) => [u.id, u]) ?? []);
  const attrMap = new Map(attributesResult.data?.map((a) => [a.user_id, a]) ?? []);
  const reactionStats = aggregateReactionStats(reactionsResult.data ?? []);

  let userReactionMap = new Map<string, number>();
  if (currentUserId) {
    const { data: userReactions } = await supabase
      .from("reactions")
      .select("post_id, reaction_score")
      .eq("user_id", currentUserId)
      .in("post_id", postIds);
    userReactionMap = new Map(
      userReactions?.map((r) => [r.post_id, r.reaction_score]) ?? []
    );
  }

  return posts.map((post) => {
    const author = userMap.get(post.user_id);
    const attrs = attrMap.get(post.user_id);
    const stats = reactionStats.get(post.id);

    return {
      ...post,
      author: author ? { ...author, attributes: extractPublicAttributes(attrs) } : null,
      reactionCount: stats?.count ?? 0,
      averageScore: computeAverageScore(stats),
      currentUserScore: userReactionMap.get(post.id) ?? null,
    };
  });
}
