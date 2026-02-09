# Design V4: My Opinion デザイン刷新

## 1. 現状分析

### 1.1 X(Twitter)との類似点

現在のUIを徹底調査した結果、以下がX(Twitter)のパターンをほぼそのまま踏襲している。

**レイアウト構造**
- 3カラム構成（左サイドバー240px / 中央コンテンツ600px / 右パネル320px）-- Xと同一
- 左サイドバーにアイコン+ラベルの縦並びナビゲーション（`Sidebar.tsx`）-- Xのそのまま
- モバイル: 上部固定ヘッダー + 下部5アイコンタブバー（`Header.tsx`, `BottomNav.tsx`）-- X/Instagram同型
- 中央コンテンツ幅 600px 固定 -- Xと同一

**タイムライン/フィード**
- 投稿が縦一列 `border-b` で区切られた無限スクロールリスト（`InfiniteScroll`で`PostCard`を並べる）
- PostCardのレイアウト: アバター左、テキスト右、下部にアクションバー（返信・リポスト・...）-- Xのツイートカードとほぼ同型
- 探索ページ(`explore/page.tsx`): トピック/意見/ユーザーの3タブ切り替え -- Xの探索タブと同構造

**投稿カード**
- `PostCard.tsx`の構造: コンテンツ → 属性バッジ → 著者行(アバター+名前+時刻) → リアクションスライダー → アクションバー(返信/リポスト/分析)
- リポスト機能の存在自体がXそのもの
- ドロップダウンメニュー(コピー/シェア/通報/削除)もXと同様

**通知ページ**
- 通知一覧が縦リスト、未読インジケーター、「すべて既読」ボタン -- Xの通知ページと同型

**プロフィールページ**
- バナー → アバター → 名前/ハンドル → bio → フォロー数/フォロワー数 → タブ → 投稿リスト -- X/Instagramのプロフィールパターンそのもの

### 1.2 My Opinionの独自価値（現在活かしきれていないもの）

| 独自機能 | 現状の実装 | 問題点 |
|---|---|---|
| **属性開示（6種類）** | PostCard下部に小さなBadge表示 | 目立たない。属性を軸にした探索ができない |
| **リアクションスコア(0-100)** | スライダーUI（`ReactionSlider.tsx`） | 素晴らしいUI。だがスコアの「分布」が見えない |
| **コンセンサススコア** | テーマ詳細に`ConsensusMeter`表示 | ホームでは極小バー。メイン体験に据えられていない |
| **意見マップ(散布図)** | テーマ詳細の「意見マップ」タブ | 隠れたタブ内。属性×スコアの面白さが伝わらない |
| **視野スコア(エコーチェンバー)** | 設定画面の奥、ヘッダーの小さな円 | ゲーミフィケーション要素として弱い |
| **ポジションマップ(レーダー)** | プロフィールの自分のみ表示 | 他者との比較不能。面白みが半減 |
| **トピック中心設計** | テーマ一覧/テーマ詳細ページ | トピックが「単なるカテゴリ」に留まっている |
| **属性フィルター** | `AttributeLensBar`横スクロールバー | 良い着想だが、結果のフィードバックが弱い |

**核心的な問題**: Xのフィードレイアウトは「個人の発信」を中心に設計されている。My Opinionは「トピック×属性×スコア」という多次元データが本質なのに、1次元の縦リストに押し込めてしまっている。

---

## 2. デザインコンセプト

### 2.1 コアデザインフィロソフィー

**「意見の地形図(Opinion Landscape)」**

My Opinionを「タイムラインを読むSNS」から「意見の風景を探索するプラットフォーム」に変える。

原則:
1. **トピック・ファースト** -- 個人のフィードではなく、トピック(テーマ)がナビゲーションの起点
2. **多次元可視化** -- スコア分布・属性分布・コンセンサス度合いが常に視覚的に見える
3. **比較と発見** -- 「自分はどこに位置するか」が他者との文脈で見える
4. **データ・イズ・ビューティフル** -- チャート・ヒートマップ・スペクトラムがファーストクラスUI要素

### 2.2 カラーシステム

現在のteal-slateベースを維持しつつ、データ可視化色を強化する。

