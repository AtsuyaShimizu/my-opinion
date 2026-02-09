"use client";

import Link from "next/link";
import { Users, MessageSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConsensusMeterMini } from "./ConsensusMeterMini";
import { cn } from "@/lib/utils";

interface ThemeFeaturedCardProps {
  id: string;
  title: string;
  description: string | null;
  postCount: number;
  participantCount: number;
  consensusScore: number;
  status: "active" | "ended";
  onParticipate: () => void;
}

export function ThemeFeaturedCard({
  id,
  title,
  description,
  postCount,
  participantCount,
  consensusScore,
  status,
  onParticipate,
}: ThemeFeaturedCardProps) {
  return (
    <div className="group relative rounded-xl border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/themes/${id}`} className="absolute inset-0 z-0" />

      <div className="relative z-10">
        <div className="flex items-center gap-2">
          <Badge variant={status === "active" ? "default" : "secondary"}>
            {status === "active" ? "投稿受付中" : "終了"}
          </Badge>
        </div>

        <h3 className="mt-2 text-xl font-bold">{title}</h3>

        {description && (
          <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{description}</p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{participantCount} 人参加</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{postCount} 件の投稿</span>
          </div>
          <ConsensusMeterMini score={consensusScore} />
        </div>

        {status === "active" && (
          <Button
            className={cn("mt-4 rounded-full")}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onParticipate();
            }}
          >
            意見を書く
          </Button>
        )}
      </div>
    </div>
  );
}
