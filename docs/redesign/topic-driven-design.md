# トピックドリブン化 + スライダーリアクション UI/UX設計書

**作成日**: 2026-02-09
**作成者**: UXデザイナー（ux-designer）
**ステータス**: 初版
**前提**: [ux-overhaul-v2.md](./ux-overhaul-v2.md) の用語変更を適用済みの状態を前提とする

---

## 目次

1. [変更概要](#1-変更概要)
2. [変更1: トピックドリブンなSNS](#2-変更1-トピックドリブンなsns)
3. [変更2: タイトル付き投稿](#3-変更2-タイトル付き投稿)
4. [変更3: スライダー式リアクション](#4-変更3-スライダー式リアクション)
5. [PostCard 新レイアウト総合設計](#5-postcard-新レイアウト総合設計)
6. [ComposeModal / ComposePanel 変更](#6-composemodal--composepanel-変更)
7. [スコア表示・集計の方針](#7-スコア表示集計の方針)
8. [既存機能への影響と移行](#8-既存機能への影響と移行)
9. [DB変更まとめ](#9-db変更まとめ)
10. [変更対象ファイル一覧](#10-変更対象ファイル一覧)

---

## 1. 変更概要

### 1.1 背景

現在の My Opinion は個別の「投稿」が流れるXライクなSNSだが、本来のコンセプトである「議論プラットフォーム」をより強調するため、以下3つの変更を行う。

### 1.2 変更一覧

| # | 変更 | 概要 | 影響範囲 |
|---|------|------|---------|
| 1 | トピックドリブン化 | 2chスレッドのようにトピック（議題）を中心に意見が集まる構造。ただしタイムラインに流れる | DB: posts.title追加、themes統合、フロント全般 |
| 2 | タイトル付き投稿 | postsにtitleカラム追加。タイトルあり=トピック、なし=通常の意見 | DB: posts, API, PostCard, ComposeModal |
| 3 | スライダーリアクション | Good/Bad二択を廃止し、0-100のスライダーで共感度を表現 | DB: reactions, API, PostCard, 分析ページ |

---

## 2. 変更1: トピックドリブンなSNS

### 2.1 概念整理

| 用語 | 定義 | DB上の実体 |
|------|------|-----------|
| **公式トピック** | 運営が作成する議題（現在の「テーマ」） | `themes` テーブル（変更なし） |
| **ユーザートピック** | ユーザーが立てるトピック（タイトル付き投稿） | `posts` テーブル（`title IS NOT NULL`） |
| **意見** | トピックに対する返信、または単独の発言 | `posts` テーブル（`title IS NULL`） |

### 2.2 トピックとスレッドの違い

2chスレッドとの重要な違いは以下の通り。

| 2chスレッド | My Opinion トピック |
|------------|-------------------|
| スレッドに「入る」（ページ遷移） | トピックがタイムラインに流れる |
| スレッド一覧は別画面 | トピックも意見も同じタイムラインに混在 |
| スレ主と回答者の区別なし | トピック（タイトル付き）と意見（返信）で視覚区別 |
| レス番号による参照 | parent_post_id による返信ツリー |

### 2.3 公式トピック（テーマ）の位置づけ変更

現在の `themes` テーブルは引き続き運営が管理する。UIでの表示を変更する。

| 現在 | 変更後 |
|------|--------|
| テーマ一覧ページ（`/themes`）にのみ表示 | タイムラインにも「公式トピック」としてカード表示 |
| テーマ詳細ページで投稿一覧を見る | テーマ詳細ページは引き続き存在するが、タイムラインからも直接返信可能 |
| テーマと投稿は別の世界観 | 公式トピックもユーザートピックも同列で流れる |

### 2.4 タイムラインの構成

タイムラインには以下の3種類のカードが混在して表示される。

```
[タイムライン]
├── 公式トピックカード（themes由来、ピン留めまたは上位表示）
├── ユーザートピックカード（title付きpost）
└── 意見カード（titleなしpost）
```

#### ソート順
- デフォルト: 新着順（`created_at DESC`）
- 公式トピック（`themes`）は `start_date` が当日以降のものをタイムライン上部にハイライト表示
- ユーザートピックと意見は時系列で混在

### 2.5 ユーザートピックの投稿フロー

1. ユーザーが ComposeModal を開く
2. タイトル入力欄が追加されている（任意）
3. タイトルを入力 -> トピック投稿
4. タイトルなし -> 通常の意見投稿
5. トピック投稿はタイムラインで目立つカード表示
6. 他のユーザーはトピックに対して返信（`parent_post_id` = トピックのpost ID）

### 2.6 トピックへの返信

- トピックカードをタップ -> 投稿詳細ページ（`/posts/[id]`）に遷移
- 詳細ページで返信一覧と返信入力フォームを表示
- 返信は `posts` テーブルに `parent_post_id` = トピックのID で保存
- 既存の返信機能をそのまま活用（変更不要）

---

## 3. 変更2: タイトル付き投稿

### 3.1 DB変更

```sql
ALTER TABLE posts ADD COLUMN title TEXT DEFAULT NULL;
-- title が NULL でない投稿 = トピック投稿
-- title が NULL の投稿 = 通常の意見
```

### 3.2 型定義の変更

```typescript
// src/types/database.ts

/** posts テーブル */
export type Post = {
  id: string;
  user_id: string;
  title: string | null;        // 追加
  content: string;
  parent_post_id: string | null;
  repost_of_id: string | null;
  created_at: string;
  updated_at: string;
};

export type PostInsert = {
  id?: string;
  user_id: string;
  title?: string | null;       // 追加
  content: string;
  parent_post_id?: string | null;
  repost_of_id?: string | null;
};

// PostUpdate は content の Partial なので、title も追加
export type PostUpdate = Partial<Pick<Post, 'content' | 'title'>>;
```

### 3.3 タイトルのバリデーション

| 項目 | 仕様 |
|------|------|
| 最大文字数 | 60文字 |
| 最小文字数 | 1文字（入力した場合） |
| 必須/任意 | 任意（空の場合はNULLとして保存） |
| 使用可能文字 | 制限なし（絵文字含む） |

### 3.4 API変更

#### POST /api/posts
リクエストボディに `title` フィールドを追加。

```typescript
// 現在
{ content: string; themeId?: string }
// 変更後
{ title?: string; content: string; themeId?: string }
```

バリデーション:
- `title` が指定され空でない場合: 60文字以内であることを確認
- `title` が空文字列の場合: NULLとして保存
- `parent_post_id` がある場合（返信）: `title` は無視（返信にはタイトル不可）

#### GET /api/timeline/* , GET /api/posts/[id]
レスポンスに `title` フィールドを追加。

```typescript
// PostCard向けレスポンスに title を含める
{
  id: string;
  title: string | null;   // 追加
  content: string;
  // ...
}
```

---

## 4. 変更3: スライダー式リアクション

### 4.1 コンセプト

Good/Bad の二択を廃止し、連続的なスライダーで共感度を表現する。

- 左端: 異論（0）
- 右端: 共感（100）
- 中間: 微妙な立場を表現可能

視覚的には両端に顔のアイコンを配置し、スライダーのつまみをドラッグして位置を決める。

### 4.2 スライダーUI仕様

#### 4.2.1 レイアウト

```
  [異論の顔]  |=====[つまみ]==========|  [共感の顔]
              0                      100
         ガッカリ                    ニッコリ
```

#### 4.2.2 両端のアイコン

| 位置 | アイコン | 意味 | 色 |
|------|---------|------|-----|
| 左端（0） | 顔文字（Frown / Meh系） | 異論・ガッカリ | `text-rose-400` |
| 右端（100） | 顔文字（Smile系） | 共感・ニッコリ | `text-emerald-400` |

Lucide アイコン候補:
- 左端: `Frown` または `Meh`（lucide-react）
- 右端: `Smile`（lucide-react）

#### 4.2.3 スライダートラック

```
幅: 100%（アイコン間のスペースいっぱい）
高さ: 6px（トラック部分）
角丸: rounded-full

グラデーション: 左から右へ
  0%   → rose-400 (#fb7185)
  50%  → amber-300 (#fcd34d)
  100% → emerald-400 (#34d399)

背景（未選択時）: bg-muted（グレー）
```

#### 4.2.4 つまみ（Thumb）

```
サイズ: 24x24px (h-6 w-6)
形状: rounded-full
背景: bg-background
ボーダー: border-2 border-primary
影: shadow-md
ホバー: scale-110, shadow-lg
ドラッグ中: scale-115, shadow-xl, ring-2 ring-primary/30
```

#### 4.2.5 操作方法

| 操作 | 挙動 |
|------|------|
| ドラッグ | つまみを左右にスライドしてスコアを設定 |
| タップ/クリック | トラック上の位置にスコアをジャンプ設定 |
| ドラッグ開始 | つまみが拡大、影が濃くなるアニメーション |
| ドラッグ中 | リアルタイムでグラデーション色が変化、スコア数値をつまみ上にポップアップ表示 |
| ドラッグ終了 | APIにスコアを送信、つまみが元のサイズに戻る |
| リアクション済み | トラックにグラデーションが塗られ、つまみが該当位置に表示される |
| リアクション取消 | つまみをダブルタップ/ダブルクリックでリアクションを取り消し |

#### 4.2.6 スコアポップアップ（ドラッグ中）

ドラッグ中、つまみの上にスコアを表示するツールチップが出る。

```
      ┌──────┐
      │  72  │   ← スコア数値
      └──┬───┘
         │
      [つまみ]
```

```
位置: つまみの上方 8px
サイズ: px-2 py-0.5
背景: bg-foreground
テキスト: text-background text-xs font-bold
角丸: rounded-md
アニメーション: ドラッグ開始時にfade-in-up、終了時にfade-out
```

#### 4.2.7 アニメーション仕様

| アニメーション | トリガー | 仕様 |
|------------|---------|------|
| つまみスケール | ドラッグ開始/終了 | `transform: scale(1.15)` duration-150 ease-out |
| ポップアップ表示 | ドラッグ開始 | `opacity: 0->1, translateY: 4px->0` duration-150 |
| ポップアップ非表示 | ドラッグ終了 | `opacity: 1->0` duration-100 |
| トラック色変化 | スコア変更時 | グラデーション位置がリアルタイムに変化（CSS変数で制御） |
| 送信確定 | ドラッグ終了（API送信） | つまみに一瞬リングアニメーション（`ring-2 ring-primary/50` fade-out 300ms） |

#### 4.2.8 未リアクション状態

```
  [Frown(灰)]  |========================|  [Smile(灰)]
               灰色のトラック（グラデーションなし）
```

- アイコンは `text-muted-foreground/40`
- トラックは `bg-muted`
- つまみは非表示
- ホバー時にトラックがやや明るくなり「スライドして評価」のヒントテキストが表示

#### 4.2.9 リアクション済み状態

```
  [Frown(色)]  |=====★==================|  [Smile(色)]
               ^     ^つまみ位置(72)
               グラデーション（0から72まで塗る）
```

- アイコンの色はスコアに応じて変化
  - 0-30: 左のFrownが `text-rose-400`、右のSmileは `text-muted-foreground/40`
  - 31-69: 両方やや色付き（Frown: `text-amber-400`, Smile: `text-amber-400`）
  - 70-100: 左のFrownは `text-muted-foreground/40`、右のSmileが `text-emerald-400`
- トラックは0からスコア位置までグラデーション塗り、残りは `bg-muted`
- つまみがスコア位置に表示

### 4.3 DB変更

#### 4.3.1 reactions テーブル

```sql
-- reaction_type カラムを reaction_score に変更
ALTER TABLE reactions DROP COLUMN reaction_type;
ALTER TABLE reactions ADD COLUMN reaction_score INTEGER NOT NULL CHECK (reaction_score >= 0 AND reaction_score <= 100);
```

#### 4.3.2 型定義の変更

```typescript
// src/types/database.ts

// 削除
// export type ReactionType = 'good' | 'bad';

// 追加（ReactionType を削除し、スコアベースに）

/** reactions テーブル */
export type Reaction = {
  id: string;
  user_id: string;
  post_id: string;
  reaction_score: number;     // 0-100 整数（0=異論, 100=共感）
  reactor_attribute_snapshot: ReactorAttributeSnapshot | null;
  created_at: string;
};

export type ReactionInsert = {
  id?: string;
  user_id: string;
  post_id: string;
  reaction_score: number;     // 0-100
  reactor_attribute_snapshot?: ReactorAttributeSnapshot | null;
};

// Database型のreactions
// Update: reaction_score のみ更新可能
reactions: {
  Row: Reaction;
  Insert: ReactionInsert;
  Update: Partial<Pick<Reaction, 'reaction_score'>>;
  Relationships: [];
};
```

#### 4.3.3 NotificationType の変更

```typescript
// 'good' を 'reaction' に変更
export type NotificationType =
  | 'reply'
  | 'follow'
  | 'reaction'        // 旧: 'good'
  | 'theme_start'
  | 'analysis_ready';
```

### 4.4 API変更

#### POST /api/posts/[id]/reactions

```typescript
// 現在のリクエスト
{ reactionType: "good" | "bad" }

// 変更後のリクエスト
{ reactionScore: number }  // 0-100 の整数
```

バリデーション:
- `reactionScore` が整数であること
- 0 以上 100 以下であること
- 既存リアクションがある場合: スコアを更新
- 新規リアクションの場合: 挿入

レスポンス:
```typescript
// 変更後
{
  data: {
    message: string;
    reactionScore: number | null;  // null = 取り消し
  };
  status: number;
}
```

#### DELETE /api/posts/[id]/reactions
変更なし（リアクション取り消し）。

#### GET系API（タイムライン、投稿詳細等）

レスポンスの変更:

```typescript
// 現在
{
  goodCount: number;
  badCount?: number;
  currentUserReaction: "good" | "bad" | null;
}

// 変更後
{
  reactionCount: number;          // リアクション総数
  averageScore: number | null;    // 平均スコア（0-100, リアクション0件ならnull）
  currentUserScore: number | null; // 現在のユーザーのスコア（null=未リアクション）
}
```

### 4.5 PostCard props の変更

```typescript
// 現在
interface PostCardProps {
  goodCount: number;
  badCount?: number;
  userReaction?: "good" | "bad" | null;
  onGood?: () => void;
  onBad?: () => void;
  // ...
}

// 変更後
interface PostCardProps {
  title?: string | null;               // 変更2: タイトル追加
  reactionCount: number;               // リアクション総数
  averageScore: number | null;         // 平均スコア
  currentUserScore: number | null;     // ユーザーのスコア
  onReaction?: (score: number) => void;       // スライダーで確定時
  onReactionRemove?: () => void;              // リアクション取消時
  // goodCount, badCount, userReaction, onGood, onBad は削除
  // ...その他は維持
}
```

---

## 5. PostCard 新レイアウト総合設計

3つの変更をすべて統合した PostCard の最終レイアウト。

### 5.1 レイアウト構造

#### トピック投稿（title あり）

```
+-------------------------------------------------------+
| [公式]  or  [ユーザートピック]                            |
|                                                       |
| タイトルテキスト（太字、大きめ）                           |
| ────────────────────────────────────────────           |
| 本文テキスト（通常サイズ）                                |
|                                                       |
+-------------------------------------------------------+
| [30代] [会社員] [やや左派]    ← バックグラウンドタグ       |
+-------------------------------------------------------+
| [avatar] 表示名 · 3分前                   [...]        |
+-------------------------------------------------------+
| [Frown] |=====[つまみ]==========| [Smile]  平均72      |
|         ← スライダーリアクション →         128件         |
+-------------------------------------------------------+
| 返信 12    リポスト 3              [レスポンス分析]       |
+-------------------------------------------------------+
```

#### 通常の意見（title なし）

```
+-------------------------------------------------------+
| [トピック名ラベル（テーマ紐づき時）]                       |
|                                                       |
| 本文テキスト                                            |
|                                                       |
+-------------------------------------------------------+
| [30代] [会社員] [やや左派]                              |
+-------------------------------------------------------+
| [avatar] 表示名 · 3分前                   [...]        |
+-------------------------------------------------------+
| [Frown] |=====[つまみ]==========| [Smile]  平均72      |
|         ← スライダーリアクション →         128件         |
+-------------------------------------------------------+
| 返信 12    リポスト 3              [レスポンス分析]       |
+-------------------------------------------------------+
```

### 5.2 トピック投稿のスタイル差別化

トピック投稿（タイトルあり）は通常の意見と視覚的に区別する。

| 要素 | トピック投稿 | 通常の意見 |
|------|------------|-----------|
| 上部ラベル | 「公式トピック」（themes由来）or 表示なし | テーマ名ラベル（紐づき時） |
| タイトル | `text-base font-bold leading-snug` で表示 | なし |
| タイトルと本文の間 | 薄い区切り線 `border-b border-border/40 pb-2 mb-2` | なし |
| カード背景 | 若干異なる背景 `bg-card` のまま（差別化は上部ラベルとタイトルで十分） | `bg-card` |
| 返信数の強調 | 返信数が多い場合は `font-semibold text-primary` | 通常表示 |

#### 公式トピックラベル

テーマ（themes テーブル）に紐づくトピックには「公式」バッジを表示。

```tsx
{isOfficialTopic && (
  <div className="mb-2">
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
      公式トピック
    </span>
  </div>
)}
```

### 5.3 タイトル表示の仕様

```tsx
{/* タイトル（トピック投稿時のみ） */}
{title && (
  <div className="mb-2">
    <h3 className="text-base font-bold leading-snug text-foreground">
      {title}
    </h3>
    <div className="mt-2 border-b border-border/40" />
  </div>
)}
```

タイトルテキスト仕様:
- フォントサイズ: `text-base`（16px）
- ウェイト: `font-bold`
- 行間: `leading-snug`
- 色: `text-foreground`
- 最大行数: 制限なし（60文字以内なので2行程度に収まる）

### 5.4 スライダーリアクション部分の詳細

Good/Bad ボタンを廃止し、スライダーに置き換える。

```tsx
{/* スライダーリアクション */}
<div className="mt-3">
  <div className="flex items-center gap-2">
    {/* 異論アイコン */}
    <Frown className={cn(
      "h-5 w-5 shrink-0 transition-colors",
      currentUserScore !== null && currentUserScore <= 30
        ? "text-rose-400"
        : currentUserScore !== null && currentUserScore <= 69
          ? "text-amber-400/60"
          : "text-muted-foreground/40"
    )} />

    {/* スライダートラック */}
    <div className="relative flex-1">
      <ReactionSlider
        value={currentUserScore}
        onChange={onReaction}
        onRemove={onReactionRemove}
      />
    </div>

    {/* 共感アイコン */}
    <Smile className={cn(
      "h-5 w-5 shrink-0 transition-colors",
      currentUserScore !== null && currentUserScore >= 70
        ? "text-emerald-400"
        : currentUserScore !== null && currentUserScore >= 31
          ? "text-amber-400/60"
          : "text-muted-foreground/40"
    )} />
  </div>

  {/* スコアサマリー */}
  <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
    <span>
      {reactionCount > 0 ? `平均 ${averageScore}` : ""}
    </span>
    <span>
      {reactionCount > 0 ? `${reactionCount}件` : "スライドして評価"}
    </span>
  </div>
</div>
```

### 5.5 ReactionSlider コンポーネント仕様

新規コンポーネント: `src/components/post/ReactionSlider.tsx`

```typescript
interface ReactionSliderProps {
  value: number | null;             // 現在のスコア（null=未リアクション）
  onChange?: (score: number) => void;  // スコア確定時のコールバック
  onRemove?: () => void;           // リアクション取り消し
  disabled?: boolean;               // 無効化（自分の投稿等）
  showAverage?: boolean;            // 平均スコアマーカーを表示
  averageScore?: number | null;     // 平均スコア
}
```

#### 実装のポイント

1. **タッチ対応**: `onTouchStart`, `onTouchMove`, `onTouchEnd` で実装。`pointer-events` でマウスとタッチの両方をサポート。
2. **スナップなし**: 連続値（0-100整数）。スナップポイントは設けない。
3. **debounce**: ドラッグ中はUIのみ更新。ドラッグ終了時にAPIコールを1回だけ発火。
4. **初回タップ**: トラック上をタップした位置にスコアをセット（つまみがその位置に移動）。
5. **ダブルタップ取消**: つまみをダブルタップ/ダブルクリックすると `onRemove` を呼び出しリアクションを取り消す。視覚的にリセットアニメーション。

#### Tailwind実装例（トラック部分）

```tsx
<div className="relative h-6 w-full touch-none select-none">
  {/* トラック背景（灰色） */}
  <div className="absolute top-1/2 left-0 right-0 h-1.5 -translate-y-1/2 rounded-full bg-muted" />

  {/* トラック塗り（グラデーション、スコアまで） */}
  {value !== null && (
    <div
      className="absolute top-1/2 left-0 h-1.5 -translate-y-1/2 rounded-full"
      style={{
        width: `${value}%`,
        background: `linear-gradient(to right, #fb7185, #fcd34d ${Math.min(value * 2, 100)}%, #34d399)`,
      }}
    />
  )}

  {/* 平均スコアマーカー（細い線） */}
  {averageScore !== null && (
    <div
      className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded-full bg-foreground/30"
      style={{ left: `${averageScore}%` }}
      title={`平均: ${averageScore}`}
    />
  )}

  {/* つまみ */}
  {value !== null && (
    <div
      className={cn(
        "absolute top-1/2 h-6 w-6 -translate-x-1/2 -translate-y-1/2 rounded-full",
        "border-2 border-primary bg-background shadow-md",
        "transition-transform duration-150 ease-out",
        isDragging && "scale-115 shadow-xl ring-2 ring-primary/30"
      )}
      style={{ left: `${value}%` }}
    >
      {/* ドラッグ中のスコアポップアップ */}
      {isDragging && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 rounded-md bg-foreground px-2 py-0.5 text-xs font-bold text-background animate-in fade-in slide-in-from-bottom-1">
          {value}
        </div>
      )}
    </div>
  )}
</div>
```

### 5.6 アクションバーの変更

Good/Bad ボタンを削除し、スライダーをカード内に組み込むため、アクションバーはシンプルになる。

```tsx
{/* アクションバー（スライダーの下） */}
<div className="-ml-2 mt-2 flex items-center gap-4">
  {/* 返信ボタン */}
  <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
    <Link href={`/posts/${id}`}>
      <MessageCircle className="h-4 w-4" />
      {replyCount > 0 && <span className="text-xs">{replyCount}</span>}
    </Link>
  </Button>

  {/* リポストボタン */}
  <Button variant="ghost" size="sm" ...>
    <Repeat2 className="h-4 w-4" />
    {repostCount > 0 && <span className="text-xs">{repostCount}</span>}
  </Button>

  {/* 分析（本人のみ） */}
  {isOwnPost && (
    <Button variant="ghost" size="sm" className="ml-auto gap-1.5" asChild>
      <Link href={`/posts/${id}/analysis`}>
        <BarChart3 className="h-4 w-4" />
        <span className="text-xs">レスポンス分析</span>
      </Link>
    </Button>
  )}
</div>
```

### 5.7 PostCard 総合レイアウトのTailwind実装

```tsx
<article className="border-b bg-card transition-all duration-200 hover:bg-accent/30">
  <div className="px-4 pt-4 pb-3">

    {/* リポスト表示 */}
    {repostedBy && (
      <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
        <Repeat2 className="h-4 w-4" />
        <span>{repostedBy} がリポスト</span>
      </div>
    )}

    {/* 公式トピックラベル or テーマ名ラベル */}
    {isOfficialTopic ? (
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
          公式トピック
        </span>
      </div>
    ) : themeName ? (
      <div className="mb-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-0.5 text-xs font-medium text-primary">
          {themeName}
        </span>
      </div>
    ) : null}

    {/* タイトル（トピック投稿時） */}
    {title && (
      <div className="mb-2 cursor-pointer" onClick={() => router.push(`/posts/${id}`)}>
        <h3 className="text-base font-bold leading-snug text-foreground">
          {title}
        </h3>
        <div className="mt-2 border-b border-border/40" />
      </div>
    )}

    {/* 本文 */}
    <div onClick={() => router.push(`/posts/${id}`)} className="cursor-pointer">
      <PostContent
        content={content}
        className="text-[15px] leading-relaxed whitespace-pre-wrap break-words"
      />
    </div>

    {/* バックグラウンドタグ */}
    {author.attributes && author.attributes.length > 0 && (
      <div className="mt-3 flex flex-wrap gap-1.5">
        {author.attributes.map((attr) => (
          <AttributeBadge key={attr.type} type={attr.type} value={attr.value} size="md" />
        ))}
      </div>
    )}

    {/* 著者行（控えめ） */}
    <div className="mt-3 flex items-center gap-2">
      <Link href={`/users/${author.handle}`} className="shrink-0">
        <UserAvatar src={author.avatarUrl} displayName={author.displayName} size="xs" />
      </Link>
      <Link
        href={`/users/${author.handle}`}
        className="text-xs text-muted-foreground hover:text-foreground hover:underline"
      >
        {author.displayName} · {formatRelativeTime(createdAt)}
      </Link>
      <div className="ml-auto shrink-0">
        {/* DropdownMenu（既存） */}
      </div>
    </div>

    {/* スライダーリアクション */}
    <div className="mt-3">
      <ReactionSlider
        value={currentUserScore}
        onChange={onReaction}
        onRemove={onReactionRemove}
        averageScore={averageScore}
        showAverage={reactionCount > 0}
        disabled={isOwnPost}
      />
      <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
        <span>{reactionCount > 0 ? `平均 ${averageScore}` : ""}</span>
        <span>{reactionCount > 0 ? `${reactionCount}件` : "スライドして評価"}</span>
      </div>
    </div>

    {/* アクションバー */}
    <div className="-ml-2 mt-2 flex items-center gap-4">
      {/* 返信 */}
      <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" asChild>
        <Link href={`/posts/${id}`}>
          <MessageCircle className="h-4 w-4" />
          {replyCount > 0 && <span className="text-xs">{replyCount}</span>}
        </Link>
      </Button>
      {/* リポスト */}
      <Button variant="ghost" size="sm" disabled={isOwnPost || !onRepost} ...>
        <Repeat2 className="h-4 w-4" />
        {repostCount > 0 && <span className="text-xs">{repostCount}</span>}
      </Button>
      {/* 分析 */}
      {isOwnPost && (
        <Button variant="ghost" size="sm" className="ml-auto gap-1.5" asChild>
          <Link href={`/posts/${id}/analysis`}>
            <BarChart3 className="h-4 w-4" />
            <span className="text-xs">レスポンス分析</span>
          </Link>
        </Button>
      )}
    </div>
  </div>

  {/* ReportModal, RepostConfirmDialog は既存を維持 */}
</article>
```

---

## 6. ComposeModal / ComposePanel 変更

### 6.1 ComposeModal の変更

タイトル入力欄を追加。返信時はタイトル入力欄を非表示にする。

#### 6.1.1 props 変更

```typescript
interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (content: string, title?: string, themeId?: string) => void | Promise<void>;
  // title パラメータを追加
  replyTo?: { id: string; author: string };
  defaultThemeId?: string;
  defaultThemeName?: string;
}
```

#### 6.1.2 タイトル入力欄のレイアウト

```
+-----------------------------------------------+
| [アクセントライン]                                |
|                                               |
| [あなたの意見]   or   [返信先: @user]            |
| [# テーマ名（紐づき時）]                          |
|                                               |
| タイトル（任意）         [0/60]                  |
| ───────────────────────                        |
| 本文テキストエリア                                |
|                                               |
| [文字数リング] [⌘+Enter]          [送信ボタン]    |
+-----------------------------------------------+
```

#### 6.1.3 タイトル入力の実装

```tsx
{/* タイトル入力（返信時は非表示） */}
{!replyTo && (
  <div className="px-5 pb-0">
    <input
      type="text"
      placeholder="タイトル（任意）"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
      maxLength={60}
      className={cn(
        "w-full bg-transparent text-base font-bold",
        "placeholder:text-muted-foreground/40",
        "focus:outline-none",
        "border-b border-border/40 pb-2"
      )}
    />
    {title.length > 0 && (
      <div className="mt-1 text-right text-[11px] text-muted-foreground/60">
        {title.length}/60
      </div>
    )}
  </div>
)}
```

入力欄の仕様:
- フォント: `text-base font-bold`（PostCardのタイトル表示と同じ太さ）
- プレースホルダー: 「タイトル（任意）」
- 最大文字数: 60文字（`maxLength` 属性）
- 文字数カウンター: 入力がある場合のみ右下に表示
- 区切り線: 入力欄の下に `border-b border-border/40`

#### 6.1.4 送信ロジックの変更

```typescript
async function handleSubmit() {
  if (isEmpty || isOverLimit || isSubmitting) return;
  setIsSubmitting(true);
  try {
    const trimmedTitle = title.trim() || undefined;
    await onSubmit?.(content.trim(), trimmedTitle, defaultThemeId);
    setContent("");
    setTitle("");
    // ... success animation
  } catch {
    toast.error("投稿に失敗しました");
  } finally {
    setIsSubmitting(false);
  }
}
```

#### 6.1.5 タイトル入力時のヒント

タイトルに文字を入力し始めると、入力欄の下にヒントテキストを表示。

```tsx
{title.length > 0 && !replyTo && (
  <p className="px-5 mt-1 text-[11px] text-muted-foreground/50">
    タイトルを入力するとトピック投稿になります
  </p>
)}
```

### 6.2 ComposePanel の変更

`ComposePanel`（ホーム画面のインライン投稿フォーム）にも同様のタイトル入力欄を追加。

```tsx
{/* ComposePanel にタイトル入力を追加 */}
<input
  type="text"
  placeholder="タイトル（任意）"
  value={title}
  onChange={(e) => setTitle(e.target.value)}
  maxLength={60}
  className="w-full bg-transparent text-base font-bold placeholder:text-muted-foreground/40 focus:outline-none border-b border-border/40 pb-2 mb-2"
/>
```

送信時にタイトルを含めるよう `handleSubmit` を更新。

---

## 7. スコア表示・集計の方針

### 7.1 平均スコア表示

各投稿のリアクションスコアは **平均値** をメインの指標として表示する。

| 表示箇所 | 表示内容 | 形式 |
|---------|---------|------|
| PostCard | 平均スコア + リアクション件数 | `平均 72  128件` |
| 投稿詳細ページ | 同上 + スコア分布 | グラフ付き |
| テーマ詳細 | テーマ内投稿の平均スコア | 一致度メーター（既存ConsensusMeter改修） |

### 7.2 スコア分布表示（分析ページ）

Good/Bad のパイチャートを、スコア分布のヒストグラムに変更。

#### 7.2.1 ヒストグラム仕様

```
[スコア分布]

件数
 |
 |      ■■
 |   ■■ ■■ ■■
 |■■ ■■ ■■ ■■ ■■
 +---+---+---+---+---→ スコア
  0-20 21-40 41-60 61-80 81-100
  異論               共感
```

- 5つのビン（0-20, 21-40, 41-60, 61-80, 81-100）
- バーの色はスコア帯に応じたグラデーション
  - 0-20: `#fb7185`（rose-400）
  - 21-40: `#f59e0b`（amber-500）
  - 41-60: `#fcd34d`（amber-300）
  - 61-80: `#6ee7b7`（emerald-300）
  - 81-100: `#34d399`（emerald-400）

#### 7.2.2 分析ページの変更概要

| 現在のセクション | 変更後 |
|---------------|--------|
| 共感 / 異論 比率（パイチャート） | スコア分布（ヒストグラム） |
| 読み手のプロフィール分布 | 変更なし（構造同じ） |
| 立場 x 評価 の内訳（Good/Bad積み上げ棒グラフ） | 立場 x スコア の内訳（平均スコア横棒グラフ） |

#### 7.2.3 立場 x スコア の内訳

Good/Bad の積み上げ棒グラフを、属性ごとの平均スコアを示す横棒グラフに変更。

```
[立場 x スコア の内訳]

性別:
  男性    |████████████████████░░░░░░|  72
  女性    |██████████████░░░░░░░░░░░░|  58
  その他  |█████████████████████████░|  94

年齢帯:
  18-24   |████████████████████░░░░░░|  72
  ...
```

バーの色はスコアに応じたグラデーション（スライダーと同じ配色）。

### 7.3 ConsensusMeter への影響

`ConsensusMeter` は「意見の一致度」を表示するコンポーネント。計算方法を変更。

| 現在 | 変更後 |
|------|--------|
| Good比率の偏りで一致度を計算 | スコアの標準偏差で一致度を計算 |
| 0-100%の範囲 | 0-100%の範囲（標準偏差を反転してスコア化） |

計算式:
```
一致度 = max(0, 100 - standardDeviation * 3)
```
- 標準偏差0（全員同じスコア）→ 一致度100%
- 標準偏差33以上（バラバラ）→ 一致度0%

### 7.4 OpinionSpectrum（意見マップ）への影響

Y軸を「共感率」から「平均スコア」に変更。

| 現在 | 変更後 |
|------|--------|
| Y軸: Good率 % (0-100) | Y軸: 平均スコア (0-100) |
| ツールチップ: 共感 12, 異論 3 | ツールチップ: 平均スコア 72, リアクション 15件 |

---

## 8. 既存機能への影響と移行

### 8.1 データマイグレーション

既存の `reaction_type` データを `reaction_score` に変換する。

```sql
-- マイグレーション: reaction_type -> reaction_score
ALTER TABLE reactions ADD COLUMN reaction_score INTEGER;

-- good = 80, bad = 20 として変換（中間値ではなく偏った値に）
UPDATE reactions SET reaction_score = CASE
  WHEN reaction_type = 'good' THEN 80
  WHEN reaction_type = 'bad' THEN 20
END;

-- NOT NULL制約を追加
ALTER TABLE reactions ALTER COLUMN reaction_score SET NOT NULL;
ALTER TABLE reactions ADD CONSTRAINT reaction_score_range CHECK (reaction_score >= 0 AND reaction_score <= 100);

-- 旧カラムを削除
ALTER TABLE reactions DROP COLUMN reaction_type;
```

good を 80、bad を 20 にマッピングする理由:
- 100/0 だと極端すぎて分布が歪む
- 80/20 であれば「強い共感/強い異論」として自然

### 8.2 通知の変更

| 現在 | 変更後 |
|------|--------|
| 通知タイプ `'good'` | 通知タイプ `'reaction'` |
| 「{user}さんがあなたの意見に共感しました」 | 「{user}さんがあなたの意見にリアクションしました」 |

通知を送るタイミング:
- 新しいリアクション（INSERT）時のみ通知
- スコア更新（UPDATE）時は通知しない
- 取り消し（DELETE）時は通知しない

### 8.3 RLS ポリシーへの影響

`reactions` テーブルのRLSポリシーに変更は不要。カラム名が変わるだけで、行レベルのアクセス制御ロジックは同じ。

### 8.4 エコーチェンバー（視野チェック）スコア計算

現在のエコーチェンバースコアは `reaction_type` の偏りで計算しているが、`reaction_score` に変更後は以下のように計算。

```
各トピック/テーマについて:
  - ユーザーのリアクションスコアの平均を取る
  - 全ユーザーの平均との差分を計算
  - 差分が大きい = 偏りが大きい
```

APIの計算ロジックの詳細はバックエンドエンジニアに委ねる。

---

## 9. DB変更まとめ

### 9.1 posts テーブル

```sql
ALTER TABLE posts ADD COLUMN title TEXT DEFAULT NULL;
-- title が NULL でない = トピック投稿
-- title が NULL = 通常の意見/返信
-- CHECK: title の長さ <= 60
ALTER TABLE posts ADD CONSTRAINT posts_title_length CHECK (title IS NULL OR char_length(title) <= 60);
```

### 9.2 reactions テーブル

```sql
-- 新カラム追加
ALTER TABLE reactions ADD COLUMN reaction_score INTEGER;

-- データマイグレーション
UPDATE reactions SET reaction_score = CASE
  WHEN reaction_type = 'good' THEN 80
  WHEN reaction_type = 'bad' THEN 20
END;

-- 制約追加
ALTER TABLE reactions ALTER COLUMN reaction_score SET NOT NULL;
ALTER TABLE reactions ADD CONSTRAINT reaction_score_range CHECK (reaction_score >= 0 AND reaction_score <= 100);

-- 旧カラム削除
ALTER TABLE reactions DROP COLUMN reaction_type;
```

### 9.3 notifications テーブル

`type` カラムのCHECK制約を更新（`'good'` -> `'reaction'`）。

```sql
-- 既存データのマイグレーション
UPDATE notifications SET type = 'reaction' WHERE type = 'good';

-- CHECK制約の更新（DBエンジンに応じた構文）
ALTER TABLE notifications DROP CONSTRAINT notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('reply', 'follow', 'reaction', 'theme_start', 'analysis_ready'));
```

### 9.4 型定義変更一覧（`src/types/database.ts`）

| 変更 | 詳細 |
|------|------|
| `ReactionType` 型を削除 | `'good' \| 'bad'` は不要 |
| `Post` 型に `title` 追加 | `title: string \| null` |
| `PostInsert` に `title` 追加 | `title?: string \| null` |
| `PostUpdate` に `title` 追加 | `Partial<Pick<Post, 'content' \| 'title'>>` |
| `Reaction` 型の `reaction_type` を `reaction_score` に | `reaction_score: number` (0-100) |
| `ReactionInsert` の `reaction_type` を `reaction_score` に | `reaction_score: number` |
| `NotificationType` の `'good'` を `'reaction'` に | |
| `Database` 型の `reactions.Update` | `Partial<Pick<Reaction, 'reaction_score'>>` |

---

## 10. 変更対象ファイル一覧

### 10.1 型定義

```
src/types/database.ts          -- Post, Reaction, NotificationType, 関連Insert/Update型すべて
src/types/index.ts             -- re-exportの更新（必要に応じて）
```

### 10.2 API（バックエンド）

```
src/app/api/posts/route.ts                    -- POST: title パラメータ追加
src/app/api/posts/[id]/route.ts               -- GET: titleフィールド返却
src/app/api/posts/[id]/reactions/route.ts      -- POST: reactionType -> reactionScore
                                              -- DELETE: 変更なし
src/app/api/posts/[id]/analysis/route.ts       -- レスポンス構造変更（スコア分布）
src/app/api/timeline/home/route.ts             -- レスポンスにtitle追加, goodCount/badCount -> reactionCount/averageScore
src/app/api/timeline/explore/route.ts          -- 同上
src/app/api/timeline/theme/[id]/route.ts       -- 同上
src/app/api/themes/[id]/consensus/route.ts     -- 計算ロジック変更（標準偏差ベース）
src/app/api/themes/[id]/spectrum/route.ts      -- Y軸データ変更（Good率 -> 平均スコア）
src/app/api/notifications/route.ts             -- type: 'good' -> 'reaction'
```

### 10.3 コンポーネント

```
src/components/post/PostCard.tsx               -- 大幅変更: タイトル表示、スライダー組込、Good/Badボタン削除
src/components/post/ReactionSlider.tsx         -- 新規: スライダーコンポーネント
src/components/post/ComposeModal.tsx           -- タイトル入力欄追加、onSubmit引数変更
src/components/post/ComposePanel.tsx           -- タイトル入力欄追加
src/components/theme/ConsensusMeter.tsx        -- 計算表示の変更
src/components/theme/ConsensusMeterMini.tsx    -- 同上
src/components/theme/OpinionSpectrum.tsx       -- Y軸変更、ツールチップ変更
src/components/theme/ThemeFeaturedCard.tsx     -- 表示データの変更（goodCount -> averageScore等）
src/components/theme/ThemeCardCompact.tsx      -- 同上
```

### 10.4 ページ

```
src/app/(main)/home/page.tsx                   -- タイムラインデータ型の変更
src/app/(main)/explore/page.tsx                -- 同上
src/app/(main)/themes/[id]/page.tsx            -- handleReaction変更、PostCard props変更
src/app/(main)/posts/[id]/page.tsx             -- 投稿詳細: タイトル表示、リアクション変更
src/app/(main)/posts/[id]/analysis/page.tsx    -- 大幅変更: パイチャート->ヒストグラム、クロス集計変更
src/app/(main)/posts/[id]/share/page.tsx       -- シェア画面のデータ変更
src/app/(main)/settings/page.tsx               -- 通知設定: 「共感がついたとき」->「リアクションがついたとき」
src/app/(main)/settings/echo-chamber/page.tsx  -- 計算ロジック表示の変更
src/app/(main)/notifications/page.tsx          -- 通知タイプの表示変更
```

### 10.5 DBマイグレーション

```
supabase/migrations/YYYYMMDD_add_title_to_posts.sql
supabase/migrations/YYYYMMDD_reaction_score_migration.sql
supabase/migrations/YYYYMMDD_notification_type_update.sql
```

### 10.6 その他

```
src/lib/constants.ts           -- 必要に応じて定数追加
src/app/globals.css            -- スライダー関連のカスタムアニメーション追加
```

---

## 付録A: 実装優先順

以下の順序で実装することを推奨。

1. **DB マイグレーション**: posts.title追加、reactions変更、notifications変更
2. **型定義の更新**: `database.ts` の全型を更新
3. **API改修**: reactions API、タイムラインAPI、分析API
4. **ReactionSlider コンポーネント新規作成**
5. **PostCard 改修**: タイトル表示 + スライダー組込
6. **ComposeModal / ComposePanel 改修**: タイトル入力追加
7. **分析ページ改修**: パイチャート -> ヒストグラム
8. **テーマ関連コンポーネント改修**: ConsensusMeter, OpinionSpectrum
9. **その他ページの調整**: ホーム、探索、設定等

## 付録B: アクセシビリティ対応

### スライダーのアクセシビリティ

```tsx
<div
  role="slider"
  aria-label="リアクションスコア"
  aria-valuemin={0}
  aria-valuemax={100}
  aria-valuenow={value ?? undefined}
  aria-valuetext={value !== null ? `${value}%の共感` : "未評価"}
  tabIndex={0}
  onKeyDown={handleKeyDown}  // 左右キーで +-5 ずつ調整
>
```

- キーボード操作: 左右矢印キーで +-5 ずつスコア調整
- Enter/Space: 現在のスコアで確定
- Escape: 変更を取り消し
- スクリーンリーダー: `aria-valuetext` でスコアの意味を伝達

## 付録C: モバイル対応の注意点

| 項目 | 対応 |
|------|------|
| スライダーのタッチ操作 | `touch-none` クラスでブラウザデフォルトのスクロールを抑制 |
| タッチ精度 | つまみのヒットエリアを `h-10 w-10`（実際の表示は `h-6 w-6`、パディングで拡張） |
| スクロールとの競合 | 水平ドラッグを検出してからスクロールを抑制（垂直方向は通常通り） |
| ドラッグ中の誤操作 | ドラッグ開始後、つまみから指が離れても30px以内なら追従継続 |
