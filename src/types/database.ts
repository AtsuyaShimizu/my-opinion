// =============================================================
// database.ts
// My Opinion - データベーステーブルの TypeScript 型定義
// =============================================================

// -------------------------------------------------------------
// 共通型
// -------------------------------------------------------------

/** ユーザーステータス */
export type UserStatus = 'active' | 'suspended' | 'banned' | 'withdrawn';

/** 性別 */
export type Gender = 'male' | 'female' | 'other' | 'no_answer';

/** 年齢帯 */
export type AgeRange =
  | '18-24'
  | '25-29'
  | '30-34'
  | '35-39'
  | '40-44'
  | '45-49'
  | '50-54'
  | '55-59'
  | '60-64'
  | '65_and_over';

/** 学歴 */
export type Education =
  | 'junior_high'
  | 'high_school'
  | 'vocational'
  | 'junior_college'
  | 'university'
  | 'masters'
  | 'doctorate'
  | 'other';

/** 職業 */
export type Occupation =
  | 'company_employee'
  | 'civil_servant'
  | 'self_employed'
  | 'executive'
  | 'professional'
  | 'educator_researcher'
  | 'student'
  | 'homemaker'
  | 'part_time'
  | 'unemployed'
  | 'retired'
  | 'other';

/** 支持政党 */
export type PoliticalParty =
  | 'ldp'
  | 'cdp'
  | 'nippon_ishin'
  | 'komeito'
  | 'dpfp'
  | 'jcp'
  | 'reiwa'
  | 'sdp'
  | 'sanseito'
  | 'other'
  | 'no_party'
  | 'no_answer';

/** 政治スタンス */
export type PoliticalStance =
  | 'left'
  | 'center_left'
  | 'center'
  | 'center_right'
  | 'right';

/** 同意タイプ */
export type ConsentType =
  | 'terms_of_service'
  | 'privacy_policy'
  | 'sensitive_personal_info'
  | 'statistics_usage';

/** 通知タイプ */
export type NotificationType =
  | 'reply'
  | 'follow'
  | 'reaction'
  | 'theme_start'
  | 'analysis_ready';

/** テーマステータス */
export type ThemeStatus = 'active' | 'ended';

/** データソース種別 */
export type SourceType = 'internal' | 'x';

/** 通報対象タイプ */
export type ReportTargetType = 'post' | 'user';

/** 通報理由 */
export type ReportReason =
  | 'attribute_discrimination'
  | 'defamation'
  | 'fake_attribute'
  | 'impersonation'
  | 'spam'
  | 'other';

/** 通報ステータス */
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

/** 管理者アクションタイプ */
export type AdminActionType =
  | 'warning'
  | 'post_restriction'
  | 'suspend'
  | 'ban'
  | 'delete_post'
  | 'unban';

/** 管理者アクション対象タイプ */
export type AdminTargetType = 'post' | 'user';

// -------------------------------------------------------------
// 評価者属性スナップショット（JSONB）
// -------------------------------------------------------------

export type ReactorAttributeSnapshot = {
  gender?: Gender | null;
  age_range?: AgeRange | null;
  education?: Education | null;
  occupation?: Occupation | null;
  political_party?: PoliticalParty | null;
  political_stance?: PoliticalStance | null;
};

/** 属性推定情報（推定であることを明示） */
export type AttributeInference = {
  inferred_label: string;
  confidence: number;
  method: 'self_reported' | 'heuristic' | 'llm' | 'unknown';
  disclaimer?: string;
};

/** データ由来情報 */
export type DataProvenance = {
  source: SourceType;
  fetched_at: string;
  query: string;
  confidence?: number;
  policy_flags?: {
    text_visible: boolean;
    attribution_required: boolean;
    external_link_required: boolean;
  };
};

// -------------------------------------------------------------
// テーブル型定義
// NOTE: `type` (not `interface`) を使用。supabase-js の GenericSchema が
//       Record<string, unknown> への代入互換を要求するため、
//       暗黙の index signature を持つ type alias が必要。
// -------------------------------------------------------------

