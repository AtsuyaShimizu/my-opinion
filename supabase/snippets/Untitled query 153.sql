  -- 新しいポリシー: 未使用コードは誰でも検証可能
  CREATE POLICY "invite_codes_select_public_if_unused"
    ON invite_codes FOR SELECT
    USING (
      used_by IS NULL  -- 未使用なら誰でも見れる
      OR auth.uid() = created_by  -- または作成者
      OR auth.uid() = used_by  -- または使用者
      OR is_admin()  -- または管理者
    );
