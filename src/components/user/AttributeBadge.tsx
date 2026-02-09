import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AttributeType =
  | "gender"
  | "age_range"
  | "education"
  | "occupation"
  | "political_stance"
  | "political_party";

const attributeStyles: Record<AttributeType, string> = {
  gender:
    "bg-rose-50/60 text-rose-800 border-rose-200/60 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-800/40",
  age_range:
    "bg-emerald-50/60 text-emerald-800 border-emerald-200/60 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40",
  education:
    "bg-amber-50/60 text-amber-800 border-amber-200/60 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/40",
  occupation:
    "bg-sky-50/60 text-sky-800 border-sky-200/60 dark:bg-sky-950/30 dark:text-sky-300 dark:border-sky-800/40",
  political_stance:
    "bg-indigo-50/60 text-indigo-800 border-indigo-200/60 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800/40",
  political_party:
    "bg-purple-50/60 text-purple-800 border-purple-200/60 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-800/40",
};

const sizeStyles = {
  sm: "text-xs font-normal",
  md: "text-xs px-2.5 py-1 font-normal",
};

interface AttributeBadgeProps {
  type: AttributeType;
  value: string;
  size?: "sm" | "md";
  className?: string;
}

export function AttributeBadge({ type, value, size = "sm", className }: AttributeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(sizeStyles[size], attributeStyles[type], className)}
    >
      {value}
    </Badge>
  );
}