/** users テーブル */
export type User = {
  id: string;
  email: string;
  user_handle: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

/** user_attributes テーブル */
export type UserAttribute = {
  id: string;
  user_id: string;
  gender: Gender | null;
  age_range: AgeRange | null;
  education: Education | null;
  occupation: Occupation | null;
  political_party: PoliticalParty | null;
  political_stance: PoliticalStance | null;
  is_gender_public: boolean;
  is_age_range_public: boolean;
  is_education_public: boolean;
  is_occupation_public: boolean;
  is_political_party_public: boolean;
  is_political_stance_public: boolean;
  created_at: string;
  updated_at: string;
};

/** consent_records テーブル */
export type ConsentRecord = {
  id: string;
  user_id: string;
  consent_type: ConsentType;
  consent_version: string;
  consented_at: string;
  revoked_at: string | null;
};

/** posts テーブル */
export type Post = {
  id: string;
  user_id: string;
  title: string | null;
  content: string;
  parent_post_id: string | null;
  repost_of_id: string | null;
  created_at: string;
  updated_at: string;
};

/** reactions テーブル */
export type Reaction = {
  id: string;
  user_id: string;
  post_id: string;
  reaction_score: number;
  reactor_attribute_snapshot: ReactorAttributeSnapshot | null;
  created_at: string;
};

/** follows テーブル */
export type Follow = {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
};

/** themes テーブル */
export type Theme = {
  id: string;
  title: string;
  description: string | null;
  created_by: string;
  start_date: string;
  end_date: string | null;
  status: ThemeStatus;
  created_at: string;
  updated_at: string;
};

/** theme_posts テーブル */
export type ThemePost = {
  id: string;
  theme_id: string;
  post_id: string;
};

/** x_issues テーブル */
export type XIssue = {
  id: string;
  source_issue_id: string | null;
  source_type: SourceType;
  title: string;
  description: string | null;
  query: string;
  source_metadata: Record<string, unknown> | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

/** x_issue_posts テーブル */
export type XIssuePost = {
  id: string;
  issue_id: string;
  source_type: SourceType;
  source_post_id: string;
  author_handle: string;
  author_display_name: string | null;
  content: string | null;
  url: string | null;
  language: string | null;
  posted_at: string;
  like_count: number;
  reply_count: number;
  repost_count: number;
  quote_count: number;
  bookmark_count: number;
  view_count: number;
  stance_score: number | null;
  inferred_attributes: AttributeInference[] | null;
  inference_confidence: number | null;
  data_provenance: DataProvenance | null;
  raw_payload: Record<string, unknown> | null;
  fetched_at: string;
  created_at: string;
};

/** user_issue_stances テーブル */
export type UserIssueStance = {
  id: string;
  user_id: string;
  issue_id: string;
  stance_score: number;
  confidence: number | null;
  note: string | null;
  source_type: SourceType;
  created_at: string;
  updated_at: string;
};

/** user_issue_stance_events テーブル */
export type UserIssueStanceEvent = {
  id: string;
  user_id: string;
  issue_id: string;
  stance_score: number;
  confidence: number | null;
  source_type: SourceType;
  created_at: string;
};

/** notifications テーブル */
export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
};

/** invite_codes テーブル */
export type InviteCode = {
  id: string;
  code: string;
  created_by: string;
  used_by: string | null;
  expires_at: string;
  used_at: string | null;
  created_at: string;
};

/** reports テーブル */
export type Report = {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  detail: string | null;
  status: ReportStatus;
  reviewed_by: string | null;
  created_at: string;
  resolved_at: string | null;
};

/** admin_actions テーブル */
export type AdminAction = {
  id: string;
  admin_id: string;
  action_type: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  reason: string | null;
  created_at: string;
};

// -------------------------------------------------------------
// INSERT 用の型（id, created_at, updated_at を除外）
// -------------------------------------------------------------

export type UserInsert = {
  id?: string;
  email: string;
  user_handle: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string | null;
  status?: UserStatus;
  deleted_at?: string | null;
};

export type UserAttributeInsert = {
  id?: string;
  user_id: string;
  gender?: Gender | null;
  age_range?: AgeRange | null;
  education?: Education | null;
  occupation?: Occupation | null;
  political_party?: PoliticalParty | null;
  political_stance?: PoliticalStance | null;
  is_gender_public?: boolean;
  is_age_range_public?: boolean;
  is_education_public?: boolean;
  is_occupation_public?: boolean;
  is_political_party_public?: boolean;
  is_political_stance_public?: boolean;
};

export type ConsentRecordInsert = {
  id?: string;
  user_id: string;
  consent_type: ConsentType;
  consent_version: string;
  consented_at?: string;
  revoked_at?: string | null;
};

export type PostInsert = {
  id?: string;
  user_id: string;
  title?: string | null;
  content: string;
  parent_post_id?: string | null;
  repost_of_id?: string | null;
};

export type ReactionInsert = {
  id?: string;
  user_id: string;
  post_id: string;
  reaction_score: number;
  reactor_attribute_snapshot?: ReactorAttributeSnapshot | null;
};

export type FollowInsert = {
  id?: string;
  follower_id: string;
  following_id: string;
};

export type ThemeInsert = {
  id?: string;
  title: string;
  description?: string | null;
  created_by: string;
  start_date: string;
  end_date?: string | null;
  status?: ThemeStatus;
};

export type ThemePostInsert = {
  id?: string;
  theme_id: string;
  post_id: string;
};

export type XIssueInsert = {
  id?: string;
  source_issue_id?: string | null;
  source_type?: SourceType;
  title: string;
  description?: string | null;
  query: string;
  source_metadata?: Record<string, unknown> | null;
  is_active?: boolean;
  created_by?: string | null;
};

export type XIssuePostInsert = {
  id?: string;
  issue_id: string;
  source_type?: SourceType;
  source_post_id: string;
  author_handle: string;
  author_display_name?: string | null;
  content?: string | null;
  url?: string | null;
  language?: string | null;
  posted_at: string;
  like_count?: number;
  reply_count?: number;
  repost_count?: number;
  quote_count?: number;
  bookmark_count?: number;
  view_count?: number;
  stance_score?: number | null;
  inferred_attributes?: AttributeInference[] | null;
  inference_confidence?: number | null;
  data_provenance?: DataProvenance | null;
  raw_payload?: Record<string, unknown> | null;
  fetched_at?: string;
};

export type UserIssueStanceInsert = {
  id?: string;
  user_id: string;
  issue_id: string;
  stance_score: number;
  confidence?: number | null;
  note?: string | null;
  source_type?: SourceType;
};

export type UserIssueStanceEventInsert = {
  id?: string;
  user_id: string;
  issue_id: string;
  stance_score: number;
  confidence?: number | null;
  source_type?: SourceType;
};

export type NotificationInsert = {
  id?: string;
  user_id: string;
  type: NotificationType;
  reference_id?: string | null;
  message: string;
  is_read?: boolean;
};

export type InviteCodeInsert = {
  id?: string;
  code: string;
  created_by: string;
  used_by?: string | null;
  expires_at: string;
  used_at?: string | null;
};

export type ReportInsert = {
  id?: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  detail?: string | null;
  status?: ReportStatus;
  reviewed_by?: string | null;
  resolved_at?: string | null;
};

export type AdminActionInsert = {
  id?: string;
  admin_id: string;
  action_type: AdminActionType;
  target_type: AdminTargetType;
  target_id: string;
  reason?: string | null;
};

// -------------------------------------------------------------
// UPDATE 用の型（全フィールドをオプショナルに）
// -------------------------------------------------------------

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
export type UserAttributeUpdate = Partial<Omit<UserAttribute, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;
export type PostUpdate = Partial<Pick<Post, 'content' | 'title'>>;
export type NotificationUpdate = Partial<Pick<Notification, 'is_read'>>;
export type ReportUpdate = Partial<Pick<Report, 'status' | 'reviewed_by' | 'resolved_at'>>;
export type ThemeUpdate = Partial<Omit<Theme, 'id' | 'created_by' | 'created_at' | 'updated_at'>>;
export type XIssueUpdate = Partial<Omit<XIssue, 'id' | 'created_at'>>;
export type UserIssueStanceUpdate = Partial<Pick<UserIssueStance, 'stance_score' | 'confidence' | 'note' | 'source_type'>>;

// -------------------------------------------------------------
// Supabase Database 型定義（supabase-js 向け）
// -------------------------------------------------------------

export type Database = {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: UserInsert;
        Update: UserUpdate;
        Relationships: [];
      };
      user_attributes: {
        Row: UserAttribute;
        Insert: UserAttributeInsert;
        Update: UserAttributeUpdate;
        Relationships: [];
      };
      consent_records: {
        Row: ConsentRecord;
        Insert: ConsentRecordInsert;
        Update: Partial<Pick<ConsentRecord, 'revoked_at'>>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: PostInsert;
        Update: PostUpdate;
        Relationships: [];
      };
      reactions: {
        Row: Reaction;
        Insert: ReactionInsert;
        Update: Partial<Pick<Reaction, 'reaction_score'>>;
        Relationships: [];
      };
      follows: {
        Row: Follow;
        Insert: FollowInsert;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      themes: {
        Row: Theme;
        Insert: ThemeInsert;
        Update: ThemeUpdate;
        Relationships: [];
      };
      theme_posts: {
        Row: ThemePost;
        Insert: ThemePostInsert;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      x_issues: {
        Row: XIssue;
        Insert: XIssueInsert;
        Update: XIssueUpdate;
        Relationships: [];
      };
      x_issue_posts: {
        Row: XIssuePost;
        Insert: XIssuePostInsert;
        Update: Partial<Omit<XIssuePost, 'id' | 'issue_id' | 'source_post_id' | 'created_at'>>;
        Relationships: [];
      };
      user_issue_stances: {
        Row: UserIssueStance;
        Insert: UserIssueStanceInsert;
        Update: UserIssueStanceUpdate;
        Relationships: [];
      };
      user_issue_stance_events: {
        Row: UserIssueStanceEvent;
        Insert: UserIssueStanceEventInsert;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: NotificationInsert;
        Update: NotificationUpdate;
        Relationships: [];
      };
      invite_codes: {
        Row: InviteCode;
        Insert: InviteCodeInsert;
        Update: Partial<Pick<InviteCode, 'used_by' | 'used_at'>>;
        Relationships: [];
      };
      reports: {
        Row: Report;
        Insert: ReportInsert;
        Update: ReportUpdate;
        Relationships: [];
      };
      admin_actions: {
        Row: AdminAction;
        Insert: AdminActionInsert;
        Update: Record<string, unknown>;
        Relationships: [];
      };
    };
    Views: Record<string, {
      Row: Record<string, unknown>;
      Insert: Record<string, unknown>;
      Update: Record<string, unknown>;
      Relationships: [];
    }>;
    Functions: Record<string, {
      Args: Record<string, unknown>;
      Returns: unknown;
    }>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