```
既存のprimary/secondary/accent/destructiveはそのまま維持。

追加セマンティックカラー:
--opinion-hot: oklch(0.58 0.14 25)     /* 反対寄り(0-30): ウォームレッド */
--opinion-warm: oklch(0.65 0.12 60)    /* やや反対(31-45): アンバー */
--opinion-neutral: oklch(0.65 0.06 230) /* 中立(46-55): グレイブルー */
--opinion-cool: oklch(0.62 0.10 160)   /* やや賛成(56-70): ティール */
--opinion-cold: oklch(0.55 0.12 160)   /* 賛成寄り(71-100): ディープグリーン */

属性カテゴリカラー（既存AttributeBadge色を踏襲）:
gender: rose
age_range: emerald
education: amber
occupation: sky
political_stance: indigo
political_party: purple
```

### 2.3 タイポグラフィ

変更なし。Geist Sans / Geist Mono を維持。ただし見出し階層を整理:
- ページタイトル: `text-xl font-bold`（現行 `text-lg`から引き上げ）
- セクションラベル: `text-xs font-semibold uppercase tracking-wider text-muted-foreground`（現行と同様）
- スコア数値: `text-4xl font-bold tabular-nums tracking-tight`（数値が主役の場面）

---

## 3. ページ別デザイン

### 3.1 ホーム -- 「トピックハブ」

**コンセプト**: 縦一列フィードを廃止。トピックカードのグリッドレイアウトをメインに。

```
┌─────────────────────────────────────────────┐
│  トピック                           [検索]    │  ← sticky header
├─────────────────────────────────────────────┤
│                                             │
│  ┌─── Featured Topic (全幅ヒーロー) ──────┐  │
│  │  「消費税15%に賛成？反対？」             │  │
│  │  ┌─────────────────────────────┐       │  │
│  │  │  コンセンサスメーター 42%    │       │  │
│  │  │  ████████░░░░░░░░░░░░       │       │  │
│  │  └─────────────────────────────┘       │  │
│  │  128人参加 ・ 256件の投稿               │  │
│  │  [この トピックに参加する]              │  │
│  └────────────────────────────────────────┘  │
│                                             │
│  注目のトピック                               │
│  ┌──────────────┐ ┌──────────────┐          │
│  │ 少子化対策    │ │ AI規制       │          │
│  │ 一致度: 67%  │ │ 一致度: 23%  │          │
│  │ ██████▓░░    │ │ ██░░░░░░░░   │          │
│  │ 45人 / 89件  │ │ 120人/ 340件 │          │
│  │ [上位意見]   │ │ [上位意見]   │          │
│  └──────────────┘ └──────────────┘          │
│  ┌──────────────┐ ┌──────────────┐          │
│  │ 夫婦別姓     │ │ 原発再稼働   │          │
│  │ 一致度: 34%  │ │ 一致度: 55%  │          │
│  │ ...          │ │ ...          │          │
│  └──────────────┘ └──────────────┘          │
│                                             │
│  フォロー中の最新                             │
│  ┌────── OpinionCard (コンパクト) ──────┐   │
│  │ 「消費税は段階的に...」               │   │
│  │  ┌─avg:62─── ●あなた:78──────┐       │   │
│  │  └──────────────────────────────┘     │   │
│  │  [男性][30代][会社員]  田中太郎 · 2h  │   │
│  └────────────────────────────────────────┘  │
│  (最大3件 + 「もっと見る→探索」)              │
└─────────────────────────────────────────────┘
```

**実装詳細**:

```tsx
/* ホームのレイアウト構造 */
<div className="space-y-8 p-4">
  {/* ヒーロー: Featured Topic */}
  <FeaturedTopicHero theme={featured} onParticipate={...} />

  {/* トピックグリッド: 2カラム (モバイル1列 / sm以上2列) */}
  <section>
    <SectionLabel>注目のトピック</SectionLabel>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {trending.map(theme => (
        <TopicCard key={theme.id} {...theme} />
      ))}
    </div>
  </section>

  {/* フォロー中の最新 - コンパクトカード (最大3件) */}
  <section>
    <SectionLabel>フォロー中の最新</SectionLabel>
    <div className="space-y-3">
      {posts.slice(0, 3).map(post => (
        <OpinionCardCompact key={post.id} {...post} />
      ))}
    </div>
    <Link href="/explore?tab=posts" className="...">もっと見る</Link>
  </section>
</div>
```

**TopicCard (新規コンポーネント)**: ThemeCardCompact を進化させる。

