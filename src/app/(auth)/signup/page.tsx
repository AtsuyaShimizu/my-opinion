"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      agreedToTerms: false as unknown as true,
      agreedToPrivacy: false as unknown as true,
      agreedToSensitiveInfo: false as unknown as true,
    },
  });

  const agreedToTerms = useWatch({ control, name: "agreedToTerms" });
  const agreedToPrivacy = useWatch({ control, name: "agreedToPrivacy" });
  const agreedToSensitiveInfo = useWatch({ control, name: "agreedToSensitiveInfo" });

  async function onSubmit(data: SignupInput) {
    setError(null);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || "登録に失敗しました");
        return;
      }

      if (result.data?.emailConfirmationRequired) {
        router.push("/verify");
      } else {
        router.push("/home");
      }
    } catch {
      setError("サーバーエラーが発生しました");
    }
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-xl font-bold tracking-tight text-primary">My Opinion</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          新しいアカウントを作成
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">メールアドレス</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">パスワード</Label>
          <Input
            id="password"
            type="password"
            placeholder="8文字以上、英数字混合"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="userHandle">ユーザーID</Label>
          <Input
            id="userHandle"
            placeholder="英数字・アンダースコア（3〜20文字）"
            {...register("userHandle")}
          />
          {errors.userHandle && (
            <p className="text-xs text-destructive">
              {errors.userHandle.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            変更できません。慎重に設定してください。
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="displayName">ユーザー名（表示名）</Label>
          <Input
            id="displayName"
            placeholder="1〜30文字"
            {...register("displayName")}
          />
          {errors.displayName && (
            <p className="text-xs text-destructive">
              {errors.displayName.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="inviteCode">招待コード</Label>
          <Input
            id="inviteCode"
            placeholder="8文字の英数字"
            {...register("inviteCode")}
          />
          {errors.inviteCode && (
            <p className="text-xs text-destructive">
              {errors.inviteCode.message}
            </p>
          )}
        </div>

        <div className="space-y-3 rounded-md border p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="agreedToTerms"
              checked={agreedToTerms === true}
              onCheckedChange={(checked) =>
                setValue("agreedToTerms", checked === true ? true : (false as unknown as true), {
                  shouldValidate: true,
                })
              }
            />
            <Label htmlFor="agreedToTerms" className="text-sm leading-relaxed">
              <Link
                href="/terms"
                className="text-primary hover:underline"
                target="_blank"
              >
                利用規約
              </Link>
              に同意します
            </Label>
          </div>
          {errors.agreedToTerms && (
            <p className="text-xs text-destructive">
              {errors.agreedToTerms.message}
            </p>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="agreedToPrivacy"
              checked={agreedToPrivacy === true}
              onCheckedChange={(checked) =>
                setValue("agreedToPrivacy", checked === true ? true : (false as unknown as true), {
                  shouldValidate: true,
                })
              }
            />
            <Label
              htmlFor="agreedToPrivacy"
              className="text-sm leading-relaxed"
            >
              <Link
                href="/privacy"
                className="text-primary hover:underline"
                target="_blank"
              >
                プライバシーポリシー
              </Link>
              に同意します
            </Label>
          </div>
          {errors.agreedToPrivacy && (
            <p className="text-xs text-destructive">
              {errors.agreedToPrivacy.message}
            </p>
          )}

          <div className="flex items-start gap-3">
            <Checkbox
              id="agreedToSensitiveInfo"
              checked={agreedToSensitiveInfo === true}
              onCheckedChange={(checked) =>
                setValue(
                  "agreedToSensitiveInfo",
                  checked === true ? true : (false as unknown as true),
                  { shouldValidate: true }
                )
              }
            />
            <Label
              htmlFor="agreedToSensitiveInfo"
              className="text-sm leading-relaxed"
            >
              要配慮個人情報（政治スタンス等）の取り扱いに同意します
            </Label>
          </div>
          {errors.agreedToSensitiveInfo && (
            <p className="text-xs text-destructive">
              {errors.agreedToSensitiveInfo.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          アカウントを作成
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        すでにアカウントをお持ちの方は{" "}
        <Link href="/login" className="text-primary hover:underline">
          ログイン
        </Link>
      </p>
    </div>
  );
}
