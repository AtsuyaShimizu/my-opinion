-- =============================================================
-- 00003_create_indexes.sql
-- My Opinion - インデックス定義
-- =============================================================

-- =============================================================
-- posts
-- =============================================================
-- タイムライン表示: ユーザー別の投稿一覧（フォロー中ユーザーの投稿取得）
CREATE INDEX idx_posts_user_id ON posts (user_id);

-- タイムライン表示: 時系列ソート
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);

-- 返信スレッド表示: 元投稿に対する返信の取得
CREATE INDEX idx_posts_parent_post_id ON posts (parent_post_id)
  WHERE parent_post_id IS NOT NULL;

-- リポスト元の取得
CREATE INDEX idx_posts_repost_of_id ON posts (repost_of_id)
  WHERE repost_of_id IS NOT NULL;

-- ユーザー別の時系列投稿取得（複合インデックス）
CREATE INDEX idx_posts_user_id_created_at ON posts (user_id, created_at DESC);

-- =============================================================
-- reactions
-- =============================================================
-- 投稿に対する評価一覧の取得
CREATE INDEX idx_reactions_post_id ON reactions (post_id);

-- ユーザー別の評価一覧
CREATE INDEX idx_reactions_user_id ON reactions (user_id);

-- 投稿ごとの評価タイプ別集計（Good数/Bad数のカウント）
CREATE INDEX idx_reactions_post_id_type ON reactions (post_id, reaction_type);

-- =============================================================
-- follows
-- =============================================================
-- フォロー中ユーザーの一覧（自分がフォローしている人）
CREATE INDEX idx_follows_follower_id ON follows (follower_id);

-- フォロワー一覧（自分をフォローしている人）
CREATE INDEX idx_follows_following_id ON follows (following_id);

-- (follower_id, following_id) のUNIQUE制約はテーブル定義で設定済み

-- =============================================================
-- notifications
-- =============================================================
-- ユーザー別の通知一覧
CREATE INDEX idx_notifications_user_id ON notifications (user_id);

-- 未読通知の取得
CREATE INDEX idx_notifications_user_id_is_read ON notifications (user_id, is_read)
  WHERE is_read = false;

-- 通知の時系列ソート
CREATE INDEX idx_notifications_created_at ON notifications (created_at DESC);

-- ユーザー別の通知（時系列、未読優先）
CREATE INDEX idx_notifications_user_id_created_at ON notifications (user_id, created_at DESC);

-- =============================================================
-- invite_codes
-- =============================================================
-- code の UNIQUE制約はテーブル定義で設定済み（暗黙的にインデックスが作成される）

-- 未使用の招待コード検索
CREATE INDEX idx_invite_codes_created_by ON invite_codes (created_by);

-- =============================================================
-- consent_records
-- =============================================================
-- ユーザー別の同意記録
CREATE INDEX idx_consent_records_user_id ON consent_records (user_id);

-- =============================================================
-- user_attributes
-- =============================================================
-- user_id の UNIQUE制約はテーブル定義で設定済み（暗黙的にインデックスが作成される）

-- =============================================================
-- theme_posts
-- =============================================================
-- テーマ別の投稿取得
CREATE INDEX idx_theme_posts_theme_id ON theme_posts (theme_id);

-- 投稿が紐付いているテーマの取得
CREATE INDEX idx_theme_posts_post_id ON theme_posts (post_id);

-- =============================================================
-- reports
-- =============================================================
-- ステータス別の通報一覧（管理者画面用）
CREATE INDEX idx_reports_status ON reports (status);

-- 通報対象別の検索
CREATE INDEX idx_reports_target ON reports (target_type, target_id);

-- =============================================================
-- admin_actions
-- =============================================================
-- 管理者アクション履歴
CREATE INDEX idx_admin_actions_target ON admin_actions (target_type, target_id);
CREATE INDEX idx_admin_actions_created_at ON admin_actions (created_at DESC);
