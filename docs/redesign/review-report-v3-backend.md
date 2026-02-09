# バックエンドレビュー報告書 v3

**レビュワー**: reviewer-be
**日付**: 2026-02-09
**対象**: タスク#2（バックエンドAPI実装 - スキーマ変更+API改修）

---

## 1. 総合評価

バックエンド実装は全体的に良好です。型定義の更新、スキーマ変更SQL、タイムラインAPI・リアクションAPI・分析API・テーマ関連API・ユーザー投稿一覧API・ポジションマップAPIの改修が設計書に沿って正しく行われています。バックエンド単体のTypeScriptビルドエラーはありません（フロントエンドページ側に未改修のTypeScriptエラーが12件残存していますが、これはタスク#3・#4のスコープです）。

ただし、**致命的な問題が1件**、重要な問題が2件あります。

### レビュー対象ファイル一覧

- `src/types/database.ts`, `src/types/index.ts`
- `src/lib/validations/post.ts`, `src/lib/utils/consensus.ts`, `src/lib/constants.ts`
- `docs/redesign/schema-changes-v3.sql`
- `src/app/api/posts/route.ts`, `src/app/api/posts/[id]/route.ts`
- `src/app/api/posts/[id]/reactions/route.ts`, `src/app/api/posts/[id]/analysis/route.ts`
- `src/app/api/timeline/home/route.ts`, `src/app/api/timeline/explore/route.ts`, `src/app/api/timeline/theme/[id]/route.ts`
- `src/app/api/themes/route.ts`, `src/app/api/themes/featured/route.ts`
- `src/app/api/themes/[id]/route.ts`, `src/app/api/themes/[id]/consensus/route.ts`, `src/app/api/themes/[id]/spectrum/route.ts`
- `src/app/api/users/[handle]/route.ts`, `src/app/api/users/[handle]/posts/route.ts`
- `src/app/api/users/me/position-map/route.ts`, `src/app/api/users/me/echo-chamber/route.ts`
- `src/app/api/notifications/route.ts`
- `supabase/migrations/00001_create_tables.sql`, `supabase/migrations/00002_create_rls_policies.sql`
- `src/middleware.ts`

---

## 2. 致命的な問題 (CRITICAL)

### C-1: reactions テーブルに UPDATE の RLS ポリシーが存在しない

**ファイル**: `supabase/migrations/00002_create_rls_policies.sql` (行143-153)
**関連ファイル**: `src/app/api/posts/[id]/reactions/route.ts` (行70-73)
**関連ファイル**: `docs/redesign/schema-changes-v3.sql`

**問題**:
新しいリアクションAPIは、既存リアクションのスコアを `.update({ reaction_score: reactionScore })` で更新します（行70-73）。しかし、`reactions` テーブルのRLSポリシーには SELECT / INSERT / DELETE のみ定義されており、**UPDATE ポリシーが存在しません**。

旧実装では「評価の変更は削除→再作成で対応」という方針だったためUPDATEポリシーは不要でしたが、新実装ではスコア更新にUPDATEを使用するため、RLSによって**全てのUPDATE操作がサイレントに拒否されます**。

マイグレーションSQL (`schema-changes-v3.sql`) にもUPDATEポリシーの追加が含まれていません。

**影響**: ユーザーがスライダーでリアクションスコアを変更しても、DBレベルで更新が拒否され、スコアが変わらない。エラーも返らない可能性がある（Supabaseの挙動による）。

**修正案**:
```sql
CREATE POLICY "reactions_update_own"
  ON reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

これを `schema-changes-v3.sql` に追加し、実際のDBにも適用する必要があります。

---

## 3. 重要な問題 (HIGH)

### H-1: 自分の投稿にリアクションできるサーバーサイドチェックがない

**ファイル**: `src/app/api/posts/[id]/reactions/route.ts`

**問題**:
投稿の存在確認（行40-44）はしていますが、リアクション送信者が投稿の作成者本人かどうかのチェックがありません。フロントエンドでは `disabled={isOwnPost}` で無効化していますが、APIを直接呼べば自分の投稿にリアクション可能です。

**影響**: ユーザーが自分の投稿に任意のスコアを付与でき、平均スコアを操作できます。

**修正案**:
```typescript
// Verify post exists
const { data: post } = await supabase
  .from("posts")
  .select("id, user_id")
  .eq("id", postId)
  .single();

