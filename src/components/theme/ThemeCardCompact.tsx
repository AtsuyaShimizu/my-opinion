import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ConsensusMeterMini } from "./ConsensusMeterMini";

interface ThemeCardCompactProps {
  id: string;
  title: string;
  postCount: number;
  consensusScore: number;
  status: "active" | "ended";
}

export function ThemeCardCompact({
  id,
  title,
  postCount,
  consensusScore,
  status,
}: ThemeCardCompactProps) {
  return (
    <Link
      href={`/themes/${id}`}
      className="block w-[200px] shrink-0 rounded-xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:bg-accent/50 hover:shadow-sm"
    >
      <Badge variant={status === "active" ? "default" : "secondary"} className="text-[10px]">
        {status === "active" ? "投稿受付中" : "終了"}
      </Badge>
      <h4 className="mt-2 text-sm font-semibold line-clamp-2">{title}</h4>
      <p className="mt-1 text-xs text-muted-foreground">{postCount} 件の投稿</p>
      <div className="mt-2">
        <ConsensusMeterMini score={consensusScore} />
      </div>
    </Link>
  );
}
