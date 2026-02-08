# バックエンド詳細ドキュメント

このプロジェクトのバックエンドは **Next.js App Router の API Routes** で構成されています。  
「APIがどこに書いてあるか」「DBや認証がどこで扱われているか」を中心に説明します。

## 1. バックエンドの全体像（最短で把握するための地図）
- **APIの入口はすべて `src/app/api`**  
  フォルダ構成がそのままURLになります。
- **DBは Supabase (PostgreSQL)**  
  RLS（Row Level Security）でアクセス制御を行います。
- **DBスキーマとRLSは `supabase/migrations`**  
  SQLファイルでテーブル・ポリシー・インデックスが定義されています。

## 2. フォルダ構成（どこに何があるか）
```
src/
  app/api/            APIルート（/api/...）
  lib/supabase/       Supabase接続（通常/特権/ミドルウェア）
  lib/validations/    入力バリデーション（zod）
  types/              型定義（DBやAPIレスポンス）
supabase/
  migrations/         DBテーブル/RLS/インデックス定義
```

## 3. APIルーティングの仕組み
Next.js App Routerでは **`route.ts` がAPIエンドポイント** になります。

例:
- `src/app/api/posts/route.ts` → `POST /api/posts` など
- `src/app/api/posts/[id]/route.ts` → `/api/posts/:id`

`[id]` や `[handle]` のような角括弧付きフォルダは **動的パラメータ**です。

## 4. API領域一覧（主要エンドポイント）
- **認証**: `/api/auth/*`  
  `signup`, `login`, `logout`, `reset-password`, `update-password`, `callback`
- **投稿**: `/api/posts/*`  
  `POST /api/posts`, `GET/DELETE /api/posts/:id` など
- **タイムライン**: `/api/timeline/*`  
  `home`, `explore`, `theme`
- **ユーザー**: `/api/users/*`  
  `GET /api/users/:handle`, `GET /api/users/me`
- **フォロー**: `/api/follows/*`  
  `POST/DELETE /api/follows/:userId`
- **通知**: `/api/notifications/*`  
  一覧、既読化、未読数など
- **テーマ**: `/api/themes/*`  
  一覧、詳細
- **招待**: `/api/invite/*`  
  生成、検証、利用
- **通報**: `/api/reports`
- **同意**: `/api/consent/*`
- **管理**: `/api/admin/*`  
  `users`, `posts`, `reports`, `themes`, `stats`, `invite`

## 5. Supabaseクライアントの使い分け
`src/lib/supabase` に用途別のクライアントがあります。

- `server.ts`  
  `createServerClient()` を使い、**RLSが効いた通常アクセス**を行います。
- `service.ts`  
  サービスロールキーで **RLSをバイパスする特権アクセス**を行います。  
  （通知生成や管理者処理など）
- `middleware.ts`  
  セッション更新や認証情報の取得をミドルウェアで行います。

## 6. 入力バリデーション
- `src/lib/validations/*`  
  zodで入力スキーマを定義しています。
  - `auth.ts` : ログイン/サインアップの入力
  - `post.ts` : 投稿・返信
  - `profile.ts` : プロフィール更新
  - `consent.ts` : 同意記録

## 7. DBスキーマ/権限の置き場所
`supabase/migrations` にSQLがまとまっています。

- `00001_create_tables.sql`  
  テーブルや型の作成。
- `00002_create_rls_policies.sql`  
  RLSポリシー（認可ルール）。
- `00003_create_indexes.sql`  
  パフォーマンス向上のためのインデックス。

## 8. 認証・認可の流れ
1. API側で `supabase.auth.getUser()` によりログインユーザーを取得。
2. **未ログインの場合はエラーを返す**。
3. DB側でRLSが効くため、**ユーザー権限に応じたデータだけ取得**されます。
4. 管理者APIはDBの `is_admin()` 判定を通らないと実行できません。

## 9. 代表的な処理フロー（例）
### 9.1 投稿作成
1. フロントが `POST /api/posts` を実行。
2. APIでユーザーを取得し、入力を `post.ts` のスキーマで検証。
3. `posts` テーブルへINSERT。
4. 必要なら `theme_posts` に紐付け。

### 9.2 通知生成
1. 通知生成が必要なAPIで `service.ts` を使用。
2. `notifications` テーブルにINSERT。
3. フロントは `/api/notifications` から取得。

### 9.3 管理者操作
1. 管理者が `/api/admin/*` を実行。
2. RLSの `is_admin()` 判定を通過した場合のみ処理。
3. `admin_actions` にログを記録。

---

本ドキュメントは、バックエンドAPIの構成と「どこに何が書いてあるか」を理解しやすくするためのガイドです。
