import { cn } from "@/lib/utils";

type AttributeType =
  | "gender"
  | "age_range"
  | "education"
  | "occupation"
  | "political_stance"
  | "political_party";

const attributeTypeLabels: Record<AttributeType, string> = {
  gender: "性別",
  age_range: "年齢帯",
  education: "学歴",
  occupation: "職業",
  political_stance: "政治スタンス",
  political_party: "支持政党",
};

const attributePanelStyles: Record<AttributeType, string> = {
  gender:
    "bg-rose-50/80 border-rose-200/60 dark:bg-rose-950/40 dark:border-rose-800/40",
  age_range:
    "bg-emerald-50/80 border-emerald-200/60 dark:bg-emerald-950/40 dark:border-emerald-800/40",
  education:
    "bg-amber-50/80 border-amber-200/60 dark:bg-amber-950/40 dark:border-amber-800/40",
  occupation:
    "bg-sky-50/80 border-sky-200/60 dark:bg-sky-950/40 dark:border-sky-800/40",
  political_stance:
    "bg-indigo-50/80 border-indigo-200/60 dark:bg-indigo-950/40 dark:border-indigo-800/40",
  political_party:
    "bg-purple-50/80 border-purple-200/60 dark:bg-purple-950/40 dark:border-purple-800/40",
};

interface AttributePanelProps {
  attributes: { type: AttributeType; value: string }[];
}

export function AttributePanel({ attributes }: AttributePanelProps) {
  if (attributes.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {attributes.map((attr) => (
        <div
          key={attr.type}
          className={cn(
            "rounded-xl border p-3 text-center",
            attributePanelStyles[attr.type]
          )}
        >
          <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">
            {attributeTypeLabels[attr.type]}
          </span>
          <p className="mt-0.5 text-sm font-bold">{attr.value}</p>
        </div>
      ))}
    </div>
  );
}
