import { z } from "zod/v4";

export const createPostSchema = z.object({
  title: z
    .string()
    .max(60, "タイトルは60文字以内で入力してください")
    .transform(v => v.trim() || undefined)
    .optional(),
  content: z
    .string()
    .min(1, "投稿内容を入力してください")
    .max(200, "投稿は200文字以内で入力してください"),
  themeId: z.string().uuid().optional(),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;

export const replySchema = z.object({
  content: z
    .string()
    .min(1, "返信内容を入力してください")
    .max(200, "返信は200文字以内で入力してください"),
});

export type ReplyInput = z.infer<typeof replySchema>;
