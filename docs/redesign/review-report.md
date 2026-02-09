# コードレビューレポート: リデザイン実装

**レビュー日**: 2026-02-08
**レビュワー**: reviewer
**対象**: プロダクトコンセプト再設計に伴うフロントエンド・バックエンド実装
**対象ファイル数**: 新規 ~20ファイル、変更 ~50ファイル (+2,803 / -958 行)
**TypeScriptビルド**: `npx tsc --noEmit` エラーなし

---

## 総合評価

実装品質は全体的に良好です。設計書（product-concept.md, ui-ux-design.md）に記載された5つの新機能（テーマファーストナビ、属性レンズ、オピニオンスペクトラム、コンセンサスメーター、マイポジションマップ）が適切に実装されており、既存機能との互換性も概ね維持されています。

**セキュリティ上の注意点2件**、**パフォーマンス問題2件**を含む複数の指摘事項があります。

> **注**: 初版で C-1（テーマ詳細ページの未定義変数参照）を致命的として報告しましたが、再確認の結果、424行目は `spectrumLabels` state を正しく使用しており、`fetchSpectrum` も API レスポンスの `xAxisLabels` を取得して `X_AXIS_LABELS_FALLBACK` をフォールバックとして使用していました。C-1 は**誤検出**です。致命的な問題はありません。

---

## セキュリティ (Security)

### S-1: user_attributes の RLS 制約が依然として未解決

**ファイル**: `src/app/api/timeline/explore/route.ts:62-63`、`src/app/api/users/[handle]/route.ts:28-30`、`src/app/api/users/suggested/route.ts:50-53`
**重大度**: 中 (既知の問題だが新規APIでも同様)

既存の問題として、`user_attributes` テーブルの RLS は `auth.uid() = user_id` に制限されており、他ユーザーの属性はクライアント権限では取得できません。新規API（`/api/users/suggested`）でも同じパターンで `user_attributes` を通常クライアントで取得しようとしています。

**影響**: 自分以外のユーザーの属性が空（null）として返される。属性レンズフィルターやスペクトラム表示が正しく機能しない。

**修正案**: これらのAPIルートでサービスロールクライアント（`createServiceClient()`）を使用して `user_attributes` を取得するか、公開属性のみ読み取り可能な RLS ポリシーを追加する。TODOコメントは記載済みだが未対応。

### S-2: /api/themes/featured, /api/themes/[id]/consensus, /api/themes/[id]/spectrum に認証チェックがない

**ファイル**: `src/app/api/themes/featured/route.ts`、`src/app/api/themes/[id]/consensus/route.ts`
**重大度**: 低

これらのAPIには `supabase.auth.getUser()` による認証チェックがありません。テーマ情報やコンセンサス情報は公開データとして設計されている可能性がありますが、middleware の `protectedRoutes` に `/themes` が含まれているため、ページアクセスは保護されています。ただし、APIエンドポイントは直接アクセス可能です。

**影響**: 未認証ユーザーがAPIを直接叩いてテーマデータやコンセンサス情報を取得できる。データ自体は公開情報であるため実害は小さい。

**推奨**: 現状維持で問題ないが、レート制限の追加を検討。

### S-3: /api/users/suggested での SQL IN 句の構築

**ファイル**: `src/app/api/users/suggested/route.ts:36`
**重大度**: 低

```typescript
.not("id", "in", `(${excludeIds.join(",")})`)
```

`excludeIds` はUUIDなので文字列としての注入リスクは非常に低いですが、Supabase の PostgREST フィルタを文字列結合で構築しているパターンです。万が一 `user.id` に不正な値が含まれていた場合に備え、UUID形式のバリデーションを追加するとより安全です。

### S-4: 既存セキュリティ修正の維持確認

以下の既存セキュリティ修正がすべて維持されていることを確認しました:

| 修正項目 | 状態 |
|---------|------|
| Open redirect防止（auth callback） | 維持 |
| httpOnly cookie（トークン管理） | 維持 |
| RLS: user_attributes SELECT制限 | 維持 |
| RLS: invite_codes UPDATE制限 | 維持 |
| RLS: notifications INSERT制限 | 維持 |
| SQL injection対策 | 維持 |
| Email enumeration防止 | 維持 |
| Middleware auth: getUser()使用 | 維持 |
| Rate limiting（invite code） | 維持 |
| Middleware: `/profile` がprotectedRoutesに追加済み | 確認済 |

---

## パフォーマンス (Performance)

### P-1: N+1クエリ問題 - /api/themes/featured, /api/themes/route.ts

**ファイル**: `src/app/api/themes/featured/route.ts:32-76`、`src/app/api/themes/route.ts:31-73`
**重大度**: 中

テーマごとに `Promise.all` 内で個別に `theme_posts`, `posts`, `reactions` テーブルを問い合わせています。テーマ数が10件あれば30回以上のDBクエリが発生します。

```typescript
// 各テーマに対して3クエリ発行
const enrichedThemes = await Promise.all(
  themes.map(async (theme) => {
    const { data: themePosts } = await supabase.from("theme_posts")...
    const { data: posts } = await supabase.from("posts")...
    const { data: reactions } = await supabase.from("reactions")...
  })
);
```

