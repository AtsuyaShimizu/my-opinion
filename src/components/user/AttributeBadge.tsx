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
  gender: "bg-pink-50 text-pink-700 border-pink-200",
  age_range: "bg-green-50 text-green-700 border-green-200",
  education: "bg-amber-50 text-amber-700 border-amber-200",
  occupation: "bg-sky-50 text-sky-700 border-sky-200",
  political_stance: "bg-violet-50 text-violet-700 border-violet-200",
  political_party: "bg-rose-50 text-rose-700 border-rose-200",
};

interface AttributeBadgeProps {
  type: AttributeType;
  value: string;
  className?: string;
}

export function AttributeBadge({ type, value, className }: AttributeBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-normal", attributeStyles[type], className)}
    >
      {value}
    </Badge>
  );
}