```tsx
/* TopicCard: グリッド用テーマカード */
<Link href={`/themes/${id}`}
  className="group flex flex-col rounded-2xl border bg-card p-5
             transition-all hover:-translate-y-1 hover:shadow-lg">
  <div className="flex items-center gap-2">
    <StatusBadge status={status} />
    <span className="text-xs text-muted-foreground">{participantCount}人参加</span>
  </div>
  <h3 className="mt-2 text-base font-bold line-clamp-2 group-hover:text-primary">
    {title}
  </h3>
  {description && (
    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{description}</p>
  )}
  {/* コンセンサスバー -- カード内で目立つ位置に */}
  <div className="mt-auto pt-4">
    <ConsensusMeterInline score={consensusScore} />
    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
      <span>{postCount}件の意見</span>
      <span className="text-primary font-medium">参加する &rarr;</span>
    </div>
  </div>
</Link>
```

### 3.2 探索（Explore）-- 「意見ランドスケープ」

**コンセプト**: 3タブ構成を維持しつつ、各タブのレイアウトを刷新。

```
┌─────────────────────────────────────────────┐
│  探索                                        │
├─────────────────────────────────────────────┤
│  [トピック]  [意見]  [ユーザー]               │  ← タブ
├─────────────────────────────────────────────┤
│  ┌ 視点フィルター ─────────────────────────┐ │
│  │ [性別▼] [年齢帯▼] [職業▼] [政治▼] [x]  │ │
│  └────────────────────────────────────────┘ │
│                                             │
│  === トピックタブ ===                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐    │
│  │ Topic 1  │ │ Topic 2  │ │ Topic 3  │    │  2-3カラムグリッド
│  │ 一致42%  │ │ 一致67%  │ │ 一致23%  │    │
│  └──────────┘ └──────────┘ └──────────┘    │
│                                             │
│  === 意見タブ ===                            │
│  [最新] [人気] [意見が割れている]             │  ← ソート追加
│                                             │
│  ┌─ OpinionTile ─┐ ┌─ OpinionTile ─┐      │
│  │「消費税は...」 │ │「少子化は...」│      │  マンソリー風 or
│  │ avg:62  128件  │ │ avg:34  45件  │      │  2カラムタイル
│  │ [男性][30代]   │ │ [女性][20代]  │      │
│  │                │ │              │      │
│  │  ┬──●──┬──────┤ │  ┬──────●──┬──┤      │
│  │  0    50   100│ │  0    50  100│      │
│  └────────────────┘ └───────────────┘      │
│                                             │
│  === ユーザータブ ===                        │
│  (現行のUserCardリストを維持、変更少)         │
└─────────────────────────────────────────────┘
```

**意見タブの新レイアウト: Masonry-style 2カラムタイル**

```tsx
/* 意見タブ: 2カラムMasonryレイアウト */
<div className="columns-1 gap-4 p-4 sm:columns-2">
  {posts.map(post => (
    <OpinionTile key={post.id} post={post} className="mb-4 break-inside-avoid" />
  ))}
</div>
```

**OpinionTile (新規コンポーネント)**: PostCardの代替。タイル形式。

```tsx
<article className="break-inside-avoid rounded-2xl border bg-card p-4
                    transition-all hover:-translate-y-0.5 hover:shadow-md">
  {/* テーマ名ラベル */}
  {themeName && (
    <span className="text-xs font-medium text-primary">{themeName}</span>
  )}

  {/* タイトル */}
  {title && (
    <h3 className="mt-1 text-sm font-bold line-clamp-2">{title}</h3>
  )}

  {/* 本文 (可変高さ → Masonry映え) */}
  <p className="mt-2 text-sm leading-relaxed line-clamp-6">{content}</p>

  {/* スコアバー: 水平スペクトラム */}
  <div className="mt-3">
    <ScoreSpectrum averageScore={averageScore} userScore={currentUserScore} />
    <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
      <span>{reactionCount}件の評価</span>
      <span>平均 {averageScore}</span>
    </div>
  </div>

  {/* 属性バッジ + 著者 */}
  <div className="mt-3 flex items-center gap-2">
    <div className="flex flex-wrap gap-1">
      {attributes.map(attr => (
        <AttributeBadge key={attr.type} type={attr.type} value={attr.value} size="sm" />
      ))}
    </div>
    <span className="ml-auto text-[11px] text-muted-foreground">
      {author.displayName}
    </span>
  </div>
</article>
```

**ソートに「意見が割れている」追加**: 既存の `latest` / `popular` に加えて `controversial`（averageScoreが50に近い＋reactionCountが多い）ソートを追加。

### 3.3 テーマ詳細 -- 「オピニオン・アリーナ」

**コンセプト**: テーマ詳細ページをアプリの最重要ページに据える。データ可視化をファーストビューに。