if (!post) { /* 404 */ }

// Prevent self-reaction
if (post.user_id === user.id) {
  return NextResponse.json(
    { error: "自分の投稿には評価できません", status: 403 },
    { status: 403 }
  );
}
```

### H-2: title バリデーションで空文字列のトリムが不完全

**ファイル**: `src/lib/validations/post.ts` (行3-7)

**問題**:
Zodスキーマの `title` フィールドは `.max(60)` のみで、`.min(1)` や `.trim()` がありません。APIルート側（`src/app/api/posts/route.ts` 行33）では `title?.trim() || null` で空文字をnullに変換していますが、Zodスキーマでは空白のみの文字列（例: `"   "`）がバリデーションを通過し、`.trim()` 後にnullにはなりますが、スペースのみ60文字以上の文字列がDBの `char_length(title) <= 60` 制約に違反する可能性があります。

また、タイトルが1文字の空白の場合、`trim()` で空文字になり `null` になるため実害は小さいですが、`.transform()` をZodスキーマ側に含めるのがより堅牢です。

**修正案**:
```typescript
title: z
  .string()
  .max(60, "タイトルは60文字以内で入力してください")
  .transform(v => v.trim() || undefined)
  .optional(),
```

---

## 4. 中程度の問題 (MEDIUM)

### M-1: 全リアクションをアプリケーション層で集計している（潜在的パフォーマンス問題）

**ファイル**: `src/app/api/posts/[id]/route.ts` (行52-59)、各タイムラインAPI

**問題**:
投稿詳細APIでは、該当投稿の全リアクションを `select("reaction_score")` でフェッチし、JavaScript側で平均を計算しています。タイムラインAPIでも同様に、表示対象の全投稿の全リアクションを一度にフェッチして Map で集計しています。

現在のMVP規模では問題ありませんが、投稿数・リアクション数が増加すると:
- 1投稿あたり数千件のリアクションがある場合、JSONペイロードが大きくなる
- タイムラインで20投稿 x 数千リアクション = 数万行のデータ転送

**現状**: 既にexplore APIのTODOコメント（行30-31）に記載あり。認識済みの技術的負債。

**推奨**: 将来的にはDB側で `COUNT()` / `AVG()` を使用した集計クエリ、またはマテリアライズドビューの導入を検討。

### M-2: notifications テーブルの CHECK 制約がDBスキーマで未更新

**ファイル**: `supabase/migrations/00001_create_tables.sql` (行226-228)

**問題**:
元のスキーマでは `notifications_type_check` に `'good'` が含まれています（行227）。マイグレーションSQL (`schema-changes-v3.sql`) でUPDATE + DROP/ADD CONSTRAINTが記述されていますが、これが実際にDBに適用済みかは確認が必要です。

TypeScript型定義（`database.ts` 行89-94）は正しく `'reaction'` に更新されています。

### M-3: リアクションINSERT時の通知送信が未実装

**ファイル**: `src/app/api/posts/[id]/reactions/route.ts`

**問題**:
設計書（topic-driven-design.md セクション8.2）では「新しいリアクション（INSERT）時のみ通知」と記載されていますが、リアクションAPIのINSERT成功後に通知を作成するロジックが実装されていません。

旧実装でも通知送信ロジックがこのルートに含まれていなかった可能性がありますが、設計書に記載がある以上、意図的な省略かどうか確認が必要です。

---

## 5. 低い問題 (LOW)

### L-1: `reactor_attribute_snapshot` に `undefined` が渡される可能性

**ファイル**: `src/app/api/posts/[id]/reactions/route.ts` (行93)

```typescript
reactor_attribute_snapshot: attributes ?? undefined,
```

`attributes` が `null` の場合、`undefined` がSupabaseに渡されます。Supabaseクライアントは `undefined` をカラムの省略（デフォルト値を使用）として扱うため、JSONB型のデフォルトが `null` であれば問題ありません。ただし、明示的に `null` を渡す方が意図が明確です。

### L-2: Explore APIの `popular` ソートで200件ハードリミット

**ファイル**: `src/app/api/timeline/explore/route.ts` (行32)

既存のTODOコメントに記載済み。データ量増加時に人気順ソートの精度が低下する可能性。

### L-3: position-map API の axes がソートされていない

**ファイル**: `src/app/api/users/me/position-map/route.ts` (行122-123)

`axes.slice(0, 6)` で上位6テーマを取得していますが、事前にソート（例えばリアクション数順やスコア偏差順）が行われていません。Map のイテレーション順に依存しているため、表示されるテーマの選択が不安定になる可能性があります。明示的なソート基準の追加を推奨。

### L-4: users/[handle]/posts API のレスポンスキーが他のタイムラインAPIと不整合

**ファイル**: `src/app/api/users/[handle]/posts/route.ts` (行146-150)

他のタイムラインAPI（home, explore, theme）はレスポンスに `items` キーを使用していますが、このAPIは `posts` キーを使用しています。また `hasMore` フィールドが含まれていません。フロントエンド側で扱い方が変わるため、統一が望ましい。

```typescript
// 他のタイムラインAPI
{ data: { items: [...], nextCursor, hasMore } }

