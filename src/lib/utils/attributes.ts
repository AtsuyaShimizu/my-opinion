import type { UserAttribute } from "@/types/database";

export type PublicAttributes = {
  gender: string | null;
  age_range: string | null;
  education: string | null;
  occupation: string | null;
  political_party: string | null;
  political_stance: string | null;
};

/**
 * Extract only the publicly visible attributes from a user_attributes record.
 * Returns null if the input is null/undefined.
 */
export function extractPublicAttributes(
  attrs: UserAttribute | null | undefined
): PublicAttributes | null {
  if (!attrs) return null;
  return {
    gender: attrs.is_gender_public ? attrs.gender : null,
    age_range: attrs.is_age_range_public ? attrs.age_range : null,
    education: attrs.is_education_public ? attrs.education : null,
    occupation: attrs.is_occupation_public ? attrs.occupation : null,
    political_party: attrs.is_political_party_public ? attrs.political_party : null,
    political_stance: attrs.is_political_stance_public ? attrs.political_stance : null,
  };
}
