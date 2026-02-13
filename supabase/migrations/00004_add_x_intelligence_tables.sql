-- =============================================================
-- 00004_add_x_intelligence_tables.sql
-- My Opinion - X連携インテリジェンス基盤テーブル
-- =============================================================

-- =============================================================
-- 1. x_issues - 外部ソース由来の論点
-- =============================================================
CREATE TABLE x_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_issue_id TEXT,
  source_type TEXT NOT NULL DEFAULT 'x',
  title TEXT NOT NULL,
  description TEXT,
  query TEXT NOT NULL,
  source_metadata JSONB,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT x_issues_source_type_check CHECK (
    source_type IN ('internal', 'x')
  ),
  CONSTRAINT x_issues_title_length CHECK (
    char_length(title) BETWEEN 1 AND 120
  ),
  CONSTRAINT x_issues_query_length CHECK (
    char_length(query) BETWEEN 1 AND 200
  ),
  CONSTRAINT x_issues_unique_source_issue UNIQUE (source_type, source_issue_id)
);

-- =============================================================
-- 2. x_issue_posts - 外部ポストキャッシュ（規約準拠表示のため）
-- =============================================================
CREATE TABLE x_issue_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID NOT NULL REFERENCES x_issues(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'x',
  source_post_id TEXT NOT NULL,
  author_handle TEXT NOT NULL,
  author_display_name TEXT,
  content TEXT,
  url TEXT,
  language TEXT,
  posted_at TIMESTAMPTZ NOT NULL,
  like_count INTEGER NOT NULL DEFAULT 0,
  reply_count INTEGER NOT NULL DEFAULT 0,
  repost_count INTEGER NOT NULL DEFAULT 0,
  quote_count INTEGER NOT NULL DEFAULT 0,
  bookmark_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  stance_score INTEGER,
  inferred_attributes JSONB,
  inference_confidence INTEGER,
  data_provenance JSONB,
  raw_payload JSONB,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT x_issue_posts_source_type_check CHECK (
    source_type IN ('internal', 'x')
  ),
  CONSTRAINT x_issue_posts_unique_source_post UNIQUE (source_type, source_post_id),
  CONSTRAINT x_issue_posts_stance_score_range CHECK (
    stance_score IS NULL OR (stance_score >= 0 AND stance_score <= 100)
  ),
  CONSTRAINT x_issue_posts_inference_confidence_range CHECK (
    inference_confidence IS NULL OR (inference_confidence >= 0 AND inference_confidence <= 100)
  )
);

-- =============================================================
-- 3. user_issue_stances - ユーザーの最新スタンス
-- =============================================================
CREATE TABLE user_issue_stances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES x_issues(id) ON DELETE CASCADE,
  stance_score INTEGER NOT NULL,
  confidence INTEGER,
  note TEXT,
  source_type TEXT NOT NULL DEFAULT 'internal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_issue_stances_unique_user_issue UNIQUE (user_id, issue_id),
  CONSTRAINT user_issue_stances_score_range CHECK (
    stance_score >= 0 AND stance_score <= 100
  ),
  CONSTRAINT user_issue_stances_confidence_range CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 100)
  ),
  CONSTRAINT user_issue_stances_source_type_check CHECK (
    source_type IN ('internal', 'x')
  )
);

-- =============================================================
-- 4. user_issue_stance_events - スタンス履歴（ドリフト分析用）
-- =============================================================
CREATE TABLE user_issue_stance_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES x_issues(id) ON DELETE CASCADE,
  stance_score INTEGER NOT NULL,
  confidence INTEGER,
  source_type TEXT NOT NULL DEFAULT 'internal',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT user_issue_stance_events_score_range CHECK (
    stance_score >= 0 AND stance_score <= 100
  ),
  CONSTRAINT user_issue_stance_events_confidence_range CHECK (
    confidence IS NULL OR (confidence >= 0 AND confidence <= 100)
  ),
  CONSTRAINT user_issue_stance_events_source_type_check CHECK (
    source_type IN ('internal', 'x')
  )
);

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX idx_x_issues_active_updated ON x_issues (is_active, updated_at DESC);
CREATE INDEX idx_x_issue_posts_issue_id_posted_at ON x_issue_posts (issue_id, posted_at DESC);
CREATE INDEX idx_x_issue_posts_issue_id_stance ON x_issue_posts (issue_id, stance_score);
CREATE INDEX idx_user_issue_stances_user_id ON user_issue_stances (user_id);
CREATE INDEX idx_user_issue_stances_issue_id ON user_issue_stances (issue_id);
CREATE INDEX idx_user_issue_stance_events_user_issue_created
  ON user_issue_stance_events (user_id, issue_id, created_at DESC);

-- =============================================================
-- RLS
-- =============================================================
ALTER TABLE x_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE x_issue_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_issue_stances ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_issue_stance_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "x_issues_select_all"
  ON x_issues FOR SELECT
  USING (true);

CREATE POLICY "x_issues_write_admin"
  ON x_issues FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "x_issue_posts_select_all"
  ON x_issue_posts FOR SELECT
  USING (true);

CREATE POLICY "x_issue_posts_write_admin"
  ON x_issue_posts FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "user_issue_stances_select_own"
  ON user_issue_stances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_issue_stances_insert_own"
  ON user_issue_stances FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_issue_stances_update_own"
  ON user_issue_stances FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_issue_stances_delete_own"
  ON user_issue_stances FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "user_issue_stance_events_select_own"
  ON user_issue_stance_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_issue_stance_events_insert_own"
  ON user_issue_stance_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
