import { type Dispatch, type SetStateAction, useCallback } from "react";
import { apiFetch } from "@/lib/api/client";
import { toast } from "sonner";

/** Minimum interface a post item must satisfy to use this hook. */
export interface ReactablePost {
  id: string;
  reactionCount: number;
  currentUserScore: number | null;
}

/**
 * Shared reaction handler with optimistic update for post lists.
 *
 * @param setPosts - state setter for the post array
 * @param refetch  - optional callback to re-fetch data on error
 */
export function useReactionHandler<T extends ReactablePost>(
  setPosts: Dispatch<SetStateAction<T[]>>,
  refetch?: () => void | Promise<void>
) {
  const handleReaction = useCallback(
    async (postId: string, score: number) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          const hadReaction = post.currentUserScore !== null;
          return {
            ...post,
            currentUserScore: score,
            reactionCount: hadReaction
              ? post.reactionCount
              : post.reactionCount + 1,
          };
        })
      );

      try {
        await apiFetch(`/api/posts/${postId}/reactions`, {
          method: "POST",
          body: JSON.stringify({ reactionScore: score }),
        });
      } catch {
        refetch?.();
        toast.error("リアクションに失敗しました");
      }
    },
    [setPosts, refetch]
  );

  const handleReactionRemove = useCallback(
    async (postId: string) => {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id !== postId) return post;
          return {
            ...post,
            currentUserScore: null,
            reactionCount: Math.max(0, post.reactionCount - 1),
          };
        })
      );

      try {
        await apiFetch(`/api/posts/${postId}/reactions`, { method: "DELETE" });
      } catch {
        refetch?.();
        toast.error("リアクションの取り消しに失敗しました");
      }
    },
    [setPosts, refetch]
  );

  return { handleReaction, handleReactionRemove };
}
