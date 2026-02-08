import Link from "next/link";

export default function GuidelinesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">コミュニティガイドライン</h1>
      <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年2月7日</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">My Opinionの基本理念</h2>
          <p className="mt-2">
            My Opinionは、属性を開示した状態で建設的な議論を行う場です。
            多様なバックグラウンドを持つユーザーが、互いの立場を理解しながら対話することを目指しています。
            本ガイドラインは、すべてのユーザーが安心して利用できる環境を維持するための指針です。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">推奨される行動</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>相手の属性や立場を尊重した発言を心がける</li>
            <li>根拠に基づいた意見を述べる</li>
            <li>異なる意見に対して冷静に対応する</li>
            <li>正確な属性情報を入力する</li>
            <li>建設的なフィードバック（Good/Bad）を行う</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">禁止行為</h2>
          <p className="mt-2">以下の行為は禁止されています。違反が確認された場合、制裁の対象となります。</p>

          <h3 className="mt-4 font-semibold">1. 属性に基づく差別</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>特定の属性（性別、学歴、職業、政治的立場等）を理由とした侮辱・攻撃</li>
            <li>属性に基づくステレオタイプの押し付け</li>
            <li>「○○の人は発言する資格がない」等の排除的な表現</li>
          </ul>

          <h3 className="mt-4 font-semibold">2. 誹謗中傷・名誉毀損</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>個人を対象とした人格攻撃</li>
            <li>事実と異なる内容による中傷</li>
            <li>プライバシーの侵害に該当する情報の投稿</li>
          </ul>

          <h3 className="mt-4 font-semibold">3. 虚偽の属性情報</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>意図的に事実と異なる属性情報を入力する行為</li>
            <li>議論を有利に進めるための属性詐称</li>
          </ul>

          <h3 className="mt-4 font-semibold">4. なりすまし</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>他のユーザーや実在の人物を装う行為</li>
            <li>公的機関や組織を装う行為</li>
          </ul>

          <h3 className="mt-4 font-semibold">5. 個人特定行為</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>他のユーザーの個人情報（氏名、住所、勤務先等）を特定しようとする行為</li>
            <li>属性情報の組み合わせから個人を推定し、その情報を投稿する行為</li>
            <li>属性情報を外部に流出させる行為</li>
          </ul>

          <h3 className="mt-4 font-semibold">6. スパム・迷惑行為</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>同一内容の繰り返し投稿</li>
            <li>商業的な宣伝・勧誘行為</li>
            <li>サービスの正常な運営を妨害する行為</li>
          </ul>

          <h3 className="mt-4 font-semibold">7. その他</h3>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>法令に違反する行為</li>
            <li>犯罪行為を助長・教唆する内容</li>
            <li>わいせつな内容の投稿</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">段階的制裁</h2>
          <p className="mt-2">
            違反行為が確認された場合、以下の段階的な制裁を適用します。
            違反の重大性や繰り返しの程度に応じて、段階を飛ばす場合があります。
          </p>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg border p-3">
              <p className="font-medium">第1段階: 警告</p>
              <p className="mt-1 text-muted-foreground">
                該当投稿の指摘と改善の要請。アカウントへの制限はありません。
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium">第2段階: 投稿制限（24時間）</p>
              <p className="mt-1 text-muted-foreground">
                24時間の投稿機能の制限。閲覧は引き続き可能です。
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium">第3段階: アカウント一時停止（7日間）</p>
              <p className="mt-1 text-muted-foreground">
                7日間のアカウント停止。すべての機能が利用できなくなります。
              </p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="font-medium">第4段階: アカウント凍結</p>
              <p className="mt-1 text-muted-foreground">
                アカウントの永久凍結。復旧はできません。
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold">通報方法</h2>
          <p className="mt-2">
            ガイドラインに違反する投稿やユーザーを発見した場合は、以下の方法で通報できます。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>投稿の「...」メニューから「通報する」を選択</li>
            <li>ユーザープロフィールの「...」メニューから「通報する」を選択</li>
            <li>通報理由を選択し、必要に応じて詳細を記入</li>
          </ul>
          <p className="mt-2">
            通報は匿名で処理されます。通報内容は運営チームが確認し、原則1営業日以内に対応判断を行います。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">不服申立て</h2>
          <p className="mt-2">
            制裁を受けた場合、不服申立てが可能です。
            お問い合わせ窓口（support@myopinion.example.com）までご連絡ください。
            申立て内容を運営チームが再審査し、結果をお知らせします。
          </p>
        </section>
      </div>

      <div className="mt-8 border-t pt-4">
        <Link href="/" className="text-sm text-primary hover:underline">
          トップページに戻る
        </Link>
      </div>
    </div>
  );
}
