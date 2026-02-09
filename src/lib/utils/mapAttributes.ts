import { ATTRIBUTE_LABELS } from "@/lib/constants";

export function mapAttributes(attrs: Record<string, string | null> | null) {
  if (!attrs) return [];
  const typeMap: Record<string, "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party"> = {
    gender: "gender", age_range: "age_range", education: "education",
    occupation: "occupation", political_stance: "political_stance", political_party: "political_party",
  };
  return Object.entries(attrs)
    .filter(([key, val]) => val != null && key in typeMap)
    .map(([key, val]) => ({
      type: typeMap[key],
      value: ATTRIBUTE_LABELS[key]?.[val as string] ?? (val as string),
    }));
}
