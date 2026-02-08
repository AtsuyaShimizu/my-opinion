# My Opinion Webアプリケーション構成ドキュメント

## 1. 全体概要
本リポジトリは、Next.js (App Router) をフロントエンド兼バックエンドとして利用し、Supabase を認証・DB基盤として採用したSNSアプリケーションです。フロントエンドは `src/app` 配下のページと `src/components` のUIコンポーネント群、バックエンドは `src/app/api` 配下のAPIルート群で構成されています。データベースは Supabase のPostgreSQLで、`supabase/migrations` にテーブル定義・RLS・インデックスが管理されています。

## 2. フロントエンド (Next.js App Router)

### 2.1 ルーティング構成
- `src/app` がApp Routerのエントリ。`(auth)` や `(main)` はルートグループとして機能し、認証画面とメイン画面のレイアウトやページを整理しています。
- グローバル設定は `src/app/layout.tsx` にあり、フォント設定やメタデータ、グローバルCSS (`globals.css`) を読み込みます。

### 2.2 画面・機能の例
- 認証系: `src/app/(auth)` にログイン/サインアップ/パスワードリセット画面。
- メイン: `src/app/(main)` にホーム、探索、テーマ、通知、ユーザー詳細、設定などのページ。
- オンボーディング: `src/app/onboarding` に属性入力や同意記録の登録フロー。

### 2.3 UIコンポーネントとフック
- `src/components` にボタン、モーダル、フォーム、タイムライン表示などのUI部品が配置され、ページから再利用されます。
- 認証状態の管理は `src/hooks/useAuth.ts` が担当し、Supabaseの `auth.getUser()` と `onAuthStateChange` で状態同期を行います。
- API通信は `src/lib/api/client.ts` の `apiFetch()` を通じて行い、JSONレスポンスの `data`/`error` を統一的に扱います。

### 2.4 認証・セッション管理
- ブラウザからは `src/lib/supabase/client.ts` が `createBrowserClient()` を使ってSupabaseクライアントを生成します。
- `src/middleware.ts` がセッションCookieの有無で保護ルートの制御とリダイレクトを行います。
- `src/lib/supabase/middleware.ts` がSupabaseセッションを更新し、サーバーサイドでのセッション延命を実施します。

## 3. バックエンド (Next.js API Routes)

### 3.1 APIルートの構成
バックエンドは `src/app/api` に集約されています。主な領域は以下です。

- 認証: `/api/auth/*` (ログイン/サインアップ/ログアウト/パスワード更新など)
- 投稿: `/api/posts/*` (投稿作成、取得、削除、返信、リポスト、リアクション、分析)
- タイムライン: `/api/timeline/*` (ホーム/探索/テーマ別の一覧)
- ユーザー: `/api/users/*` (プロフィール、フォロー/フォロワー、属性更新)
- 通知: `/api/notifications/*` (一覧、未読数、既読化)
- テーマ: `/api/themes/*` (テーマ一覧、詳細)
- 招待: `/api/invite/*` (招待コードの生成・検証・利用)
- 通報: `/api/reports` (通報作成)
- 管理: `/api/admin/*` (ユーザー管理、テーマ管理、通報管理、統計)
- 同意: `/api/consent/*` (同意記録の取得・登録・削除)

### 3.2 Supabaseクライアントの使い分け
- APIルートは `src/lib/supabase/server.ts` の `createServerClient()` を用いて、RLSを適用した形でSupabaseへアクセスします。
- 管理者操作や通知生成など、RLSを回避する必要がある場合は `src/lib/supabase/service.ts` のサービスロールクライアントを使用します。

### 3.3 認証・権限制御
- APIルート内で `supabase.auth.getUser()` を呼び出し、ログイン済みかどうかを確認。
- 管理者専用APIはRLSの `is_admin()` 関数・ポリシーによってDB側でも制御。

## 4. データベース (Supabase / PostgreSQL)

### 4.1 テーブル構成
`supabase/migrations/00001_create_tables.sql` に全テーブルが定義されています。主なテーブルは以下です。

- `users`: ユーザー基本情報
- `user_attributes`: 学歴/職業/政治スタンスなど属性
- `consent_records`: 同意履歴
- `posts`: 投稿・返信・リポスト
- `reactions`: Good/Bad評価
- `follows`: フォロー関係
- `themes`: テーマ
- `theme_posts`: テーマと投稿の中間テーブル
- `notifications`: 通知
- `invite_codes`: 招待コード
- `reports`: 通報
- `admin_actions`: 管理者アクション履歴

### 4.2 RLS (Row Level Security)
`supabase/migrations/00002_create_rls_policies.sql` でRLSが定義されています。
- 認証ユーザーのみ書き込み可能なテーブル
- 本人のみ参照/更新可能なテーブル
- 管理者専用テーブル (admin_actions等)
- 通知はサービスロールのみINSERT可能

### 4.3 インデックス
`supabase/migrations/00003_create_indexes.sql` に、タイムライン取得・通知未読取得・通報管理などの高速化を目的としたインデックスが定義されています。

## 5. データフロー例

1. フロントエンドのページが `apiFetch()` を使って `/api/posts` や `/api/timeline/home` にリクエスト。
2. APIルートが `createServerClient()` でSupabaseに接続し、RLS付きでデータを取得/更新。
3. 投稿・リアクション・通知生成など、RLSバイパスが必要な処理はサービスロールクライアントを利用。
4. DBはRLSポリシーとインデックスで整合性とパフォーマンスを担保。

---

このドキュメントは、フロントエンド/バックエンド/DBの役割分担を俯瞰し、実装の場所と責務を把握しやすくするために作成しています。