**修正案**: 全テーマのデータを一括取得してJavaScript側でグルーピングする。

```typescript
// 全テーマのtheme_postsを一括取得
const { data: allThemePosts } = await supabase
  .from("theme_posts")
  .select("theme_id, post_id")
  .in("theme_id", themeIds);

// 全投稿のreactionsを一括取得
const allPostIds = allThemePosts.map(tp => tp.post_id);
const { data: allReactions } = await supabase
  .from("reactions")
  .select("post_id, reaction_type")
  .in("post_id", allPostIds);

// JS側でグルーピング
```

### P-2: /api/users/me/position-map でのN+1クエリ

**ファイル**: `src/app/api/users/me/position-map/route.ts:79-108`
**重大度**: 中

テーマごとにリアクションを個別取得しています。

```typescript
for (const [themeId, postIds] of themePostMap) {
  const { data: reactions } = await supabase
    .from("reactions").select("reaction_type").in("post_id", postIds);
  // ...
}
```

**修正案**: 全postIdsを一括で取得し、JavaScript側で分割する。

### P-3: AppShell でのAPI呼び出し

**ファイル**: `src/components/layout/AppShell.tsx:19-22`
**重大度**: 低

AppShellコンポーネント（全ページで使用）で `position-map` APIを呼び出しています。同時に `Header.tsx` でも `echo-chamber` APIを呼び出しています。ページ遷移のたびに両方のAPIが再実行されます。

**推奨**: SWRやReact Queryなどのキャッシュライブラリを導入するか、Context APIでデータを共有して重複リクエストを防ぐ。

---

## 型安全性 (Type Safety)

### T-1: `any` 型の不使用を確認

全ファイルで明示的な `any` 型の使用は確認されませんでした。

### T-2: APIレスポンスの型不整合

**ファイル**: `src/app/(main)/explore/page.tsx:71-72`
**重大度**: 中

```typescript
const data = await apiFetch<ThemeItem[]>("/api/themes");
setThemes(data);
```

`/api/themes` のAPIレスポンスは `{ data: enrichedThemes, status: 200 }` 形式で返されるため、`apiFetch` が `data` フィールドを自動的にアンラップしている前提です。しかし `ThemeItem[]` としてキャストしていますが、APIが返す型には `postCount`, `participantCount`, `consensusScore` に加え、テーマの全フィールド（`start_date`, `end_date`, `created_at` 等）が含まれます。`ThemeItem` インターフェースに不足はないが、`start_date` が含まれていないためソート等で問題になる可能性があります。

### T-3: `isOwnPost` の判定ロジックが不正確

**ファイル**: `src/app/(main)/home/page.tsx:229`、`src/app/(main)/themes/[id]/page.tsx:401`、`src/app/(main)/explore/page.tsx:355`
**重大度**: 中

```typescript
isOwnPost={post.badCount !== undefined}
```

`isOwnPost` を `badCount` の存在で判定しています。これはAPIが自分の投稿の場合のみ `badCount` を返す実装に依存していますが、以下の問題があります:
- 意図が不明確（コメントがない）
- APIの実装が変わった場合に壊れる
- 他の投稿者の `badCount` が `0` の場合も `undefined` ではないため、誤判定の可能性がある

**修正案**: APIレスポンスに明示的な `isOwnPost` フィールドを追加するか、現在のユーザーIDとの比較で判定する。

---

## 既存機能との整合性 (Compatibility)

### I-1: BottomNav の `/profile` パスに対する middleware 保護

**ファイル**: `src/middleware.ts:14`
**確認結果**: 問題なし

`/profile` が `protectedRoutes` に追加済みであることを確認しました。`/profile` ページは Server Component で `redirect()` を使い、認証ユーザーのハンドルを取得してリダイレクトする実装になっており、正しく動作します。

### I-2: BottomNav の `/compose` パスの実装

**ファイル**: `src/components/layout/BottomNav.tsx:22`、`src/components/layout/Sidebar.tsx:123`
**重大度**: 低

BottomNav では `{ href: "/compose", ..., isCompose: true }` として定義し、`isCompose` フラグでモーダルを開く動作にしています。Sidebarでは `<Link href="/compose">` でリンクとして遷移します。`/compose` ページが実際に存在するか確認が必要です。

**確認結果**: `src/app/(main)/compose/` ディレクトリが存在します（git status で未追跡ファイル）。

### I-3: 探索ページのAPI応答形式

**ファイル**: `src/app/(main)/explore/page.tsx:118`
**重大度**: 低

`/api/users/suggested` のレスポンスは `{ data: { users: [...] }, status: 200 }` 形式ですが、フロントエンドは `apiFetch<UserItem[]>("/api/users/suggested")` で直接配列を期待しています。`apiFetch` が `data.users` ではなく `data` をアンラップする場合、配列ではなくオブジェクトが返され、表示されません。

