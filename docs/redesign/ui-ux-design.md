# My Opinion UI/UX設計書

**作成日**: 2026-02-08
**作成者**: UI/UXデザイナー
**ステータス**: 初版
**対応コンセプト**: [product-concept.md](./product-concept.md)

---

## 目次

1. [設計方針](#1-設計方針)
2. [デザインガイドライン](#2-デザインガイドライン)
3. [画面構成・画面遷移フロー](#3-画面構成画面遷移フロー)
4. [ナビゲーション設計](#4-ナビゲーション設計)
5. [画面別ワイヤーフレーム・コンポーネント設計](#5-画面別ワイヤーフレームコンポーネント設計)
6. [新規コンポーネント仕様](#6-新規コンポーネント仕様)
7. [既存コンポーネント変更箇所](#7-既存コンポーネント変更箇所)
8. [レスポンシブ対応](#8-レスポンシブ対応)
9. [アニメーション・インタラクション](#9-アニメーションインタラクション)
10. [Tailwind CSS / shadcn/ui スタイル指針](#10-tailwind-css--shadcnui-スタイル指針)

---

## 1. 設計方針

### 1.1 全体方針

My OpinionをXの「スキン違い」から脱却させ、「オピニオン・マッピングプラットフォーム」として独自の体験を確立する。

#### 設計原則

1. **テーマ・ファースト**: ユーザーの入口は「テーマ（議題）」であり、個人の投稿フィードではない
2. **属性の可視性**: 属性バッジは投稿カードの「おまけ」ではなく、意見の座標を示す重要な情報として強調する
3. **データ・ビジュアリゼーション中心**: グラフ、スペクトラム、メーターなどの可視化要素をメイン画面に配置
4. **発見と自己理解**: 「自分の立ち位置を知る」体験を日常導線に組み込む
5. **既存機能の維持**: 投稿・返信・フォロー等の基本SNS機能は全て維持。表示の優先度と導線を変更する

### 1.2 Xとの視覚的差別化ポイント

| 要素 | X (Twitter) | My Opinion (新) |
|------|-------------|-----------------|
| **ホーム画面** | 縦スクロールのフィード | テーマカード群 + ミニスペクトラム + 活動フィード |
| **投稿カードの属性表示** | 認証バッジのみ | 左側に属性カラーバー + 属性バッジを強調表示 |
| **テーマ詳細** | なし（トピック検索のみ） | スペクトラムビュー + 対話型属性レンズ + コンセンサスメーター |
| **プロフィール** | バナー + 投稿一覧 | ポジションマップ（レーダーチャート） + 投稿一覧 |
| **カラーパレット** | 青基調（#1DA1F2） | ティール/スレート基調 + データ可視化用の多色パレット |
| **サイドバー** | テキストメニュー一覧 | エコーチェンバースコア + テーマハイライト |

---

## 2. デザインガイドライン

### 2.1 カラーパレット（既存を維持・拡張）

現在のOKLCHベースのティール/スレートカラーを維持。データ可視化用のカラーを追加。

```
既存（維持）:
- Primary: oklch(0.50 0.13 230) -- ティール/スレート
- Background: oklch(0.98 0.005 80) -- ウォームクリーム
- Card: oklch(0.995 0.003 80) -- 白に近い暖色
- Destructive: oklch(0.55 0.16 25) -- ウォームレッド

新規追加（データ可視化用）:
- Spectrum Good: oklch(0.55 0.12 160) -- エメラルドグリーン
- Spectrum Bad: oklch(0.55 0.12 25) -- コーラルレッド
- Spectrum Neutral: oklch(0.65 0.06 230) -- ライトティール
- Consensus High: oklch(0.55 0.12 160) -- グリーン
- Consensus Low: oklch(0.60 0.12 60) -- アンバー
- Consensus Split: oklch(0.55 0.12 25) -- レッド

属性カラー（既存のAttributeBadgeカラーを維持）:
- Gender: Rose系
- Age Range: Emerald系
- Education: Amber系
- Occupation: Sky系
- Political Stance: Indigo系
- Political Party: Purple系
```

### 2.2 タイポグラフィ

既存のGeist Sansを維持。以下の使い分けを統一する。

| 用途 | サイズ | ウェイト | 適用箇所 |
|------|--------|---------|---------|
| ページタイトル | text-lg (18px) | font-bold | ヘッダー内タイトル |
| セクションタイトル | text-base (16px) | font-semibold | カード内見出し |
| セクションラベル | text-xs (12px) | font-semibold uppercase tracking-wider | セクション区切りラベル |
| 本文 | text-sm (14px) | font-normal | 投稿本文、説明文 |
| 補足 | text-xs (12px) | font-normal | タイムスタンプ、補助情報 |
| データ数値 | text-2xl〜text-5xl | font-bold tracking-tight | スコア、メーター数値 |

### 2.3 角丸・シャドウ

| 要素 | 角丸 | シャドウ |
|------|------|---------|
| カード | rounded-xl (12px) | shadow-sm hover:shadow-md |
| ボタン（通常） | rounded-lg (8px) | なし |
| ボタン（アクション） | rounded-full | shadow-sm |
| フィルターチップ | rounded-full | なし |
| モーダル | rounded-2xl (16px) | shadow-lg |
| 入力フィールド | rounded-lg (8px) | なし |

### 2.4 スペーシング

| 要素間 | 値 |
|--------|-----|
| カード間 | gap-4 (16px) |
| セクション間 | space-y-8 (32px) |
| カード内パディング | p-4 (16px) or p-5 (20px) |
| ページ左右パディング | px-4 (16px) |

---

## 3. 画面構成・画面遷移フロー

### 3.1 画面一覧（変更分のみ）

| # | 画面名 | パス | 変更内容 |
|---|--------|------|---------|
| 7 | **ホーム（テーマファースト）** | `/home` | 大幅変更: テーマ中心のレイアウトに |
| 8 | **探索（属性レンズ）** | `/explore` | 変更: 属性レンズUIに強化 |
| 10 | **テーマ詳細** | `/themes/:id` | 大幅変更: スペクトラム + コンセンサスメーター追加 |
| 10b | **テーマ詳細 スペクトラム** | `/themes/:id?view=spectrum` | 新規: オピニオン・スペクトラムビュー |
| 13 | **プロフィール** | `/users/:handle` | 変更: ポジションマップ追加 |
| 17 | **エコーチェンバー指標** | `/settings/echo-chamber` | 変更: ポジションマップとの統合 |

### 3.2 画面遷移図（新）

```
[ランディング] --> [登録/ログイン] --> [オンボーディング]
                                            |
                                            v
                                    [ホーム（テーマファースト）]
                                            |
                    +-----------+-----------+-----------+-----------+
                    |           |           |           |           |
                    v           v           v           v           v
              [テーマ詳細]  [探索]     [通知]     [プロフィール]  [設定]
                    |           |                       |
              +-----+-----+    |                 [ポジション
              |           |    |                  マップ]
              v           v    v
        [スペクトラム  [投稿     [属性レンズ
         ビュー]      一覧]     フィルター]
              |           |
              v           v
         [投稿詳細] <-----+
              |
              v
         [投稿分析] --> [シェアカード]
```

---

## 4. ナビゲーション設計

### 4.1 ボトムナビゲーション（モバイル）-- 変更

**変更前**: ホーム / 探索 / 投稿 / テーマ / 通知
**変更後**: テーマ / 探索 / 投稿 / 通知 / マイページ

| 位置 | アイコン | ラベル | 遷移先 | 変更点 |
|------|---------|--------|--------|--------|
| 1 | `MessageSquare` | テーマ | `/home` | 「ホーム」から「テーマ」に名称変更。テーマファーストを体現 |
| 2 | `Compass` | 探索 | `/explore` | 維持 |
| 3 | `PenSquare` | 投稿 | ComposeModal | 維持（中央のアクセントボタン） |
| 4 | `Bell` | 通知 | `/notifications` | 維持 |
| 5 | `User` | マイページ | `/profile` | 「テーマ」の位置に「通知」が入った分、プロフィールをナビに追加 |

**変更理由**: テーマを第1位置に配置することで、サービスの中心がテーマであることを明示する。プロフィールをナビに入れることで、ポジションマップへのアクセスを容易にする。

### 4.2 サイドバー（PC）-- 変更

**変更前**: ホーム / 探索 / テーマ / 通知 / プロフィール + エコーチェンバーミニウィジェット + 投稿ボタン
**変更後**: テーマ（ホーム） / 探索 / 通知 / マイポジション / プロフィール + 注目テーマミニカード + 投稿ボタン

```
[My Opinion ロゴ]
---
テーマ（ホーム）     -- アイコン: MessageSquare
探索               -- アイコン: Compass
通知               -- アイコン: Bell (未読バッジ付き)
マイポジション      -- アイコン: Target (新規)
プロフィール       -- アイコン: User
---
[注目テーマ ミニカード]  -- 新規: 投稿数が最も多いアクティブテーマ
  テーマタイトル
  コンセンサスメーター（ミニ）
  「意見を見る →」
---
[投稿する] ボタン    -- xl:hidden (右パネルがある場合は非表示)
---
設定 / テーマ切替
```

**変更理由**: エコーチェンバーミニウィジェットを「マイポジション」ナビ項目に置き換え、注目テーマカードを配置。テーマへの導線を強化。

### 4.3 モバイルヘッダー -- 変更

**変更前**: 「My Opinion」ロゴ + 通知ベル
**変更後**: 「My Opinion」ロゴ + エコーチェンバースコア（ミニ円グラフ） + 通知ベル

エコーチェンバースコアのミニ表示をヘッダーに常駐させることで、自分の偏り度を常に意識させる。

---

## 5. 画面別ワイヤーフレーム・コンポーネント設計

### 5.1 ホーム画面（テーマファースト）

**パス**: `/home`
**変更レベル**: 大幅変更

#### レイアウト構造

```
[ヘッダー: 「テーマ」タイトル]
|
[今週のテーマ カード（大）]       -- ThemeFeaturedCard
|  テーマタイトル（text-xl font-bold）
|  説明文（text-sm text-muted-foreground, line-clamp-2）
|  参加者数 / 投稿数
|  コンセンサスメーター（ミニ）    -- ConsensusMeterMini
|  [意見を投じる] ボタン（primary, rounded-full）
|
[注目のテーマ]                    -- セクションラベル
|  [横スクロール ThemeCard 群]    -- ThemeCardCompact
|     テーマタイトル
|     投稿数
|     コンセンサスメーター（ミニ）
|
[あなたのポジション]              -- セクションラベル（PCのみ表示）
|  [ポジションマップ ミニカード]   -- PositionMapMini
|     レーダーチャート（小）
|     スコア数値
|     「詳細を見る →」
|
[フォロー中の最新]               -- セクションラベル
|  [PostCard 群（3件まで）]       -- 既存PostCardを利用
|  [もっと見る] リンク（/explore?tab=following）
```

#### 使用コンポーネント

- **ThemeFeaturedCard** (新規): 今週のテーマを大きく表示
- **ThemeCardCompact** (新規): 横スクロール用のコンパクトなテーマカード
- **ConsensusMeterMini** (新規): テーマカード内に配置するミニコンセンサスメーター
- **PositionMapMini** (新規): レーダーチャートの縮小版
- **PostCard** (既存): フォロー中の最新投稿表示に利用

### 5.2 テーマ詳細画面

**パス**: `/themes/:id`
**変更レベル**: 大幅変更

#### レイアウト構造

```
[ヘッダー: ← 戻る + テーマタイトル]
|
[テーマ情報セクション]
|  説明文
|  参加者数 / 投稿数 / ステータスバッジ
|
[コンセンサスメーター（大）]       -- ConsensusMeter
|  0%    |||||||||||||||||||    100%
|  「意見が割れている」or「概ね一致」テキスト
|  属性別のコンセンサス度合い（横棒グラフ、1行ずつ）
|
[ビュー切替タブ]
|  [投稿一覧] / [スペクトラム]
|
--- [投稿一覧]タブ選択時 ---
|
[属性レンズバー]                  -- AttributeLensBar
|  [全体] [性別] [年齢帯] [職業] [政治スタンス]
|  選択すると下のフィードがフィルターされる
|
[投稿する] ボタン（active テーマの場合のみ）
|
[PostCard 群]                    -- InfiniteScroll
|
--- [スペクトラム]タブ選択時 ---
|
[OpinionSpectrum]                -- OpinionSpectrum
|  軸選択: [政治スタンス ▼] x [Good/Bad比率]
|  散布図表示
|  自分の投稿をハイライト
|  ドットをタップで投稿プレビュー
```

#### 使用コンポーネント

- **ConsensusMeter** (新規): コンセンサス度合いの大型表示
- **AttributeLensBar** (新規): 属性フィルターバー
- **OpinionSpectrum** (新規): 散布図/ヒートマップビュー
- **PostCard** (既存): 投稿一覧表示
- **ComposeModal** (既存): テーマへの投稿

### 5.3 探索画面（属性レンズ強化）

**パス**: `/explore`
**変更レベル**: 中程度の変更

#### レイアウト構造

```
[ヘッダー: 「探索」タイトル]
|
[タブ切替]
|  [テーマ] / [投稿] / [ユーザー]
|
--- [テーマ]タブ選択時 ---
|
[属性レンズバー]                  -- AttributeLensBar（再利用）
|
[テーマカード群]                  -- ThemeCardCompact群（縦配置）
|  コンセンサスメーターミニ付き
|
--- [投稿]タブ選択時 ---
|
[ソートタブ: 最新 / 人気]
|
[属性レンズバー]                  -- AttributeLensBar（再利用）
|
[PostCard 群]                    -- InfiniteScroll
|
--- [ユーザー]タブ選択時 ---
|
[属性レンズバー]                  -- AttributeLensBar
|
[UserCard 群]                    -- 既存UserCard利用
```

**変更点**:
- 既存のフィルターチップを`AttributeLensBar`に統合
- テーマタブを追加し、テーマの探索を可能にする
- ユーザータブを追加

### 5.4 プロフィール画面（ポジションマップ追加）

**パス**: `/users/:handle`
**変更レベル**: 中程度の変更

#### レイアウト構造

```
[グラデーションバナー]
|
[アバター + 名前 + ハンドル]
|  [フォロー/フォロー中] ボタン or [プロフィール編集]
|
[属性バッジ群]                    -- 既存AttributeBadge（サイズ拡大）
|
[フォロー数 / フォロワー数]
|
[ポジションマップ]                -- PositionMap（本人プロフィールのみ表示）
|  レーダーチャート（6軸: テーマごとの賛否傾向）
|  エコーチェンバースコア
|  「あなたと意見が近い/遠いユーザー」（本人のみ）
|
[タブ切替: 投稿 / 返信 / Good済み]
|
[PostCard 群]                    -- InfiniteScroll
```

**変更点**:
- 属性バッジの表示を強調（サイズ拡大、余白追加）
- ポジションマップセクションを追加（本人プロフィールのみ）
- 投稿一覧の上にタブ切替を追加

### 5.5 認証・オンボーディング画面

**変更なし**。既存のフローを維持する。

### 5.6 投稿詳細画面

**パス**: `/posts/:id`
**変更レベル**: 軽微な変更

**変更点**:
- PostCardの属性バッジ表示を強化版に合わせる
- それ以外は維持

### 5.7 設定画面群

**変更レベル**: 軽微な変更

**変更点**:
- 設定画面の「エコーチェンバー指標」リンクを「マイポジション」に名称変更
- エコーチェンバー画面にレーダーチャートとポジションマップを追加

---

## 6. 新規コンポーネント仕様

### 6.1 ThemeFeaturedCard

**ファイル**: `src/components/theme/ThemeFeaturedCard.tsx`

```typescript
interface ThemeFeaturedCardProps {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  participantCount: number;
  consensusScore: number; // 0-100
  status: "active" | "ended";
  onParticipate: () => void;
}
```

**レイアウト**:
- 全幅カード、`rounded-xl border bg-card p-5`
- 上部にテーマステータスバッジ（受付中 / 終了）
- タイトル: `text-xl font-bold`
- 説明文: `text-sm text-muted-foreground line-clamp-2`
- 下部: 参加者数 + 投稿数 + ConsensusMeterMini + 「意見を投じる」ボタン
- カード全体がクリック可能（Link to `/themes/:id`）
- 「意見を投じる」ボタンはComposeModalを開く（テーマID付き）

**インタラクション**:
- hover: `-translate-y-0.5 shadow-md`
- タップ: テーマ詳細へ遷移
- 「意見を投じる」ボタン: ComposeModal（themeId付き）を開く、イベント伝播を停止

### 6.2 ThemeCardCompact

**ファイル**: `src/components/theme/ThemeCardCompact.tsx`

```typescript
interface ThemeCardCompactProps {
  id: string;
  title: string;
  postCount: number;
  consensusScore: number; // 0-100
  status: "active" | "ended";
}
```

**レイアウト**:
- 固定幅カード `w-[200px] shrink-0` （横スクロールコンテナ内で使用）
- `rounded-xl border bg-card p-4`
- タイトル: `text-sm font-semibold line-clamp-2`
- 投稿数: `text-xs text-muted-foreground`
- ConsensusMeterMini

**インタラクション**:
- hover: `bg-accent/50`
- Link to `/themes/:id`

### 6.3 ConsensusMeter

**ファイル**: `src/components/theme/ConsensusMeter.tsx`

```typescript
interface ConsensusMeterProps {
  score: number; // 0-100. 0=完全に意見が割れている, 100=全員同意見
  label?: string; // 「意見が割れています」等
  attributeBreakdown?: {
    attribute: string; // "gender", "age_range", etc.
    label: string; // "性別", "年齢帯", etc.
    score: number; // 0-100
  }[];
}
```

**レイアウト**:
- セクションカード `rounded-xl border bg-card p-5`
- スコアバー: `h-3 rounded-full bg-muted` + カラーグラデーション付きの進行バー
  - score >= 70: 緑系 (Consensus High)
  - score 40-69: アンバー系 (Consensus Low)
  - score < 40: 赤系 (Consensus Split)
- スコア数値: `text-3xl font-bold tracking-tight` + カラー
- ラベル: `text-sm text-muted-foreground`
- 属性別ブレイクダウン: 各属性ごとにミニバー + ラベル + スコア値

**インタラクション**:
- 初回表示時、バーがアニメーションで伸びる（`transition-all duration-700 ease-out`）
- スコア数値はカウントアップアニメーション

### 6.4 ConsensusMeterMini

**ファイル**: `src/components/theme/ConsensusMeterMini.tsx`

```typescript
interface ConsensusMeterMiniProps {
  score: number; // 0-100
}
```

**レイアウト**:
- インラインコンポーネント `inline-flex items-center gap-1.5`
- 小さなバー: `h-1.5 w-16 rounded-full bg-muted` + カラー付き進行バー
- スコア値: `text-xs font-medium` + カラー

### 6.5 AttributeLensBar

**ファイル**: `src/components/filter/AttributeLensBar.tsx`

```typescript
interface AttributeLensBarProps {
  activeFilters: Record<string, string>; // { gender: "male", age_range: "25-29" }
  onFilterChange: (filters: Record<string, string>) => void;
  onClear: () => void;
}
```

**レイアウト**:
- 横スクロール可能なバー `flex items-center gap-2 overflow-x-auto px-4 py-3 scrollbar-none`
- 先頭にレンズアイコン: `Filter` (lucide) + 「属性レンズ」ラベル
- 各属性グループ: `FilterChip` (フィルターチップコンポーネント)
  - 未選択: `rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground`
  - 選択済: `rounded-full border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs text-primary font-medium`
  - タップで属性値のドロップダウンが開く
- クリアボタン: アクティブフィルター数 > 0 の場合に表示

**インタラクション**:
- チップタップ: 属性値のドロップダウン展開（ポップオーバー形式）
- ドロップダウン内の値タップ: フィルター適用 + フィード更新アニメーション
- Xボタン: そのフィルターを解除
- フィルター切替時: フィード内容が `animate-fade-in-up` で切り替わる

**既存の探索ページフィルターとの差分**:
- 現在: 各属性がフラットなチップ群。展開/閉じるがやや不安定
- 新: 先頭に「属性レンズ」ラベルを追加し、意味を明示。ドロップダウンUIをshadcn/ui Popoverに統一

### 6.6 OpinionSpectrum

**ファイル**: `src/components/theme/OpinionSpectrum.tsx`

```typescript
interface SpectrumDataPoint {
  postId: string;
  x: number; // 属性値の数値化 (0-4 for political_stance等)
  y: number; // Good率 (0-100)
  isOwnPost: boolean;
  authorHandle: string;
  contentPreview: string; // 先頭50文字
  goodCount: number;
  badCount: number;
}

interface OpinionSpectrumProps {
  data: SpectrumDataPoint[];
  xAxisAttribute: string; // "political_stance", "age_range", etc.
  xAxisLabels: string[]; // ["左派", "やや左派", "中道", "やや右派", "右派"]
  onAttributeChange: (attribute: string) => void;
  onPostClick: (postId: string) => void;
  loading?: boolean;
}
```

**レイアウト**:
- セクション全体: `rounded-xl border bg-card p-4`
- 上部: 軸選択セレクトボックス（shadcn/ui Select）
  - ラベル: `横軸: [属性選択 ▼]`
  - 縦軸は固定: 「Good率」
- 中央: Rechartsの`ScatterChart`
  - 幅: 100%（ResponsiveContainer）
  - 高さ: 300px（モバイル） / 400px（PC）
  - 各ドット: 通常はprimary色、自分の投稿はdestructive色（赤でハイライト）
  - ドットサイズ: goodCount + badCount に比例（r = 4-12）
  - X軸: 属性値（カテゴリカル）
  - Y軸: Good率 0-100%
  - ツールチップ: 投稿プレビュー + 投稿者属性
- 下部: 凡例（自分の投稿 = 赤丸、他の投稿 = ティール丸）

**インタラクション**:
- ドットhover: ツールチップ表示（投稿プレビュー + Good/Bad + 投稿者属性バッジ）
- ドットクリック: 投稿詳細へ遷移
- 軸変更: チャートが `opacity-0 → opacity-100` でフェード切替
- 自分の投稿は常にz-indexが上

### 6.7 PositionMap

**ファイル**: `src/components/user/PositionMap.tsx`

```typescript
interface PositionMapProps {
  // 各テーマに対する自分のGood率傾向（6軸最大）
  axes: {
    themeTitle: string; // テーマ名（短縮版）
    score: number; // 0-100 (50が中立)
  }[];
  echoChamberScore: number | null; // 0-100
  echoChamberMessage: string;
}
```

**レイアウト**:
- セクション全体: `rounded-xl border bg-card p-5`
- 上部ラベル: 「マイ・ポジションマップ」 + `text-xs font-semibold uppercase tracking-wider text-muted-foreground`
- 中央: Rechartsの`RadarChart`
  - 幅: 100%（ResponsiveContainer）
  - 高さ: 250px
  - 各軸: テーマ名（最新の参加テーマ6つまで）
  - スコア: 中心(0) = 強くBad傾向、外周(100) = 強くGood傾向、50 = 中立
  - 塗りつぶし: `fill="var(--primary)" fillOpacity={0.2}`
  - ストローク: `stroke="var(--primary)" strokeWidth={2}`
- 下部: エコーチェンバースコア表示
  - スコア数値 + プログレスバー + 評価ラベル（多様/やや偏り/偏り大）
  - 「詳細を見る →」リンク（`/settings/echo-chamber`）

**インタラクション**:
- 初回表示: レーダーが中心から展開するアニメーション（`duration-700`）
- ホバー: 各軸のスコア値をツールチップ表示

### 6.8 PositionMapMini

**ファイル**: `src/components/user/PositionMapMini.tsx`

```typescript
interface PositionMapMiniProps {
  axes: { themeTitle: string; score: number }[];
  echoChamberScore: number | null;
}
```

**レイアウト**:
- `rounded-xl border bg-card p-4` カード
- 左: ミニレーダーチャート（120x120px）-- ラベルなし、ストロークのみ
- 右: スコア数値 + 「マイポジション」ラベル + 「詳細 →」
- Link全体がクリック可能

### 6.9 SpectrumTooltip

**ファイル**: `src/components/theme/SpectrumTooltip.tsx`

```typescript
interface SpectrumTooltipProps {
  postId: string;
  authorHandle: string;
  contentPreview: string;
  goodCount: number;
  badCount: number;
  attributes: { type: string; value: string }[];
}
```

**レイアウト**:
- `rounded-lg border bg-popover p-3 shadow-md max-w-[250px]`
- 投稿プレビュー: `text-xs line-clamp-3`
- Good/Bad: インラインバッジ
- 投稿者属性: AttributeBadge群（小サイズ）
- 「詳細を見る →」リンク

---

## 7. 既存コンポーネント変更箇所

### 7.1 AppShell (`src/components/layout/AppShell.tsx`)

**変更内容**: 右パネルのComposePanelの上にPositionMapMiniを追加

```
変更前:
  右パネル → ComposePanel のみ

変更後:
  右パネル → PositionMapMini + ComposePanel
```

### 7.2 Header (`src/components/layout/Header.tsx`)

**変更内容**: エコーチェンバースコアのミニ表示を追加

```
変更前:
  [My Opinion] [テーマ切替] [通知ベル]

変更後:
  [My Opinion] [エコーチェンバー ミニスコア] [テーマ切替] [通知ベル]
```

- エコーチェンバーミニスコアは直径24pxの円グラフ（Sidebarの既存エコーチェンバーウィジェットのSVGと同じロジック）
- タップで `/settings/echo-chamber` へ遷移

### 7.3 Sidebar (`src/components/layout/Sidebar.tsx`)

**変更内容**:
- ナビゲーション項目の変更（4.2参照）
- エコーチェンバーミニウィジェット → 注目テーマミニカードに置換
- 「マイポジション」ナビ項目を追加

### 7.4 BottomNav (`src/components/layout/BottomNav.tsx`)

**変更内容**: ナビゲーション項目の変更（4.1参照）
- `navItems` 配列の並び替え・変更
- 1番目をテーマ（`/home`）に
- 5番目をマイページ（`/profile`）に
- テーマアイコン: `MessageSquare`
- マイページアイコン: `User`

### 7.5 PostCard (`src/components/post/PostCard.tsx`)

**変更内容**: 属性バッジの表示を強調

```
変更前:
  [アバター] [名前 @handle · 時間]
             [属性バッジ群（小さく目立たない）]
             [投稿本文]
             [アクションバー]

変更後:
  [属性カラーバー(3px)] [アバター] [名前 @handle · 時間]
                                   [投稿本文]
                        [属性バッジ群（本文の下、やや大きく）]
                        [アクションバー]
```

具体的な変更:
1. 投稿カードの左端に3px幅の「属性カラーバー」を追加
   - 投稿者の主要属性（政治スタンス）に基づく色
   - 属性未設定: `bg-muted`
   - left: `rounded-l-none` の border-left として実装
2. 属性バッジ群を投稿者名の下から投稿本文の下に移動
   - 「誰が言ったか」ではなく「どの立場から言ったか」を本文と関連付ける
3. 属性バッジのサイズを `text-xs` から `text-xs px-2 py-0.5` に微拡大

### 7.6 AttributeBadge (`src/components/user/AttributeBadge.tsx`)

**変更内容**: `size` propを追加

```typescript
interface AttributeBadgeProps {
  type: AttributeType;
  value: string;
  size?: "sm" | "md"; // sm=既存サイズ, md=やや大きめ
  className?: string;
}
```

- `sm` (デフォルト): 現在と同じ `text-xs`
- `md`: `text-xs px-2.5 py-1` で若干大きく

### 7.7 EmptyState (`src/components/common/EmptyState.tsx`)

**変更なし**

### 7.8 InfiniteScroll (`src/components/common/InfiniteScroll.tsx`)

**変更なし**

### 7.9 ComposeModal (`src/components/post/ComposeModal.tsx`)

**変更内容**: テーマ選択UIの追加

```typescript
interface ComposeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: (content: string, themeId?: string) => void | Promise<void>;
  replyTo?: { id: string; author: string };
  defaultThemeId?: string; // テーマ詳細から開いた場合のデフォルトテーマ
  defaultThemeName?: string;
}
```

- テキストエリアの上に「テーマ選択」セクションを追加
  - デフォルトテーマが指定されている場合: テーマ名バッジを表示
  - 未指定の場合: 「テーマを選択（任意）」ボタンを表示 → タップでテーマリストのドロップダウン
- テーマ選択は任意（選択しなくても投稿可能）

---

## 8. レスポンシブ対応

### 8.1 ブレイクポイント

| ブレイクポイント | 値 | 用途 |
|---------------|------|------|
| モバイル | `< 1024px` | BottomNav + モバイルヘッダー、1カラム |
| PC (lg) | `>= 1024px` | Sidebar + メインコンテンツ、2カラム |
| PC ワイド (xl) | `>= 1280px` | Sidebar + メインコンテンツ + 右パネル、3カラム |

### 8.2 画面別レスポンシブ対応

#### ホーム画面

| 要素 | モバイル | PC |
|------|---------|-----|
| 今週のテーマカード | 全幅、パディング小 | 全幅、パディング大 |
| 注目テーマ群 | 横スクロール | 横スクロール（同じ） |
| ポジションマップミニ | 非表示（モバイルではプロフィールからアクセス） | 表示 |
| フォロー中の最新 | 全件表示 | 3件 + もっと見る |

#### テーマ詳細

| 要素 | モバイル | PC |
|------|---------|-----|
| コンセンサスメーター | スコアバーのみ。属性ブレイクダウンは折りたたみ | 展開表示 |
| スペクトラム | 高さ280px、軸ラベル省略 | 高さ400px、軸ラベル表示 |
| 属性レンズバー | 横スクロール | 横スクロール（同じ） |

#### プロフィール

| 要素 | モバイル | PC |
|------|---------|-----|
| ポジションマップ | レーダー幅100%、高さ200px | レーダー幅100%、高さ280px |
| 属性バッジ | 折り返し表示 | 折り返し表示（同じ） |

### 8.3 タッチ操作への配慮

- スペクトラムのドット: モバイルではタップ範囲を `r+8px` に拡大
- 属性レンズバー: スワイプでスクロール可能、`scrollbar-none`
- テーマカード横スクロール: CSS snap scroll（`snap-x snap-mandatory`）
- コンセンサスメーターの属性ブレイクダウン: モバイルでは「詳細を見る」タップで展開

---

## 9. アニメーション・インタラクション

### 9.1 既存アニメーション（維持）

- `animate-reaction-pop`: Good/Badボタンのポップ（0.3s）
- `animate-count-up`: カウント数値の上方向フェードイン
- `animate-unread-pulse`: 未読バッジのパルス
- `animate-shimmer`: スケルトンのシマー
- `animate-success-pop`: 成功チェックマークのポップ
- `animate-fade-in-up`: ページ切り替え時のフェードインアップ

### 9.2 新規アニメーション

#### `animate-bar-grow`
用途: コンセンサスメーターのバー、スコアバー
```css
@keyframes bar-grow {
  0% { width: 0%; }
  100% { width: var(--target-width); }
}
```
- Duration: 700ms
- Easing: ease-out
- トリガー: 要素が画面内に入った時（Intersection Observer）

#### `animate-radar-expand`
用途: レーダーチャートの展開
```css
@keyframes radar-expand {
  0% { transform: scale(0); opacity: 0; }
  70% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}
```
- Duration: 700ms
- Easing: ease-out

#### `animate-dot-appear`
用途: スペクトラムのドットの出現
```css
@keyframes dot-appear {
  0% { transform: scale(0); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}
```
- Duration: 300ms
- Easing: ease-out
- 各ドットにstagger（50msずつずらし）

#### `animate-lens-switch`
用途: 属性レンズ切り替え時のフィード切り替え
```css
@keyframes lens-switch {
  0% { opacity: 0; transform: translateY(4px); }
  100% { opacity: 1; transform: translateY(0); }
}
```
- Duration: 250ms
- Easing: ease-out

### 9.3 トランジション

| 対象 | トランジション | Duration |
|------|--------------|----------|
| カードhover | `translate-y + shadow` | 200ms |
| フィルターチップ選択 | `background-color + border-color + color` | 150ms |
| タブ切り替え | `opacity` | 200ms |
| スコア数値変化 | カウントアップ | 500ms |

---

## 10. Tailwind CSS / shadcn/ui スタイル指針

### 10.1 使用するshadcn/uiコンポーネント

| コンポーネント | 用途 | 既存/新規 |
|-------------|------|----------|
| Button | 各種ボタン | 既存 |
| Badge | 属性バッジ | 既存 |
| Dialog | ComposeModal, ReportModal | 既存 |
| Select | 軸選択、属性選択 | 既存 |
| Separator | セクション区切り | 既存 |
| Avatar | ユーザーアバター | 既存 |
| Skeleton | ローディング | 既存 |
| Sheet | モバイルメニュー（必要時） | 既存 |
| Popover | 属性レンズのドロップダウン | **新規インストール** |
| Tabs | ビュー切り替え（テーマ詳細、探索、プロフィール） | **新規インストール** |
| Tooltip | スペクトラムのドットツールチップ | 既存 |
| AlertDialog | 確認ダイアログ | 既存 |
| DropdownMenu | 投稿メニュー | 既存 |
| Switch | 設定トグル | 既存 |
| Input / Textarea / Label / Checkbox | フォーム | 既存 |

### 10.2 新規インストールが必要なshadcn/uiコンポーネント

```bash
npx shadcn@latest add popover tabs
```

### 10.3 Rechartsの使用

**既にインストール済み**（分析ページで使用中）。追加パッケージ不要。

新規使用するチャートタイプ:
- `ScatterChart` + `Scatter` + `ZAxis`: オピニオン・スペクトラム
- `RadarChart` + `Radar` + `PolarGrid` + `PolarAngleAxis`: ポジションマップ

### 10.4 カスタムCSSクラス（globals.cssに追加）

```css
/* スクロールバー非表示 */
.scrollbar-none::-webkit-scrollbar { display: none; }
.scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

/* CSS Snap Scroll for horizontal theme cards */
.snap-scroll-x {
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;
}
.snap-scroll-x > * {
  scroll-snap-align: start;
}
```

**注**: `scrollbar-none` は既に使用されている可能性あり（探索ページのフィルターバー）。重複がないか確認のこと。

### 10.5 CSS変数の追加（globals.cssの `:root` と `.dark` に追加）

```css
:root {
  /* Data visualization colors */
  --spectrum-good: oklch(0.55 0.12 160);
  --spectrum-bad: oklch(0.55 0.12 25);
  --spectrum-neutral: oklch(0.65 0.06 230);
  --consensus-high: oklch(0.55 0.12 160);
  --consensus-low: oklch(0.60 0.12 60);
  --consensus-split: oklch(0.55 0.12 25);
}

.dark {
  --spectrum-good: oklch(0.62 0.10 160);
  --spectrum-bad: oklch(0.62 0.10 25);
  --spectrum-neutral: oklch(0.60 0.06 230);
  --consensus-high: oklch(0.62 0.10 160);
  --consensus-low: oklch(0.65 0.10 60);
  --consensus-split: oklch(0.62 0.10 25);
}
```

`@theme inline` ブロックにも対応するカスタムプロパティマッピングを追加:

```css
@theme inline {
  /* 既存のプロパティに追加 */
  --color-spectrum-good: var(--spectrum-good);
  --color-spectrum-bad: var(--spectrum-bad);
  --color-spectrum-neutral: var(--spectrum-neutral);
  --color-consensus-high: var(--consensus-high);
  --color-consensus-low: var(--consensus-low);
  --color-consensus-split: var(--consensus-split);

  /* 新規アニメーション */
  --animate-bar-grow: bar-grow 0.7s ease-out;
  --animate-radar-expand: radar-expand 0.7s ease-out;
  --animate-dot-appear: dot-appear 0.3s ease-out;
  --animate-lens-switch: lens-switch 0.25s ease-out;
}
```

---

## 付録A: 新規API要件（バックエンドチーム向け）

UI/UX設計に基づき、以下のAPI追加/変更が必要。

### A.1 新規API

| エンドポイント | メソッド | 用途 | レスポンス |
|-------------|--------|------|----------|
| `/api/themes/featured` | GET | 今週のテーマ + 注目テーマ取得 | `{ featured: ThemeWithConsensus, trending: ThemeWithConsensus[] }` |
| `/api/themes/:id/consensus` | GET | テーマのコンセンサススコア取得 | `{ score: number, attributeBreakdown: [...] }` |
| `/api/themes/:id/spectrum` | GET | テーマのスペクトラムデータ取得 | `{ points: SpectrumDataPoint[] }` |
| `/api/users/me/position-map` | GET | マイ・ポジションマップデータ取得 | `{ axes: [...], echoChamberScore: number, message: string }` |

### A.2 既存API変更

| エンドポイント | 変更内容 |
|-------------|---------|
| `GET /api/themes` | レスポンスに `consensusScore` フィールド追加 |
| `GET /api/themes/:id` | レスポンスに `consensusScore`, `participantCount` フィールド追加 |

### A.3 ThemeWithConsensus 型

```typescript
interface ThemeWithConsensus {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  participantCount: number;
  consensusScore: number; // 0-100
  start_date: string;
  end_date: string | null;
  status: "active" | "ended";
}
```

---

## 付録B: 実装優先順位

フロントエンドエンジニアへの推奨実装順序:

1. **ナビゲーション変更** (BottomNav, Sidebar, Header)
   - 影響範囲が広いが変更は軽微。最初に着手して全体の骨格を変える

2. **PostCard 属性表示強化**
   - 属性カラーバー追加、バッジ位置変更
   - 全画面に影響するため早めに

3. **ホーム画面（テーマファースト）**
   - ThemeFeaturedCard, ThemeCardCompact, ConsensusMeterMini の新規作成
   - ホーム画面の再構成

4. **テーマ詳細画面**
   - ConsensusMeter の新規作成
   - AttributeLensBar の新規作成
   - 投稿一覧タブの実装

5. **オピニオン・スペクトラム**
   - OpinionSpectrum の新規作成（Recharts ScatterChart）
   - テーマ詳細のスペクトラムタブ

6. **探索画面（属性レンズ強化）**
   - タブ構造の追加
   - AttributeLensBar の統合

7. **プロフィール画面（ポジションマップ）**
   - PositionMap, PositionMapMini の新規作成（Recharts RadarChart）
   - プロフィールページへの組み込み

8. **CSS変数・アニメーション追加**
   - globals.css の変更は各コンポーネント実装と並行で可

---

## 付録C: ファイル構成（新規作成ファイル一覧）

```
src/components/
  theme/
    ThemeFeaturedCard.tsx      (新規)
    ThemeCardCompact.tsx       (新規)
    ConsensusMeter.tsx         (新規)
    ConsensusMeterMini.tsx     (新規)
    OpinionSpectrum.tsx        (新規)
    SpectrumTooltip.tsx        (新規)
    ThemeProvider.tsx           (既存・変更なし)
    ThemeToggle.tsx             (既存・変更なし)
  user/
    PositionMap.tsx             (新規)
    PositionMapMini.tsx         (新規)
    AttributeBadge.tsx          (既存・変更あり: size prop追加)
    UserAvatar.tsx              (既存・変更なし)
    UserCard.tsx                (既存・変更なし)
  filter/
    AttributeLensBar.tsx        (新規)
  layout/
    AppShell.tsx                (既存・変更あり)
    Header.tsx                  (既存・変更あり)
    Sidebar.tsx                 (既存・変更あり)
    BottomNav.tsx               (既存・変更あり)
  post/
    PostCard.tsx                (既存・変更あり: 属性カラーバー追加)
    ComposeModal.tsx            (既存・変更あり: テーマ選択追加)
    ComposePanel.tsx            (既存・変更なし)
    PostCardSkeleton.tsx        (既存・変更なし)
    PostContent.tsx             (既存・変更なし)
  ui/
    popover.tsx                 (新規: shadcn/ui add)
    tabs.tsx                    (新規: shadcn/ui add)
    ... (その他は変更なし)

src/app/(main)/
  home/page.tsx                 (既存・大幅変更)
  explore/page.tsx              (既存・変更あり)
  themes/[id]/page.tsx          (既存・大幅変更)
  users/[handle]/page.tsx       (既存・変更あり)
  settings/echo-chamber/page.tsx (既存・変更あり)

src/app/globals.css             (既存・変更あり: CSS変数・アニメーション追加)
```
