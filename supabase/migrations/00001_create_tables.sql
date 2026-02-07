-- =============================================================
-- 00001_create_tables.sql
-- My Opinion - テーブル定義
-- =============================================================

-- UUIDを生成するためのpgcrypto拡張を有効化（gen_random_uuid()を使用）
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================================
-- 1. users - ユーザー基本情報
-- =============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  user_handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  CONSTRAINT users_user_handle_format CHECK (
    user_handle ~ '^[a-zA-Z0-9_]{3,20}$'
  ),
  CONSTRAINT users_display_name_length CHECK (
    char_length(display_name) BETWEEN 1 AND 30
  ),
  CONSTRAINT users_bio_length CHECK (
    bio IS NULL OR char_length(bio) <= 160
  ),
  CONSTRAINT users_status_check CHECK (
    status IN ('active', 'suspended', 'banned', 'withdrawn')
  )
);

-- =============================================================
-- 2. user_attributes - ユーザー属性情報
-- =============================================================
CREATE TABLE user_attributes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- 属性値
  gender TEXT,
  age_range TEXT,
  education TEXT,
  occupation TEXT,
  political_party TEXT,
  political_stance TEXT,

  -- 各属性の公開フラグ
  is_gender_public BOOLEAN NOT NULL DEFAULT false,
  is_age_range_public BOOLEAN NOT NULL DEFAULT false,
  is_education_public BOOLEAN NOT NULL DEFAULT false,
  is_occupation_public BOOLEAN NOT NULL DEFAULT false,
  is_political_party_public BOOLEAN NOT NULL DEFAULT false,
  is_political_stance_public BOOLEAN NOT NULL DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_attributes_gender_check CHECK (
    gender IS NULL OR gender IN ('male', 'female', 'other', 'no_answer')
  ),
  CONSTRAINT user_attributes_age_range_check CHECK (
    age_range IS NULL OR age_range IN (
      '18-24', '25-29', '30-34', '35-39', '40-44',
      '45-49', '50-54', '55-59', '60-64', '65_and_over'
    )
  ),
  CONSTRAINT user_attributes_education_check CHECK (
    education IS NULL OR education IN (
      'junior_high', 'high_school', 'vocational', 'junior_college',
      'university', 'masters', 'doctorate', 'other'
    )
  ),
  CONSTRAINT user_attributes_occupation_check CHECK (
    occupation IS NULL OR occupation IN (
      'company_employee', 'civil_servant', 'self_employed', 'executive',
      'professional', 'educator_researcher', 'student', 'homemaker',
      'part_time', 'unemployed', 'retired', 'other'
    )
  ),
  CONSTRAINT user_attributes_political_party_check CHECK (
    political_party IS NULL OR political_party IN (
      'ldp', 'cdp', 'nippon_ishin', 'komeito', 'dpfp',
      'jcp', 'reiwa', 'sdp', 'sanseito', 'other',
      'no_party', 'no_answer'
    )
  ),
  CONSTRAINT user_attributes_political_stance_check CHECK (
    political_stance IS NULL OR political_stance IN (
      'left', 'center_left', 'center', 'center_right', 'right'
    )
  )
);

-- =============================================================
-- 3. consent_records - 同意記録
-- =============================================================
CREATE TABLE consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  consent_version TEXT NOT NULL,
  consented_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ,

  CONSTRAINT consent_records_type_check CHECK (
    consent_type IN (
      'terms_of_service',
      'privacy_policy',
      'sensitive_personal_info',
      'statistics_usage'
    )
  )
);

-- =============================================================
-- 4. posts - 投稿
-- =============================================================
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_post_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  repost_of_id UUID REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT posts_content_length CHECK (
    char_length(content) BETWEEN 1 AND 200
  ),
  -- リポストと返信は同時に指定不可
  CONSTRAINT posts_not_both_reply_and_repost CHECK (
    NOT (parent_post_id IS NOT NULL AND repost_of_id IS NOT NULL)
  )
);

-- =============================================================
-- 5. reactions - Good/Bad評価
-- =============================================================
CREATE TABLE reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL,
  reactor_attribute_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1ユーザーにつき1投稿あたり1つの評価のみ
  CONSTRAINT reactions_unique_per_user_post UNIQUE (user_id, post_id),
  CONSTRAINT reactions_type_check CHECK (
    reaction_type IN ('good', 'bad')
  )
);

-- =============================================================
-- 6. follows - フォロー関係
-- =============================================================
CREATE TABLE follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 同一フォロー関係の重複防止
  CONSTRAINT follows_unique UNIQUE (follower_id, following_id),
  -- 自分自身をフォロー不可
  CONSTRAINT follows_no_self_follow CHECK (follower_id != following_id)
);

-- =============================================================
-- 7. themes - テーマ
-- =============================================================
CREATE TABLE themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT themes_title_length CHECK (
    char_length(title) BETWEEN 1 AND 50
  ),
  CONSTRAINT themes_description_length CHECK (
    description IS NULL OR char_length(description) <= 500
  ),
  CONSTRAINT themes_status_check CHECK (
    status IN ('active', 'ended')
  ),
  CONSTRAINT themes_date_order CHECK (
    end_date IS NULL OR end_date >= start_date
  )
);

-- =============================================================
-- 8. theme_posts - テーマと投稿の中間テーブル
-- =============================================================
CREATE TABLE theme_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,

  CONSTRAINT theme_posts_unique UNIQUE (theme_id, post_id)
);

-- =============================================================
-- 9. notifications - 通知
-- =============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  reference_id UUID,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT notifications_type_check CHECK (
    type IN ('reply', 'follow', 'good', 'theme_start', 'analysis_ready')
  )
);

-- =============================================================
-- 10. invite_codes - 招待コード
-- =============================================================
CREATE TABLE invite_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT invite_codes_code_format CHECK (
    code ~ '^[a-zA-Z0-9]{8}$'
  )
);

-- =============================================================
-- 11. reports - 通報
-- =============================================================
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  detail TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,

  CONSTRAINT reports_target_type_check CHECK (
    target_type IN ('post', 'user')
  ),
  CONSTRAINT reports_reason_check CHECK (
    reason IN (
      'attribute_discrimination', 'defamation', 'fake_attribute',
      'impersonation', 'spam', 'other'
    )
  ),
  CONSTRAINT reports_status_check CHECK (
    status IN ('pending', 'reviewed', 'resolved')
  )
);

-- =============================================================
-- 12. admin_actions - 管理者アクション記録
-- =============================================================
CREATE TABLE admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT admin_actions_action_type_check CHECK (
    action_type IN ('warning', 'post_restriction', 'suspend', 'ban', 'delete_post', 'unban')
  ),
  CONSTRAINT admin_actions_target_type_check CHECK (
    target_type IN ('post', 'user')
  )
);

-- =============================================================
-- updated_at を自動更新するトリガー関数
-- =============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_atカラムを持つテーブルにトリガーを設定
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_user_attributes
  BEFORE UPDATE ON user_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_posts
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_themes
  BEFORE UPDATE ON themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