**修正案**: APIレスポンス形式またはフロントエンドの型を合わせる。

### ~~I-4: スペクトラムAPI の `xAxisLabels` が活用されていない~~ (誤検出)

再確認の結果、`fetchSpectrum` は API レスポンスの `xAxisLabels` を `spectrumLabels` state にセットしており、テンプレートでも `spectrumLabels` を使用していました。問題ありません。

---

## コード品質 (Code Quality)

### Q-1: リアクション処理の重複

**ファイル**: 複数ページ（home, themes/[id], explore, users/[handle]）
**重大度**: 低

`handleReaction` 関数（オプティミスティック更新を含む）がほぼ同一のコードで4つのページに重複しています。カスタムフックとして抽出することを推奨。

### Q-2: 一貫性のない命名

- Sidebar: `navItems` で `/home` のラベルが「テーマ（ホーム）」
- BottomNav: `navItems` で `/home` のラベルが「テーマ」
- Header: タイトルが「テーマ」（home/page.tsx:162）

設計書では統一されているが、実装上は若干の揺れがあります。機能的な問題はなし。

### Q-3: `mapAttributes` のコード品質

**ファイル**: `src/lib/utils/mapAttributes.ts`

入力が `Record<string, string | null>` で出力がAttributeオブジェクト配列に変換していますが、ATTRIBUTE_LABELS 定数を参照せずに生の値をそのまま `value` として返しています。PostCardでのAttributeBadge表示に影響するか確認が必要です。

**確認結果**: ~~初版レビュー時は `mapAttributes` がDB値をそのまま返しており、PostCard内の属性バッジが英語表示になる問題がありました。~~

**修正済み**: frontend-engineer により `mapAttributes` に `ATTRIBUTE_LABELS` からの日本語変換処理が追加されました。現在は正しく日本語ラベルで表示されます。

---

## アクセシビリティ (Accessibility)

### A-1: AttributeLensBar のボタンにaria-label不足

**ファイル**: `src/components/filter/AttributeLensBar.tsx:108-127`
**重大度**: 低

フィルターチップのボタンに `aria-label` がなく、スクリーンリーダーではフィルターの意味が伝わりにくい。

### A-2: OpinionSpectrum のキーボード操作

**ファイル**: `src/components/theme/OpinionSpectrum.tsx`
**重大度**: 低

散布図のドットクリックはマウス操作のみ対応。キーボードでのナビゲーションは Recharts の制約上困難ですが、下部に「投稿一覧へ」のフォールバックリンクがあると望ましい。

### A-3: PositionMapMini の Link にaria-label不足

**ファイル**: `src/components/user/PositionMapMini.tsx:34`
**重大度**: 低

Link全体がクリック可能だが `aria-label` がないため、スクリーンリーダーでの操作性が低い。

---

## その他 (Minor)

### M-1: `hoveredId` state が未使用

**ファイル**: `src/components/theme/OpinionSpectrum.tsx:74`

`hoveredId` state が定義・更新されているが、レンダリングで使用されていない。

### M-2: ConsensusMeterMini の split による不安定なクラス分割

**ファイル**: `src/components/theme/ConsensusMeterMini.tsx:17`

```typescript
const [bgClass, textClass] = colorClass.split(" ");
```

`getScoreColor` が `"bg-consensus-high text-consensus-high"` のようにスペース区切りの2クラスを返し、`split(" ")` で分割しています。将来的にクラス追加で壊れる可能性があります。bgとtextを別々の関数で返す方が安全です。

---

## 指摘サマリー

| 重大度 | 件数 | 内容 |
|--------|------|------|
| ~~致命的~~ | ~~1~~ | ~~C-1: 誤検出（実際は修正済み）~~ |
| セキュリティ・中 | 1 | S-1: user_attributes RLS未対応（既知） |
| セキュリティ・低 | 2 | S-2: 認証チェック不足、S-3: IN句構築 |
| パフォーマンス・中 | 2 | P-1, P-2: N+1クエリ |
| パフォーマンス・低 | 1 | P-3: AppShell重複リクエスト |
| 型安全性・中 | 2 | T-2: 型不整合、T-3: isOwnPost判定 |
| 整合性・低 | 1 | I-3: API応答形式 |
| コード品質・低 | 2 | Q-1: 重複、Q-2: 命名（Q-3は修正済み） |
| アクセシビリティ・低 | 3 | A-1〜A-3 |
| その他 | 2 | M-1: 未使用state、M-2: split不安定 |

---

## 修正優先度

1. **リリース前に修正推奨**: T-3（isOwnPost判定）、I-3（ユーザー一覧表示）
2. **次スプリントで対応推奨**: P-1, P-2（N+1クエリ）、S-1（RLS）
3. **改善検討**: その他すべて

## 修正履歴

- C-1: 誤検出。実際のコードは `spectrumLabels` state を正しく使用していた。
- Q-3: frontend-engineer により `mapAttributes` に日本語変換処理が追加済み。
- I-4: 誤検出。`fetchSpectrum` は API レスポンスの `xAxisLabels` を正しく活用していた。
