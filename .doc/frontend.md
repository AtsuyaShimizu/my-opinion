# フロントエンド詳細ドキュメント

## 1. 技術スタックと構成
- **Next.js (App Router)** を採用し、`src/app` 配下のディレクトリ構造で画面を構成します。
- **React Server Components / Client Components** を適宜使い分け、`"use client"` が付いたコンポーネントでクライアント側の状態管理やイベント処理を行います。
- UI部品は `src/components` に集約され、ページから呼び出される設計です。

## 2. ルーティングとページ構成
- `src/app` がアプリ全体のエントリです。
- ルートグループ `(auth)` と `(main)` により、認証系とメイン機能が分割されています。
- 主要ページの例:
  - `src/app/(auth)` : ログイン、サインアップ、パスワードリセット
  - `src/app/(main)` : ホーム、探索、テーマ、通知、ユーザー詳細、設定
  - `src/app/onboarding` : 初回オンボーディング（属性入力・同意記録）

## 3. レイアウトとグローバル設定
- `src/app/layout.tsx` にフォント設定、メタデータ、グローバルCSS (`globals.css`) が定義されています。
- `src/app/globals.css` で全体のスタイルが管理されます。

## 4. UIコンポーネント
- `src/components` にボタン、フォーム、モーダル、投稿表示などのUI部品が配置されています。
- 画面側ではこれらを組み合わせてUIを構築します。

## 5. 認証とセッション
- クライアント側のSupabase接続は `src/lib/supabase/client.ts` の `createBrowserClient()` を利用します。
- 認証状態は `src/hooks/useAuth.ts` で管理し、
  `supabase.auth.getUser()` / `onAuthStateChange` によって同期します。

## 6. API通信
- API呼び出しは `src/lib/api/client.ts` の `apiFetch()` を利用し、
  すべてのページやコンポーネントで統一したエラー処理を行います。
- `apiFetch()` は JSON レスポンスの `data` / `error` を前提とした共通インタフェースです。

## 7. ルーティング制御（ミドルウェア）
- `src/middleware.ts` にて、認証済みユーザー／未認証ユーザーのリダイレクトを制御しています。
- `/home`, `/explore`, `/settings` などの保護ルートは未ログイン時に `/login` へ遷移します。

## 8. 画面実装の典型フロー
1. ページコンポーネントが `apiFetch()` で API を呼び出しデータ取得。
2. 取得したデータを `src/components` のUI部品に渡して表示。
3. フォーム操作・ボタンクリックなどのイベントで API にリクエスト。
4. 必要に応じて `useAuth()` でログイン状態を参照・遷移制御。

---

本ドキュメントは、フロントエンド実装の全体像と主要な責務を把握するためのガイドとして作成しています。
