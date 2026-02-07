import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function VerifyPage() {
  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
      <div>
        <h1 className="text-2xl font-bold">メール認証をお願いします</h1>
        <p className="mt-2 text-sm text-muted-foreground">
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
