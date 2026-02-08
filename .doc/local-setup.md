# My Opinion - ローカル環境構築手順書

## このアプリの全体像

My Opinion は以下の3つのサービスが連携して動作する Web アプリケーションです。

```
┌─────────────────────────────────────────────────────┐
│  あなたのPC（ローカル環境）                            │
│                                                     │
│  ┌──────────────┐    ┌────────────────────────────┐ │
│  │  Next.js     │    │  Supabase（Docker上で動作） │ │
│  │  開発サーバー  │───→│                            │ │
│  │              │    │  ├ PostgreSQL（データベース） │ │
│  │ Webアプリ本体  │    │  ├ Auth（ユーザー認証）     │ │
│  │ localhost:3000│    │  ├ Storage（画像保存）      │ │
│  │              │    │  ├ Studio（DB管理画面）     │ │
│  └──────────────┘    │  └ Inbucket（テストメール）  │ │
│                      │    localhost:54321〜54324    │ │
│                      └────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

| サービス | 役割 | 起動後のURL |
|---------|------|------------|
| **Next.js 開発サーバー** | アプリ本体（画面 + API） | http://localhost:3000 |
| **Supabase** | データベース、認証、画像保存をまとめて提供するバックエンドサービス。Docker コンテナとして動作する | http://127.0.0.1:54321 |
| **Supabase Studio** | Supabase の管理画面。ブラウザでテーブルの中身を見たり、ユーザーを確認できる | http://127.0.0.1:54323 |
| **Inbucket** | ローカル専用のダミーメールサーバー。新規登録時の確認メールがここに届く | http://127.0.0.1:54324 |

---

## STEP 0: 必要なソフトウェアの確認

以下の3つがインストールされている必要があります。

### Node.js（v18 以上）

JavaScript の実行環境。Next.js を動かすために必要。

```bash
node --version
# v22.19.0 のように表示されればOK
```

インストールされていない場合: https://nodejs.org/ からLTS版をダウンロード

### Docker Desktop

Supabase のローカル環境（データベースなど）を動かすコンテナ基盤。

```bash
docker --version
# Docker version 29.1.2 のように表示されればOK
```

インストールされていない場合: https://www.docker.com/products/docker-desktop/ からダウンロード

**起動確認**: Docker Desktop アプリを開いて、左下に「Engine running」（緑色）と表示されていること。

### Supabase CLI

Supabase をローカルで動かすためのコマンドラインツール。

```bash
supabase --version
# 2.x.x のように表示されればOK
```

インストールされていない場合:
```bash
brew install supabase/tap/supabase
```

> Homebrew がない場合は https://brew.sh/ を先にインストールしてください。

---

## STEP 1: npm パッケージのインストール

アプリが使用するライブラリ（React, Tailwind CSS など）をダウンロードします。

```bash
cd /Users/atsuya/projects/my-opinion
npm install
```

`node_modules/` フォルダが作成され、数百MBのファイルがダウンロードされます（初回のみ時間がかかります）。

---

## STEP 2: Supabase ローカル環境を起動する

### 2-1. プロジェクトの初期化（初回のみ）

```bash
supabase init
```

`supabase/config.toml` が生成されます。既にある場合はスキップしてOKです。

### 2-2. Supabase を起動

**Docker Desktop が起動していることを確認してから**実行してください。

```bash
supabase start
```

初回は Docker イメージのダウンロードが入るため **5〜10分** かかります。2回目以降は30秒程度です。

完了すると以下のような情報が表示されます:

```
╭──────────────────────────────────────────────────────╮
│ 🔑 Authentication Keys                               │
├─────────────┬────────────────────────────────────────┤
│ Publishable │ sb_publishable_xxxxx...                │
│ Secret      │ sb_secret_xxxxx...                     │
╰─────────────┴────────────────────────────────────────╯
```

**この `Publishable` と `Secret` を次のステップで使います。**

| キーの種類 | 環境変数名 |
|----------|----------|
| **Publishable** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **Secret** | `SUPABASE_SERVICE_ROLE_KEY` |

> 忘れた場合は `supabase status` でいつでも再表示できます。

### 2-3. 起動の確認

ブラウザで http://127.0.0.1:54323 を開き、Supabase Studio の画面が表示されればOKです。

---

## STEP 3: 環境変数を設定する

アプリが Supabase に接続するための情報を `.env.local` ファイルに書き込みます。

### 3-1. テンプレートをコピー

```bash
cp .env.local.example .env.local
```

### 3-2. `.env.local` を編集

お好みのエディタで `.env.local` を開き、STEP 2 で表示された値に書き換えます。

```env
# Supabase ローカル環境（supabase status の出力値を転記する）
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx...（Publishable キー）
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxxxx...（Secret キー）
```

| 変数名 | 何に使うか | supabase status での名前 |
|--------|----------|----------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase API のアドレス | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ブラウザから Supabase にアクセスするための公開キー | **Publishable** |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー側で管理者権限の操作（通知作成など）に使う秘密キー | **Secret** |

---

## STEP 4: データベースにテーブルを作成する

マイグレーションファイル（SQLファイル）を実行して、データベースにテーブルを作成します。

```bash
supabase db reset
```

以下の3ファイルが順番に実行されます:

| ファイル | 内容 |
|---------|------|
| `00001_create_tables.sql` | users, posts, reactions など12テーブルを作成 |
| `00002_create_rls_policies.sql` | 行レベルセキュリティ（誰がどのデータを見れるか）を設定 |
| `00003_create_indexes.sql` | 検索を高速化するインデックスを作成 |

### 確認方法

1. ブラウザで http://127.0.0.1:54323 （Supabase Studio）を開く
2. 左メニューの「Table Editor」をクリック
3. `users`, `posts`, `reactions` などのテーブルが一覧に表示されていればOK

---

## STEP 5: 開発サーバーを起動する

```bash
npm run dev
```

以下のように表示されれば起動成功です:

```
   ▲ Next.js 16.x.x
   - Local:   http://localhost:3000
   - Ready in xxxms
