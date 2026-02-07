import { z } from "zod/v4";

export const signupSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      "パスワードは英字と数字を含めてください"
    ),
  userHandle: z
    .string()
    .min(3, "ユーザーIDは3文字以上で入力してください")
    .max(20, "ユーザーIDは20文字以内で入力してください")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "ユーザーIDは英数字とアンダースコアのみ使用できます"
    ),
  displayName: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(30, "ユーザー名は30文字以内で入力してください"),
  inviteCode: z
    .string()
    .length(8, "招待コードは8文字です")
    .regex(/^[a-zA-Z0-9]+$/, "招待コードは英数字のみです"),
  agreedToTerms: z.literal(true, "利用規約への同意が必要です"),
  agreedToPrivacy: z.literal(true, "プライバシーポリシーへの同意が必要です"),
  agreedToSensitiveInfo: z.literal(
    true,
    "要配慮個人情報の取り扱いへの同意が必要です"
  ),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email: z.email("有効なメールアドレスを入力してください"),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const updatePasswordSchema = z.object({
  password: z
    .string()
    .min(8, "パスワードは8文字以上で入力してください")
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d)/,
      "パスワードは英字と数字を含めてください"
    ),
});

export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