```
┌─────────────────────────────────────────────┐
│ [←] 消費税15%に賛成？反対？     [投稿受付中] │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─── コンセンサスダッシュボード ──────────┐  │
│  │                                       │  │
│  │  意見の一致度                          │  │
│  │  ████████████░░░░░░░░░  42%           │  │
│  │  「やや意見が分かれています」          │  │
│  │                                       │  │
│  │  ┌─ スコア分布ヒストグラム ────────┐  │  │
│  │  │  ▁▂▅▇█▇▅▃▂▁                   │  │  │
│  │  │  0   25   50   75   100        │  │  │
│  │  │        ▲あなた: 78             │  │  │
│  │  └────────────────────────────────┘  │  │
│  │                                       │  │
│  │  立場ごとの一致度                     │  │
│  │  男性  ████████░░  72%               │  │
│  │  女性  ████░░░░░░  38%               │  │
│  │  20代  ██████░░░░  55%               │  │
│  └───────────────────────────────────────┘  │
│                                             │
│  [みんなの声]  [意見マップ]                   │  ← タブ
│                                             │
│  ┌ 視点フィルター ─────────────────────┐     │
│  │ [性別▼] [年齢帯▼] [職業▼] [政治▼]  │     │
│  └────────────────────────────────────┘     │
│                                             │
│  [この トピックに意見を書く]                  │
│                                             │
│  ┌─ OpinionTile ─┐ ┌─ OpinionTile ─┐      │
│  │ (Masonry風)   │ │              │      │  2カラムタイル
│  └────────────────┘ └───────────────┘      │
│  ...                                        │
└─────────────────────────────────────────────┘
```

**スコア分布ヒストグラム (新規コンポーネント)**: `ScoreDistribution`

```tsx
interface ScoreDistributionProps {
  distribution: number[];  /* 10個のbin: [0-9, 10-19, ..., 90-100] */
  userScore: number | null;
  averageScore: number | null;
}

/* 実装: 10本のバーを並べたミニヒストグラム */
<div className="flex items-end gap-0.5 h-16">
  {distribution.map((count, i) => {
    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
    const binCenter = i * 10 + 5;
    return (
      <div key={i} className="flex-1 flex flex-col items-center">
        <div
          className={cn(
            "w-full rounded-t transition-all duration-500",
            getOpinionColor(binCenter)  /* hot/warm/neutral/cool/cold */
          )}
          style={{ height: `${height}%`, minHeight: count > 0 ? '2px' : '0' }}
        />
      </div>
    );
  })}
</div>
{/* ユーザーマーカー・平均マーカーを絶対配置でオーバーレイ */}
```

**バックエンドAPI必要**: `GET /api/themes/:id/consensus` のレスポンスに `distribution: number[]` (10-bin histogram) を追加する。

### 3.4 投稿詳細 -- 「ディープダイブ」

基本構造は現行を維持するが、PostCardをOpinionTile風のリッチなビューに変更。

```
┌─────────────────────────────────────────────┐
│ [←] 投稿                                    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─── メイン投稿 (拡大表示) ────────────┐   │
│  │  [少子化対策]                        │   │
│  │                                     │   │
│  │  「少子化対策として最も効果的なのは   │   │
│  │   ...」                             │   │
│  │                                     │   │
│  │  ┌─ スコアスペクトラム ───────────┐  │   │
│  │  │ 😟 ──●avg:62──────●you:78──── 😊│  │   │
│  │  │      128件の評価               │  │   │
│  │  └──────────────────────────────┘  │   │
│  │                                     │   │
│  │  [男性][30代][会社員][やや右派]      │   │
│  │  田中太郎 @tanaka · 2時間前         │   │
│  │                                     │   │
│  │  [返信する] [分析を見る]            │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  返信 (3件)                                  │
│  ┌─ ReplyCard (コンパクト) ────────────┐    │
│  │  内容... | [属性] | 著者 · 時刻     │    │
│  └─────────────────────────────────────┘    │
│  ...                                        │
└─────────────────────────────────────────────┘
```

変更点:
- メイン投稿はリアクションスライダーを大きく表示（h-8に拡大）
- スコアスペクトラムに平均マーカーとユーザーマーカーの両方表示
- 属性バッジを目立つ位置に
- 返信はコンパクトカード（PostCardのvariant="compact"）

### 3.5 ユーザープロフィール -- 「スタンスポートレート」

**コンセプト**: 属性とポジションマップを前面に。投稿リストよりもスタンスの可視化を重視。

