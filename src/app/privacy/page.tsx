import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-bold">プライバシーポリシー</h1>
      <p className="mt-2 text-sm text-muted-foreground">最終更新日: 2026年2月7日</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold">1. 事業者情報</h2>
          <p className="mt-2">
            サービス名: My Opinion（マイオピニオン）
          </p>
          <p className="mt-1">
            お問い合わせ: support@myopinion.example.com
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">2. 取得する個人情報</h2>
          <p className="mt-2">本サービスでは、以下の個人情報を取得します。</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>メールアドレス（アカウント認証に使用）</li>
            <li>表示名、自己紹介文</li>
            <li>アバター画像</li>
            <li>属性情報（性別、年齢帯、学歴、職業）</li>
            <li>要配慮個人情報（支持政党、政治スタンス）- 個別に同意を取得した場合のみ</li>
            <li>投稿内容、リアクション履歴</li>
            <li>IPアドレス、ブラウザ情報（アクセスログ）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">3. 利用目的</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>サービスの提供・運営</li>
            <li>ユーザー認証・アカウント管理</li>
            <li>投稿の属性別分析（匿名化・集約化した統計データとして）</li>
            <li>エコーチェンバー指標の算出</li>
            <li>不正行為の検知・防止</li>
            <li>サービスの改善・新機能の開発</li>
            <li>法令に基づく対応（発信者情報開示請求等）</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">4. 要配慮個人情報の取り扱い</h2>
          <p className="mt-2">
            支持政党・政治スタンスは、個人情報保護法第2条第3項に定める「要配慮個人情報」に該当します。
            これらの情報は以下のとおり取り扱います。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>取得にあたり、オプトイン方式による明示的な同意を取得します</li>
            <li>同意の記録（日時・内容・バージョン）を保存します</li>
            <li>同意はいつでも撤回可能です（設定画面から変更できます）</li>
            <li>オプトアウト方式による第三者提供は行いません</li>
            <li>分析に利用する場合は、k-匿名化（k&gt;=5）を適用し、個人が特定されない形で処理します</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">5. 第三者提供</h2>
          <p className="mt-2">
            本サービスでは、以下の場合を除き、個人情報を第三者に提供しません。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>ユーザー本人の同意がある場合</li>
            <li>法令に基づく場合（発信者情報開示請求、捜査関係事項照会等）</li>
            <li>人の生命・身体・財産の保護に必要な場合</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">6. 外部送信（Cookie等）</h2>
          <p className="mt-2">
            本サービスでは、以下の目的でCookie及び類似技術を使用します。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>認証状態の維持（Supabase Auth）</li>
            <li>サービスの利用状況の分析</li>
          </ul>
          <p className="mt-2">
            ブラウザの設定によりCookieを無効にすることができますが、一部のサービス機能が利用できなくなる場合があります。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">7. データの保存と安全管理</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>データはSupabase（PostgreSQL）に保存され、通信は全てTLS 1.2以上で暗号化されます</li>
            <li>Row Level Security (RLS) により、データベースレベルでのアクセス制御を実施しています</li>
            <li>要配慮個人情報は暗号化して保存します</li>
            <li>アクセスログを記録し、不正アクセスの監視を行っています</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">8. データの保存期間</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>アカウント情報: 退会後30日間保持した後、削除</li>
            <li>投稿データ: 退会後30日間保持した後、削除</li>
            <li>同意記録: 法的保持義務に基づき、同意撤回後も一定期間保持</li>
            <li>アクセスログ: 90日間保持</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold">9. 開示・訂正・削除請求</h2>
          <p className="mt-2">
            ユーザーは、自身の個人情報について以下の権利を行使できます。
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>開示請求: 保有する個人情報の開示を求めることができます</li>
            <li>訂正請求: 個人情報の内容が事実でない場合、訂正を求めることができます</li>
            <li>削除請求: 個人情報の削除を求めることができます</li>
            <li>利用停止請求: 個人情報の利用停止を求めることができます</li>
          </ul>
          <p className="mt-2">
            上記請求は、設定画面またはお問い合わせ窓口（support@myopinion.example.com）にてお受けいたします。
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold">10. プライバシーポリシーの変更</h2>
          <p className="mt-2">
            本ポリシーを変更する場合は、変更内容をサービス上で通知します。
            重要な変更の場合は、ユーザーに再同意を求める場合があります。
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
