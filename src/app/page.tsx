import Link from "next/link";
import {
  BarChart3,
  Eye,
  MessageSquare,
  Shield,
  Users,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Eye,
    title: "属性を開示して議論",
    description:
      "性別・年齢・職業・政治スタンスなどを明示し、「誰が・どの立場から」発言しているかが分かる議論空間。",
  },
  {
    icon: BarChart3,
    title: "反応を分析・可視化",
    description:
      "あなたの投稿に対する反応を属性別に分析。どの層に支持され、どの層と意見が異なるかを把握できます。",
  },
  {
    icon: Users,
    title: "エコーチェンバーを可視化",
    description:
      "自分のフォロー構成の偏りをスコア化。無自覚な情報の偏りに気づくきっかけを提供します。",
  },
  {
    icon: MessageSquare,
    title: "テーマ別の討論",
    description:
      "時事トピックに対してテーマ別に議論。多様な属性を持つユーザーの意見を一覧できます。",
  },
  {
    icon: Shield,
    title: "安全な議論空間",
    description:
      "招待制によるコミュニティ品質管理と、段階的なモデレーションで健全な議論をサポート。",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <span className="text-xl font-bold text-primary">My Opinion</span>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/login">ログイン</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">新規登録</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 py-20 text-center lg:py-32">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-bold tracking-tight lg:text-5xl">
            属性を開示して、
            <br />
            <span className="text-primary">本質的な議論</span>を。
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            エコーチェンバーに閉じた社会を変える。属性の可視化と反応の分析で、自分の立ち位置を理解し、多様な視点と出会えるSNS。
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" className="gap-2" asChild>
              <Link href="/signup">
                無料で始める
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/login">ログイン</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t bg-muted/30 px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-2xl font-bold lg:text-3xl">
            My Opinion の特徴
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="rounded-lg border bg-card p-6"
              >
                <feature.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 text-lg font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-20 text-center">
        <div className="mx-auto max-w-2xl">
          <h2 className="text-2xl font-bold lg:text-3xl">
            エコーチェンバーから抜け出そう
          </h2>
          <p className="mt-4 text-muted-foreground">
            招待制のため、招待コードをお持ちの方のみ登録できます。
          </p>
          <Button size="lg" className="mt-8 gap-2" asChild>
            <Link href="/signup">
              招待コードで登録する
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:justify-between">
          <span>My Opinion</span>
          <div className="flex gap-6">
            <Link href="/terms" className="transition-colors hover:text-foreground">
              利用規約
            </Link>
            <Link href="/privacy" className="transition-colors hover:text-foreground">
              プライバシーポリシー
            </Link>
            <Link href="/guidelines" className="transition-colors hover:text-foreground">
              ガイドライン
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