```
┌─────────────────────────────────────────────┐
│  ┌─ gradient banner ────────────────────┐   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│  (avatar)  田中太郎                        │
│            @tanaka                         │
│            「経済政策に関心があります。      │
│             IT企業勤務。」                   │
│                                             │
│  ┌ 属性パネル(目立つグリッド) ────────────┐  │
│  │ ┌──────┐┌──────┐┌──────┐             │  │
│  │ │ 男性 ││30代  ││会社員│             │  │
│  │ │rose  ││green ││sky  │             │  │
│  │ └──────┘└──────┘└──────┘             │  │
│  │ ┌──────────┐┌──────────┐             │  │
│  │ │やや右派  ││自民党    │             │  │
│  │ │indigo    ││purple    │             │  │
│  │ └──────────┘└──────────┘             │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  12 フォロー中 ・ 48 フォロワー              │
│                                             │
│  ┌── ポジションマップ(レーダー) ───────┐    │  自分のプロフィールのみ
│  │        (radar chart)                │    │
│  │  視野スコア: 72  「幅ひろい」        │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  [意見]  [リアクション傾向]                   │  ← タブ (新規追加)
│                                             │
│  ┌─ OpinionTile ─┐ ┌─ OpinionTile ─┐      │  2カラムタイル
│  └────────────────┘ └───────────────┘      │
└─────────────────────────────────────────────┘
```

変更点:
- 属性バッジを小さなpillから「属性パネル」(グリッドレイアウトの大きめカード)に昇格
- ポジションマップ（レーダーチャート）をプロフィール本文の直下に配置（設定の奥ではなく）
- 投稿リストはMasonryタイル形式に変更

**属性パネル (新規コンポーネント)**: `AttributePanel`

```tsx
<div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
  {publicAttrs.map(attr => (
    <div key={attr.type}
      className={cn(
        "rounded-xl border p-3 text-center",
        attributePanelStyles[attr.type]  /* AttributeBadgeの色を背景に拡大 */
      )}>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
        {attributeTypeLabels[attr.type]}
      </span>
      <p className="mt-0.5 text-sm font-bold">{attr.value}</p>
    </div>
  ))}
</div>
```

### 3.6 通知

現行のデザインは十分に良い。微調整のみ:
- 未読通知のハイライトカラーを少し強くする（`bg-primary/[0.03]` → `bg-primary/[0.06]`）
- 通知アイコンをリアクションスコアを含む場合はスコア数値で置換（「田中さんがあなたの意見に 78 で評価しました」の78を大きく表示）
- グルーピング: 同じ投稿への通知をまとめる（将来実装）

### 3.7 設定系

現行のデザインを維持。変更点:
- 「わたしの立ち位置」ページ（エコーチェンバー）のレーダーチャートを全幅に拡大
- スコア分布チャートにアニメーション追加（`animate-bar-grow`活用）

---

## 4. コンポーネント設計

### 4.1 レイアウト（AppShell/Header/Nav）

**変更のポイント**: 左サイドバーのナビゲーションパターンを「トピック中心」に再構成。

#### AppShell (変更)

```
Desktop (lg+):
┌──────┬──────────────────────┬──────────┐
│ Left │      Center          │  Right   │
│ 240px│      640px           │  320px   │
│      │                      │          │
│ Nav  │   Page Content       │ Position │
│ +    │                      │ Map Mini │
│Topic │                      │ +        │
│List  │                      │ Compose  │
│      │                      │ Panel    │
└──────┴──────────────────────┴──────────┘

Mobile:
┌────────────────────────┐
│  Header (sticky)       │
├────────────────────────┤
│                        │
│  Page Content          │
│  (full width)          │
│                        │
├────────────────────────┤
│  BottomNav (fixed)     │
└────────────────────────┘
```

中央幅を600px→640pxに拡張（2カラムタイルに対応するため）。

#### Sidebar (変更)

左サイドバーは「ナビ + トピック速報」構成に。禁止事項の「左サイドバーにナビアイコンを並べるパターン」からの脱却:

```tsx
<aside className="sticky top-0 flex h-screen flex-col overflow-y-auto">
  {/* ロゴ */}
  <div className="flex h-14 items-center px-5">
    <Link href="/home" className="text-xl font-bold text-primary">
      My Opinion
    </Link>
  </div>

  {/* メインナビ: テキストリンク (アイコン小さめ or なし) */}
  <nav className="px-3 py-2">
    <NavLink href="/home" label="ホーム" />
    <NavLink href="/explore" label="探索" />
    <NavLink href="/notifications" label="通知" badge={unreadCount} />
    <NavLink href="/profile" label="マイページ" />
  </nav>

  <Separator />

  {/* トピック速報セクション (新規) */}
  <div className="flex-1 overflow-y-auto px-3 py-3">
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
      アクティブなトピック
    </p>
    {activeThemes.map(theme => (
      <TopicNavItem key={theme.id} theme={theme} />
    ))}
  </div>

  {/* 投稿ボタン + 設定 */}
  <div className="border-t p-3 space-y-2">
    <Button className="w-full rounded-xl" asChild>
      <Link href="/compose">意見を書く</Link>
    </Button>
    <div className="flex items-center justify-between">
      <NavLink href="/settings" label="設定" small />
      <ThemeToggle />
    </div>
  </div>
</aside>
```

