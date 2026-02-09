-- =============================================================
-- Schema Changes v3: Topic-Driven + Slider Reactions
-- =============================================================

-- 1. posts: Add title column for topic posts
ALTER TABLE posts ADD COLUMN title TEXT DEFAULT NULL;
ALTER TABLE posts ADD CONSTRAINT posts_title_length CHECK (title IS NULL OR char_length(title) <= 60);

-- 2. reactions: Migrate from reaction_type to reaction_score
-- Step 2a: Add new column
ALTER TABLE reactions ADD COLUMN reaction_score INTEGER;

-- Step 2b: Migrate existing data (good -> 80, bad -> 20)
UPDATE reactions SET reaction_score = CASE
  WHEN reaction_type = 'good' THEN 80
  WHEN reaction_type = 'bad' THEN 20
END;

-- Step 2c: Add NOT NULL and CHECK constraints
ALTER TABLE reactions ALTER COLUMN reaction_score SET NOT NULL;
ALTER TABLE reactions ADD CONSTRAINT reaction_score_range CHECK (reaction_score >= 0 AND reaction_score <= 100);

-- Step 2d: Drop old column
ALTER TABLE reactions DROP COLUMN reaction_type;

-- Step 2e: Add UPDATE RLS policy (required for score updates; old implementation used delete+insert)
CREATE POLICY "reactions_update_own"
  ON reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. notifications: Migrate type 'good' -> 'reaction'
-- Step 3a: Update existing data
UPDATE notifications SET type = 'reaction' WHERE type = 'good';

-- Step 3b: Update CHECK constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
  CHECK (type IN ('reply', 'follow', 'reaction', 'theme_start', 'analysis_ready'));
