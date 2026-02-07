-- =============================================================
-- 00002_create_rls_policies.sql
-- My Opinion - Row Level Security ポリシー
-- =============================================================

-- =============================================================
-- RLSを有効化
-- =============================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_attributes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE theme_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invite_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- =============================================================
-- ヘルパー: 管理者判定
-- users.statusが'active'かつauth.jwt()のroleが'admin'であるか、
-- もしくはカスタムclaimで判定する。
-- MVPではシンプルにuser_metadataのis_adminフラグで判定。
-- =============================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================
-- 1. users
-- SELECT: 全ユーザー（公開情報）
-- INSERT: Supabase Auth経由（auth.uid() = id）
-- UPDATE: 本人のみ
-- DELETE: 本人のみ（論理削除を想定）
-- =============================================================
CREATE POLICY "users_select_all"
  ON users FOR SELECT
  USING (true);

CREATE POLICY "users_insert_own"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_own"
  ON users FOR DELETE
  USING (auth.uid() = id);

-- =============================================================
-- 2. user_attributes
-- SELECT: 本人のみ（非公開属性の漏洩を防止）
--   → 他ユーザーの公開属性はサービスロール経由のAPI層で提供する。
--   → クライアントから直接SELECTした場合は本人のレコードのみ返却。
-- INSERT: 本人のみ
-- UPDATE: 本人のみ
-- DELETE: 本人のみ
-- =============================================================
CREATE POLICY "user_attributes_select_own"
  ON user_attributes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "user_attributes_insert_own"
  ON user_attributes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_attributes_update_own"
  ON user_attributes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_attributes_delete_own"
  ON user_attributes FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- 3. consent_records
-- SELECT: 本人のみ
-- INSERT: 本人のみ
-- UPDATE: 本人のみ（撤回日時の記録用）
-- DELETE: 不可（同意記録は永続保存）
-- =============================================================
CREATE POLICY "consent_records_select_own"
  ON consent_records FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "consent_records_insert_own"
  ON consent_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "consent_records_update_own"
  ON consent_records FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =============================================================
-- 4. posts
-- SELECT: 全ユーザー
-- INSERT: 認証済みユーザー
-- UPDATE: 本人のみ
-- DELETE: 本人 + 管理者
-- =============================================================
CREATE POLICY "posts_select_all"
  ON posts FOR SELECT
  USING (true);

CREATE POLICY "posts_insert_authenticated"
  ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own"
  ON posts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_delete_own_or_admin"
  ON posts FOR DELETE
  USING (auth.uid() = user_id OR is_admin());

-- =============================================================
-- 5. reactions
-- SELECT:
--   投稿者は自分の投稿への全評価を閲覧可能。
--   一般ユーザーはGood評価のみ閲覧可能（Bad数の集計はアプリ側で制御）。
--   → RLS上は全件SELECTを許可し、Bad評価の可視性はAPI/ビュー層で制御する。
--     理由: RLS内でpostsテーブルをJOINすると重いため。
-- INSERT: 認証済みユーザー
-- UPDATE: なし（評価の変更は削除→再作成で対応）
-- DELETE: 本人のみ
-- =============================================================
CREATE POLICY "reactions_select_all"
  ON reactions FOR SELECT
  USING (true);

CREATE POLICY "reactions_insert_authenticated"
  ON reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "reactions_delete_own"
  ON reactions FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- 6. follows
-- SELECT: 全ユーザー
-- INSERT: 認証済みユーザー（自分がfollower）
-- DELETE: 本人のみ（自分がfollower）
-- =============================================================
CREATE POLICY "follows_select_all"
  ON follows FOR SELECT
  USING (true);

CREATE POLICY "follows_insert_authenticated"
  ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_own"
  ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- =============================================================
-- 7. themes
-- SELECT: 全ユーザー
-- INSERT: 管理者のみ（MVP段階）
-- UPDATE: 管理者のみ
-- DELETE: 管理者のみ
-- =============================================================
CREATE POLICY "themes_select_all"
  ON themes FOR SELECT
  USING (true);

CREATE POLICY "themes_insert_admin"
  ON themes FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "themes_update_admin"
  ON themes FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "themes_delete_admin"
  ON themes FOR DELETE
  USING (is_admin());

-- =============================================================
-- 8. theme_posts
-- SELECT: 全ユーザー
-- INSERT: 認証済みユーザー
-- DELETE: 管理者のみ
-- =============================================================
CREATE POLICY "theme_posts_select_all"
  ON theme_posts FOR SELECT
  USING (true);

CREATE POLICY "theme_posts_insert_authenticated"
  ON theme_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "theme_posts_delete_admin"
  ON theme_posts FOR DELETE
  USING (is_admin());

-- =============================================================
-- 9. notifications
-- SELECT: 本人のみ
-- INSERT: サービスロール経由のみ（クライアントからの直接INSERTを禁止）
--   → 通知生成はバックエンドAPI（サービスロール）が行う。
--   → RLSはクライアントロール(anon/authenticated)に適用され、
--     サービスロールはRLSをバイパスするため、INSERTポリシーは
--     false に設定してクライアントからの不正な通知作成を防止する。
-- UPDATE: 本人のみ（is_readの更新用）
-- DELETE: 本人のみ
-- =============================================================
CREATE POLICY "notifications_select_own"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_service_role_only"
  ON notifications FOR INSERT
  WITH CHECK (false);

CREATE POLICY "notifications_update_own"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "notifications_delete_own"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================================
-- 10. invite_codes
-- SELECT: 本人が作成 or 本人が使用
-- INSERT: 認証済みユーザー
-- UPDATE: 認証済みユーザー（使用時の更新用）
-- =============================================================
CREATE POLICY "invite_codes_select_own"
  ON invite_codes FOR SELECT
  USING (
    auth.uid() = created_by
    OR auth.uid() = used_by
    OR is_admin()
  );

CREATE POLICY "invite_codes_insert_authenticated"
  ON invite_codes FOR INSERT
  WITH CHECK (auth.uid() = created_by OR is_admin());

CREATE POLICY "invite_codes_update_use"
  ON invite_codes FOR UPDATE
  USING (used_by IS NULL)
  WITH CHECK (used_by = auth.uid());

-- =============================================================
-- 11. reports
-- SELECT: 本人（通報者）+ 管理者
-- INSERT: 認証済みユーザー
-- UPDATE: 管理者のみ（ステータス更新）
-- =============================================================
CREATE POLICY "reports_select_own_or_admin"
  ON reports FOR SELECT
  USING (auth.uid() = reporter_id OR is_admin());

CREATE POLICY "reports_insert_authenticated"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_update_admin"
  ON reports FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- =============================================================
-- 12. admin_actions
-- SELECT: 管理者のみ
-- INSERT: 管理者のみ
-- =============================================================
CREATE POLICY "admin_actions_select_admin"
  ON admin_actions FOR SELECT
  USING (is_admin());

CREATE POLICY "admin_actions_insert_admin"
  ON admin_actions FOR INSERT
  WITH CHECK (is_admin() AND auth.uid() = admin_id);