`NavLink`は現行のButton+Linkよりもシンプルなテキストリンクに:

```tsx
function NavLink({ href, label, badge, small }: {
  href: string; label: string; badge?: number; small?: boolean
}) {
  const isActive = pathname.startsWith(href);
  return (
    <Link href={href}
      className={cn(
        "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
        small && "text-xs px-2 py-1.5",
        isActive
          ? "bg-primary/10 font-semibold text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}>
      {label}
      {badge != null && badge > 0 && (
        <span className="rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}
```

`TopicNavItem`: サイドバー内のトピックミニカード。

```tsx
function TopicNavItem({ theme }: { theme: { id: string; title: string; consensusScore: number; status: string } }) {
  return (
    <Link href={`/themes/${theme.id}`}
      className="block rounded-lg px-2 py-2 transition-colors hover:bg-accent">
      <p className="text-sm font-medium line-clamp-1">{theme.title}</p>
      <ConsensusMeterMini score={theme.consensusScore} />
    </Link>
  );
}
```

#### BottomNav (微調整)

5アイコンを4アイコン + 中央FABに変更:

```
[ホーム]  [探索]  [+FAB]  [通知]  [マイページ]
```

FAB（Floating Action Button）で投稿モーダルを開く。現行のCompose部分はFABとして視覚的に差別化する。

```tsx
/* FABの代わりに中央を浮かせるデザイン */
{isCompose ? (
  <button onClick={() => setComposeOpen(true)}
    className="relative -top-3 flex h-14 w-14 items-center justify-center
               rounded-2xl bg-primary text-primary-foreground shadow-lg
               transition-transform active:scale-90">
    <PenSquare className="h-6 w-6" />
  </button>
) : (
  /* 通常のナビアイテム */
)}
```

### 4.2 投稿カード（PostCard）の新デザイン

既存の `PostCard` は維持しつつ、新しい `OpinionTile` と `OpinionCardCompact` を追加。

#### OpinionTile (新規、メインの投稿表示)

Masonry レイアウト向け。break-inside-avoid で高さ可変。

```tsx
interface OpinionTileProps {
  id: string;
  author: { handle: string; displayName: string; avatarUrl: string | null; attributes: PostAttribute[] };
  title?: string | null;
  content: string;
  createdAt: string;
  reactionCount: number;
  averageScore: number | null;
  currentUserScore: number | null;
  themeName?: string;
  isOwnPost?: boolean;
  onReaction?: (score: number) => void;
  onReactionRemove?: () => void;
}

export function OpinionTile({ ... }: OpinionTileProps) {
  return (
    <article
      className="break-inside-avoid rounded-2xl border bg-card
                 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="p-4">
        {/* テーマ名 */}
        {themeName && (
          <Link href={...} className="text-xs font-medium text-primary hover:underline">
            {themeName}
          </Link>
        )}

        {/* タイトル */}
        {title && (
          <Link href={`/posts/${id}`}>
            <h3 className="mt-1 text-base font-bold leading-snug hover:text-primary">
              {title}
            </h3>
          </Link>
        )}

        {/* 本文 */}
        <Link href={`/posts/${id}`} className="block mt-2">
          <PostContent
            content={content}
            className="text-sm leading-relaxed line-clamp-8"
          />
        </Link>

        {/* スコアスペクトラム */}
        <div className="mt-4">
          <ScoreSpectrum
            averageScore={averageScore}
            userScore={currentUserScore}
            reactionCount={reactionCount}
          />
        </div>

        {/* 属性バッジ行 */}
        {author.attributes.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {author.attributes.map(attr => (
              <AttributeBadge key={attr.type} {...attr} size="sm" />
            ))}
          </div>
        )}

        {/* 著者 + 時刻 */}
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Link href={`/users/${author.handle}`} className="flex items-center gap-1.5 hover:text-foreground">
            <UserAvatar src={author.avatarUrl} displayName={author.displayName} size="xs" />
            <span>{author.displayName}</span>
          </Link>
          <span className="ml-auto">{formatRelativeTime(createdAt)}</span>
        </div>
      </div>

      {/* インタラクションバー (タイル下部) */}
      <div className="flex items-center border-t px-4 py-2">
        <ReactionSlider
          value={currentUserScore}
          onChange={onReaction}
          onRemove={onReactionRemove}
          disabled={isOwnPost}
          showAverage
          averageScore={averageScore}
        />
      </div>
    </article>
  );
}
```

