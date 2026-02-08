import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">利用規約</h1>
      <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年2月7日</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">第1条（サービスの定義）</h2>
          <p className="mt-2">
            「My Opinion」（以下「本サービス」）は、属性を開示した状態で議論を行うことができるソーシャルネットワーキングサービスです。
            ユーザーは性別、年齢帯、学歴、職業、支持政党、政治スタンス等の属性情報を任意で登録し、公開した上で投稿・議論を行うことができます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">第2条（利用資格）</h2>
          <p className="mt-2">本サービスは、18歳以上の方を対象としています。有効な招待コードを保有している方のみ登録可能です。</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">第3条（属性情報の取り扱い）</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>属性情報の入力は任意です</li>
            <li>入力された属性は、公開設定に応じて他のユーザーに表示されます</li>
            <li>属性情報は匿名化された統計データとして分析に利用されます</li>
            <li>政治スタンス・支持政党は「要配慮個人情報」に該当し、個別の同意を取得します</li>
            <li>属性情報は正確に入力してください。虚偽の属性情報の入力は禁止されています</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">第4条（禁止事項）</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>属性に基づく差別的な発言・行為</li>
            <li>誹謗中傷、名誉毀損に該当する投稿</li>
            <li>虚偽の属性情報の入力</li>
            <li>なりすまし行為</li>
            <li>他のユーザーの個人特定を試みる行為</li>
            <li>属性情報を外部に流出させる行為</li>
            <li>スパム行為</li>
            <li>法令に違反する行為</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">第5条（モデレーション）</h2>
          <p className="mt-2">
            運営は、禁止事項に該当する投稿やユーザーに対し、段階的な制裁（警告 → 投稿制限（24時間）→ アカウント一時停止（7日間）→ アカウント凍結）を行うことがあります。
            制裁を受けたユーザーは不服申立てが可能です。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">第6条（著作権）</h2>
          <p className="mt-2">
            ユーザーが投稿したコンテンツの著作権はユーザーに帰属します。
            ただし、本サービスの運営に必要な範囲で、非独占的なライセンスを付与していただきます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">第7条（退会）</h2>
          <p className="mt-2">
            ユーザーはいつでも退会が可能です。退会後30日間はデータが保持され、復旧が可能です。
            それ以降は法的保持義務のあるデータを除き、完全に削除されます。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">第8条（免責事項）</h2>
          <p className="mt-2">
            運営は、本サービスの提供にあたり、軽過失の場合に限り、ユーザーが支払った利用料金を上限として損害賠償責任を負います。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">第9条（準拠法・管轄裁判所）</h2>
          <p className="mt-2">
            本規約は日本法に準拠し、本サービスに関する紛争は東京地方裁判所を第一審の専属的合意管轄裁判所とします。
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
