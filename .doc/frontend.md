# フロントエンド詳細ドキュメント

このプロジェクトのフロントエンドは **Next.js (App Router)** + **React** で構成されています。React/Next.js に不慣れな方向けに、**「どこに何が書いてあるか」**を中心に説明します。

## 1. フロントエンドの全体像（最短で理解するための地図）
- **画面（ページ）は `src/app` に集まる**  
  例: `src/app/(main)/home/page.tsx` が `/home` 画面に対応します。
- **画面の見た目の部品は `src/components` に集約**  
  例: 投稿カードやボタンなどの再利用パーツがここにあります。
- **API呼び出しや認証などの共通処理は `src/lib` に集約**  
  フロントエンドからバックエンドAPIを呼ぶための共通関数や、Supabaseの接続設定がここにあります。

## 2. フォルダ構成（どこに何があるか）
```
src/
  app/               画面とAPIのルーティング（ページとAPIルートが同居）
  components/        UI部品（ボタン、フォーム、投稿カード等）
  hooks/             Reactのカスタムフック（認証状態や通知数など）
  lib/               API通信やSupabase接続などの共通ロジック
  types/             型定義（DB型、APIレスポンス型など）
  middleware.ts      画面遷移のガード（未ログインはログイン画面へなど）
```

## 3. 画面の作り方（Next.jsのルーティングを前提に説明）
Next.jsのApp Routerでは、**フォルダがURL、`page.tsx`が画面**になります。

- 例: `src/app/(main)/home/page.tsx` → `/home`
- 例: `src/app/(main)/users/[handle]/page.tsx` → `/users/:handle`  
  `[...]` は動的パラメータ（ユーザーIDなど）を表します。

### 主要な画面領域
```
src/app/(auth)/...    ログイン、サインアップ、パスワードリセット
src/app/(main)/...    ホーム、探索、テーマ、通知、ユーザー詳細、設定
src/app/onboarding    初回オンボーディング
src/app/terms         利用規約
src/app/privacy       プライバシーポリシー
```

## 4. レイアウトと共通スタイル
- `src/app/layout.tsx`  
  画面全体の共通枠（フォント、メタデータ、`globals.css` など）がここに定義されています。
- `src/app/globals.css`  
  全ページに共通するスタイルがここにあります。

## 5. UI部品（`src/components`）
UIの共通パーツはカテゴリ別に整理されています。  
画面（`src/app/.../page.tsx`）からこれらを呼び出して構成します。

- `components/common` : 汎用パーツ（見出し、空状態など）
- `components/layout` : 画面レイアウト（ヘッダー、サイドバーなど）
- `components/post` : 投稿表示、投稿フォーム関連
- `components/user` : ユーザープロフィールやフォロー周り
- `components/auth` : 認証画面で使う部品
- `components/ui` : ボタンや入力などの基礎UI

## 6. 認証とセッション（Supabase）
- `src/lib/supabase/client.ts`  
  **ブラウザ側**でSupabaseに接続するための設定。
- `src/hooks/useAuth.ts`  
  `supabase.auth.getUser()` や `onAuthStateChange` を使い、  
  **ログイン状態をReact側で監視**します。

## 7. API通信の共通化
- `src/lib/api/client.ts` の `apiFetch()` が**フロントの共通APIクライアント**です。
- すべてのAPIは `{ data, error }` 形式のJSONを返す前提で、  
  画面側では `apiFetch()` を使って統一的にエラーハンドリングしています。

## 8. ルーティング制御（ミドルウェア）
- `src/middleware.ts` が **ログイン必須ルート** を判定します。
  - `/home`, `/explore`, `/settings` などは未ログインだと `/login` にリダイレクトされます。
  - ログイン済みで `/login` などにアクセスした場合は `/home` に移動します。

## 9. よくある画面実装の流れ（初心者向け）
1. **画面ファイルを探す**  
   例: `/home` なら `src/app/(main)/home/page.tsx`。
2. **画面が使っているUI部品を確認**  
   `src/components` 配下の該当コンポーネントを探す。
3. **データ取得処理を確認**  
   `apiFetch()` でバックエンドAPIを叩いていないか探す。
4. **認証やユーザー情報が必要なら `useAuth()` を参照**  
   未ログイン時の挙動は `src/middleware.ts` を確認。

---

本ドキュメントは、フロントエンドの全体像と「どこを見れば何が分かるか」を理解するためのガイドです。