#### OpinionCardCompact (新規、ホームでの3件表示用)

```tsx
export function OpinionCardCompact({ ... }) {
  return (
    <Link href={`/posts/${id}`}
      className="flex gap-3 rounded-xl border bg-card p-3 transition-all
                 hover:bg-accent/30 hover:shadow-sm">
      {/* 左: スコアインジケーター (縦バー) */}
      <div className="flex w-8 flex-col items-center gap-1">
        <div className="h-full w-1.5 rounded-full bg-muted overflow-hidden">
          <div className={cn("w-full rounded-full transition-all",
                             getOpinionBgColor(averageScore))}
               style={{ height: `${averageScore ?? 0}%` }} />
        </div>
        <span className="text-[10px] font-bold tabular-nums">{averageScore ?? '--'}</span>
      </div>

      {/* 右: コンテンツ */}
      <div className="min-w-0 flex-1">
        {title && <p className="text-sm font-bold line-clamp-1">{title}</p>}
        <p className="text-sm text-muted-foreground line-clamp-2">{content}</p>
        <div className="mt-2 flex items-center gap-1.5">
          {attributes.slice(0, 3).map(attr => (
            <AttributeBadge key={attr.type} {...attr} size="sm" />
          ))}
          <span className="ml-auto text-[11px] text-muted-foreground">
            {author.displayName} · {formatRelativeTime(createdAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}
```

### 4.3 リアクションUI

#### ReactionSlider (変更なし)
現行の実装は高品質。変更不要。

#### ScoreSpectrum (新規、読み取り専用のスコア表示)

OpinionTile/OpinionCardCompact 内で使用。スライダーではなく、静的なスペクトラム表示。

```tsx
interface ScoreSpectrumProps {
  averageScore: number | null;
  userScore: number | null;
  reactionCount: number;
}

export function ScoreSpectrum({ averageScore, userScore, reactionCount }: ScoreSpectrumProps) {
  return (
    <div className="space-y-1">
      {/* トラック */}
      <div className="relative h-2 rounded-full bg-gradient-to-r from-rose-200 via-amber-200 to-emerald-200
                      dark:from-rose-900/40 dark:via-amber-900/40 dark:to-emerald-900/40">
        {/* 平均マーカー */}
        {averageScore != null && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
               style={{ left: `${averageScore}%` }}>
            <div className="h-3.5 w-1 rounded-full bg-foreground/60" />
          </div>
        )}
        {/* ユーザーマーカー */}
        {userScore != null && (
          <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
               style={{ left: `${userScore}%` }}>
            <div className="h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm" />
          </div>
        )}
      </div>
      {/* ラベル */}
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>{reactionCount > 0 ? `平均 ${averageScore}` : ''}</span>
        <span>{reactionCount}件</span>
      </div>
    </div>
  );
}
```

### 4.4 テーマ関連コンポーネント

#### FeaturedTopicHero (新規)

ホームページのヒーロー枠。ThemeFeaturedCardを大型化。