// users/[handle]/posts API
{ data: { posts: [...], nextCursor } }  // hasMore がない
```

---

## 6. セキュリティチェックリスト

### 6.1 スライダー値バリデーション

| チェック項目 | 結果 |
|---|---|
| reactionScore が number であること | OK (`typeof reactionScore !== "number"`) |
| reactionScore が整数であること | OK (`!Number.isInteger(reactionScore)`) |
| reactionScore が 0-100 の範囲であること | OK (`reactionScore < 0 \|\| reactionScore > 100`) |
| DB CHECK 制約との一致 | OK (schema-changes-v3.sql: `CHECK (reaction_score >= 0 AND reaction_score <= 100)`) |

### 6.2 SQLインジェクション防止

| チェック項目 | 結果 |
|---|---|
| Supabase クライアントのパラメータバインディング使用 | OK（全APIでクエリビルダー使用） |
| 生SQLの使用箇所 | なし |
| `.or()` フィルタの安全性 | 該当なし（今回の変更にはなし） |

### 6.3 認証・認可

| チェック項目 | 結果 |
|---|---|
| リアクションAPI: 認証チェック | OK (`supabase.auth.getUser()`) |
| 投稿作成API: 認証チェック | OK |
| 分析API: 投稿者本人チェック | OK (`post.user_id !== user.id` → 403) |
| リアクションAPI: 自己投稿への評価防止 | **NG** (H-1参照) |
| 投稿削除API: 本人チェック | OK |
| ポジションマップAPI: 認証チェック | OK |
| エコーチェンバーAPI: 認証チェック | OK |
| ユーザー投稿一覧API: 公開アクセス | OK（認証不要の公開データ） |
| テーマ詳細/一覧API: 公開アクセス | OK |
| スペクトラムAPI: 公開アクセス | OK |
| コンセンサスAPI: 公開アクセス | OK |

### 6.4 RLSポリシー整合性

| テーブル | 必要な操作 | RLSポリシー | 結果 |
|---|---|---|---|
| reactions | SELECT | reactions_select_all | OK |
| reactions | INSERT | reactions_insert_authenticated | OK |
| reactions | UPDATE | **なし** | **NG** (C-1参照) |
| reactions | DELETE | reactions_delete_own | OK |
| posts | SELECT | posts_select_all | OK |
| posts | INSERT | posts_insert_authenticated | OK |
| notifications | INSERT | service_role_only (false) | OK（サービスロール前提） |

### 6.5 既存セキュリティ修正の維持

| 修正項目 | 維持状況 |
|---|---|
| httpOnly cookie による認証 | OK（middleware.ts 変更なし） |
| RLS: user_attributes SELECT は本人のみ | OK（変更なし、TODOコメント維持） |
| RLS: invite_codes UPDATE 制限 | OK（変更なし） |
| RLS: notifications INSERT 禁止 | OK（変更なし） |
| middleware auth: getUser() 使用 | OK |
| Signup rollback | OK（変更なし） |
| Rate limiting | 対象外（リアクションAPIにはrate limitなし。将来検討） |

---

## 7. データ整合性

### 7.1 スキーマ変更SQL (`schema-changes-v3.sql`)

| 項目 | 結果 |
|---|---|
| posts.title カラム追加 | OK (`TEXT DEFAULT NULL`) |
| posts.title 長さ制約 | OK (`char_length(title) <= 60`) |
| reactions.reaction_score カラム追加 | OK |
| 既存データマイグレーション (good→80, bad→20) | OK |
| NOT NULL 制約追加 | OK |
| CHECK 制約 (0-100) | OK |
| 旧 reaction_type カラム削除 | OK |
| notifications type 更新 (good→reaction) | OK |
| notifications CHECK 制約更新 | OK |
| **reactions UPDATE RLSポリシー追加** | **NG** (漏れ) |

### 7.2 型定義とDBスキーマの一致

| 型 | DBスキーマ | TypeScript型 | 一致 |
|---|---|---|---|
| Post.title | `TEXT DEFAULT NULL` | `string \| null` | OK |
| Reaction.reaction_score | `INTEGER NOT NULL CHECK(0-100)` | `number` | OK |
| NotificationType | `'reply','follow','reaction','theme_start','analysis_ready'` | 同左 | OK |
| ReactionType | 削除済み | コメントアウト | OK |

### 7.3 Supabase Database 型

| テーブル | Row / Insert / Update | 結果 |
|---|---|---|
| posts | Row: Post, Insert: PostInsert (title追加), Update: PostUpdate (title追加) | OK |
| reactions | Row: Reaction, Insert: ReactionInsert, Update: `Partial<Pick<Reaction, 'reaction_score'>>` | OK |
| notifications | Row: Notification (type更新), Insert: NotificationInsert | OK |

---

## 8. パフォーマンス

### 8.1 N+1 クエリ

| API | N+1リスク | 結果 |
|---|---|---|
| タイムライン (home/explore/theme) | 投稿一覧→ユーザー・属性・リアクションをバッチ取得 | OK (Promise.all) |
| 投稿詳細 | 1投稿の取得後、個別にauthor・reactions・replies取得 | 許容範囲（単一投稿のため） |
| テーマ一覧 | 全テーマ→全theme_posts→全postsをバッチ取得 | OK (Promise.all) |
| 分析API | 全リアクションを一度にフェッチ | OK（MIN_SAMPLE_SIZE = 20で閾値あり） |
| ユーザー投稿一覧 | 投稿→リアクション・返信・属性をバッチ取得 | OK (Promise.all) |
| ポジションマップ | テーマ→theme_posts→リアクションをバッチ取得 | OK |
| エコーチェンバー | フォロー一覧→属性をバッチ取得 | OK |
| スペクトラム | theme_posts→posts→reactions→usersをバッチ取得 | OK |

### 8.2 集計クエリ効率性

前述のM-1の通り、AVG計算はアプリケーション層で行われています。MVP規模では許容範囲ですが、スケール時にはDB側集計への移行が必要です。

---

## 9. TypeScript ビルドチェック

```
npx tsc --noEmit
```

**結果**: バックエンドAPI関連のエラーは0件。
フロントエンドページ側に12件のエラーが残存していますが、全てタスク#3・#4のスコープ（`goodCount` / `badCount` / `currentUserReaction` の旧propsをまだ使用しているページ）です。

---

## 10. まとめ

| 重要度 | 件数 | 内容 |
|---|---|---|
| CRITICAL | 1 | C-1: reactions UPDATE RLSポリシー欠落 |
| HIGH | 2 | H-1: 自己投稿リアクション防止なし, H-2: titleバリデーション改善 |
| MEDIUM | 3 | M-1: アプリ層集計, M-2: notifications CHECK制約適用確認, M-3: リアクション通知未実装 |
| LOW | 4 | L-1: undefined→null, L-2: popularソート200件制限, L-3: position-map axesソートなし, L-4: users/[handle]/posts レスポンス不整合 |

**必須対応**: C-1（デプロイ前に必ず修正）、H-1（セキュリティ上重要）

**推奨対応**: H-2、M-2、M-3

**将来対応**: M-1、L-1、L-2、L-3、L-4
