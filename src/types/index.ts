// Common type definitions for My Opinion

// Re-export all types from database.ts (single source of truth matching SQL schema)
export type {
  UserStatus,
  Gender,
  AgeRange,
  Education,
  Occupation,
  PoliticalParty,
  PoliticalStance,
  ReportReason,
  ReportStatus,
  ThemeStatus,
  SourceType,
  NotificationType,
  ConsentType,
  ReportTargetType,
  AdminActionType,
  AdminTargetType,
  ReactorAttributeSnapshot,
  AttributeInference,
  DataProvenance,
  User,
  UserAttribute,
  ConsentRecord,
  Post,
  Reaction,
  Follow,
  Theme,
  ThemePost,
  XIssue,
  XIssuePost,
  UserIssueStance,
  UserIssueStanceEvent,
  Notification,
  InviteCode,
  Report,
  AdminAction,
  Database,
} from './database';

export type ApiError = {
  error: string;
  status: number;
};

export type ApiResponse<T> = {
  data: T;
  status: number;
};