```tsx
export function FeaturedTopicHero({ theme, onParticipate }: { theme: ThemeWithConsensus; onParticipate: () => void }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border bg-card">
      {/* 背景グラデーション */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

      <div className="relative p-6">
        <Badge variant={theme.status === 'active' ? 'default' : 'secondary'}>
          {theme.status === 'active' ? '投稿受付中' : '終了'}
        </Badge>

        <h2 className="mt-3 text-xl font-bold sm:text-2xl">{theme.title}</h2>

        {theme.description && (
          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
            {theme.description}
          </p>
        )}

        {/* コンセンサスメーター (カード内に大きく) */}
        <div className="mt-5">
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold tabular-nums", getScoreColor(theme.consensusScore))}>
              {theme.consensusScore}%
            </span>
            <span className="text-sm text-muted-foreground">一致度</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-all duration-700", getBarColor(theme.consensusScore))}
                 style={{ width: `${theme.consensusScore}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
          <span>{theme.participantCount}人参加</span>
          <span>{theme.postCount}件の意見</span>
        </div>

        {theme.status === 'active' && (
          <Button onClick={onParticipate} className="mt-5 rounded-xl" size="lg">
            このトピックに参加する
          </Button>
        )}
      </div>
    </div>
  );
}
```

#### TopicCard (新規)

ホーム・探索のグリッドで使うカード。4.1のホーム設計に記載済み。

#### ConsensusMeter (微調整)

現行を維持しつつ、`ScoreDistribution` ヒストグラムを追加オプションとして受け取れるようにする。

```tsx
interface ConsensusMeterProps {
  score: number;
  label?: string;
  attributeBreakdown?: { attribute: string; label: string; score: number }[];
  distribution?: number[];  /* 新規追加: 10-bin histogram */
  userScore?: number | null; /* 新規追加 */
}
```

#### OpinionSpectrum (変更なし)

rechart の散布図。そのまま維持。テーマ詳細の「意見マップ」タブで引き続き使用。

### 4.5 属性表示・フィルタリング

#### AttributeBadge (変更なし)

現行の色分けが良い。そのまま維持。

#### AttributePanel (新規、プロフィール用)

3.5 に記載済み。属性をグリッドで大きく表示するパネル。

#### AttributeLensBar (変更なし)

現行のポップオーバー式フィルターバーを維持。属性フィルター適用時にアニメーション(`animate-lens-switch`)を追加するのみ。

---

## 5. バックエンド・DB影響範囲

### 5.1 新規/変更が必要なAPI

| API | メソッド | 目的 | 変更種別 |
|---|---|---|---|
| `GET /api/themes/featured` | GET | ホームのヒーロー+トレンド取得 | 既存 (変更なし) |
| `GET /api/themes` | GET | サイドバーのアクティブトピック一覧 | 既存 (変更なし) |
| `GET /api/themes/:id/consensus` | GET | distribution (10-bin histogram) を追加 | **変更** |
| `GET /api/timeline/explore` | GET | `sort=controversial` ソート追加 | **変更** |
| `GET /api/users/:handle/posts` | GET | ユーザー投稿一覧 | 既存 (Post-MVP TODO) |

### 5.2 DB変更要件

**なし。** 全てのデータは既存テーブルから集計可能。

- `distribution` ヒストグラムは `reactions` テーブルの `score` カラムを10-bin集計するだけ
- `controversial` ソートは `AVG(score)` が50に近い＋ `COUNT(reactions)` が多い投稿を上位にするクエリ
- 新規テーブル・カラム追加は不要

---

## 6. 実装優先順位

### Phase 1: コアコンポーネント刷新 (最優先)

1. **ScoreSpectrum** -- 新規。OpinionTile/OpinionCardCompactの基盤
2. **OpinionTile** -- 新規。PostCardの代替(Masonry用)
3. **OpinionCardCompact** -- 新規。ホームのコンパクト表示用
4. **TopicCard** -- 新規 or ThemeCardCompact改修。グリッド用テーマカード
5. **FeaturedTopicHero** -- ThemeFeaturedCardの大型化版

### Phase 2: ページレイアウト刷新

6. **ホームページ** -- TopicCardグリッド + OpinionCardCompact (タイムライン縦一列廃止)
7. **探索ページ** -- 意見タブのMasonryレイアウト + controversialソート
8. **テーマ詳細ページ** -- コンセンサスダッシュボード + ScoreDistribution + Masonryタイル

### Phase 3: レイアウト・ナビ刷新

9. **Sidebar** -- トピック速報リスト追加、テキストベースナビに変更
10. **BottomNav** -- FABデザインの中央ボタン
11. **AppShell** -- 中央幅640pxに拡張

### Phase 4: プロフィール・詳細ページ

12. **AttributePanel** -- プロフィール用属性グリッド
13. **ユーザープロフィール** -- 属性パネル + Masonryタイル
14. **投稿詳細** -- 拡大スコアスペクトラム + コンパクト返信

### Phase 5: バックエンド対応

15. **consensus API** -- distribution histogram追加
16. **explore API** -- controversial ソート追加
17. **users/:handle/posts API** -- プロフィール投稿一覧(Post-MVP TODO)

### 注意事項

- 既存の `PostCard` は削除せず、`OpinionTile` と並存させる。投稿詳細ページの返信やレガシー表示で引き続き使う。
- `ReactionSlider` は変更しない。品質が高いため維持。
- カラーシステムの `--opinion-*` 変数は `globals.css` に追加する。
- Masonryレイアウトは CSS `columns` プロパティで実現する(ライブラリ不要)。
- `recharts` は既にインストール済みのため、ScoreDistribution ヒストグラムも `recharts` の `BarChart` で実装可能。
