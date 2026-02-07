import { z } from "zod/v4";

export const createConsentSchema = z.object({
  consentType: z.enum([
    "terms_of_service",
    "privacy_policy",
    "sensitive_personal_info",
    "statistics_usage",
  ]),
  consentVersion: z.string().min(1, "同意バージョンを指定してください"),
});

export type CreateConsentInput = z.infer<typeof createConsentSchema>;
