import { z } from "zod/v4";

export const updateProfileSchema = z.object({
  displayName: z
    .string()
    .min(1, "ユーザー名を入力してください")
    .max(30, "ユーザー名は30文字以内で入力してください")
    .optional(),
  bio: z
    .string()
    .max(160, "自己紹介は160文字以内で入力してください")
    .nullable()
    .optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const updateAttributesSchema = z.object({
  gender: z.enum(["male", "female", "other", "no_answer"]).nullable().optional(),
  ageRange: z
    .enum([
      "18-24", "25-29", "30-34", "35-39", "40-44",
      "45-49", "50-54", "55-59", "60-64", "65_and_over",
    ])
    .nullable()
    .optional(),
  education: z
    .enum([
      "junior_high", "high_school", "vocational", "junior_college",
      "university", "masters", "doctorate", "other",
    ])
    .nullable()
    .optional(),
  occupation: z
    .enum([
      "company_employee", "civil_servant", "self_employed", "executive",
      "professional", "educator_researcher", "student", "homemaker",
      "part_time", "unemployed", "retired", "other",
    ])
    .nullable()
    .optional(),
  politicalParty: z
    .enum([
      "ldp", "cdp", "nippon_ishin", "komeito", "dpfp",
      "jcp", "reiwa", "sdp", "sanseito", "other",
      "no_party", "no_answer",
    ])
    .nullable()
    .optional(),
  politicalStance: z
    .enum(["left", "center_left", "center", "center_right", "right"])
    .nullable()
    .optional(),
  isGenderPublic: z.boolean().optional(),
  isAgeRangePublic: z.boolean().optional(),
  isEducationPublic: z.boolean().optional(),
  isOccupationPublic: z.boolean().optional(),
  isPoliticalPartyPublic: z.boolean().optional(),
  isPoliticalStancePublic: z.boolean().optional(),
});

export type UpdateAttributesInput = z.infer<typeof updateAttributesSchema>;
