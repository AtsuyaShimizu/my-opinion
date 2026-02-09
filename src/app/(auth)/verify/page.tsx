import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="space-y-8 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <CheckCircle className="h-8 w-8 text-primary" />
      </div>
      <div>
        <h1 className="text-xl font-bold">メール認証をお願いします</h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          ご登録いただいたメールアドレスに認証リンクを送信しました。
          <br />
          メール内のリンクをクリックして認証を完了してください。
        </p>
      </div>
      <Button variant="outline" asChild>
        <Link href="/login">ログインに戻る</Link>
      </Button>
    </div>
  );
}