```

ブラウザで http://localhost:3000 を開いてください。

---

## STEP 6: 動作確認

### 画面の確認

| URL | 何が表示されるか |
|-----|---------------|
| http://localhost:3000 | ランディングページ（サービス紹介） |
| http://localhost:3000/signup | 新規登録画面 |
| http://localhost:3000/login | ログイン画面 |
| http://localhost:3000/terms | 利用規約 |
| http://localhost:3000/privacy | プライバシーポリシー |

### 新規登録〜ログインのテスト

1. http://localhost:3000/signup を開く
2. テスト用の情報を入力して登録
   - 招待コードが必要な場合は、Supabase Studio で `invite_codes` テーブルに手動で1行追加する
3. http://127.0.0.1:54324 （Inbucket）を開く
4. 確認メールが届いているので、メール内のリンクをクリック
5. http://localhost:3000/login からログイン

> **Inbucket とは**: ローカル開発用のダミーメールサーバーです。本番環境では実際のメールが送信されますが、ローカルでは全てのメールがここに届きます。Gmail などの実際のメールアドレスを使う必要はありません（`test@example.com` のような適当なアドレスでOK）。

---

## 日常の開発フロー

毎回の開発作業では、以下の2つを起動するだけでOKです。

```bash
# 1. Supabase を起動（Docker Desktop が起動済みであること）
supabase start

# 2. Next.js 開発サーバーを起動
npm run dev
```

作業が終わったら:

```bash
# Next.js は Ctrl+C で停止

# Supabase を停止（Docker コンテナを止める）
supabase stop
```

---

## よく使うコマンド

### アプリ関連

| コマンド | 用途 |
|---------|------|
| `npm run dev` | 開発サーバー起動（ファイル変更で自動リロード） |
| `npm run build` | 本番用ビルド（デプロイ前の確認に使う） |
| `npm run lint` | コードの書き方チェック |
| `npm run type-check` | TypeScript の型エラーチェック |

### Supabase 関連

| コマンド | 用途 |
|---------|------|
| `supabase start` | ローカル Supabase を起動 |
| `supabase stop` | ローカル Supabase を停止 |
| `supabase status` | 接続URL・キーを再表示 |
| `supabase db reset` | DB を初期化してマイグレーションを再適用 |
| `supabase migration new 名前` | 新しいマイグレーションファイルを作成 |

---

## トラブルシューティング

### `supabase start` が失敗する

**原因1: Docker が起動していない**
```bash
docker info
# "Cannot connect to the Docker daemon" と出たら Docker Desktop を起動する
```

**原因2: ポートが他のアプリに使われている**
```bash
lsof -i :54321
# 何か表示されたら、そのアプリを停止するか、supabase/config.toml でポートを変更する
```

**原因3: Docker のメモリ不足**
Docker Desktop → Settings → Resources → Memory を **4GB以上** に設定してください。

### 登録時にメールが届かない

ローカル環境では実際のメールは送信されません。代わりに Inbucket を確認してください:
1. http://127.0.0.1:54324 をブラウザで開く
2. 左側のメールボックスに確認メールが届いている

### 画面が真っ白 / エラーが出る

```bash
# 環境変数が正しく設定されているか確認
cat .env.local

# 開発サーバーを再起動（.env.local の変更はサーバー再起動が必要）
# Ctrl+C で停止してから
npm run dev
```

### DB にテーブルがない

```bash
# マイグレーションを再適用（データは全て削除されます）
supabase db reset
```

### 「招待コードが無効です」と表示される

Supabase Studio（http://127.0.0.1:54323）で招待コードを手動作成します:

1. Table Editor → `invite_codes` を開く
2. 「Insert row」をクリック
3. 以下を入力して保存:
   - `code`: `TESTCODE` （8文字の英数字）
   - `created_by`: 管理者ユーザーのUUID（なければ任意のUUID）
   - `expires_at`: 未来の日付（例: `2026-12-31T00:00:00Z`）
