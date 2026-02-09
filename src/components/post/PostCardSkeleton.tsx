import { Skeleton } from "@/components/ui/skeleton";

export function PostCardSkeleton() {
  return (
    <div className="border-b bg-card px-4 pt-4 pb-3">
      <div className="space-y-3">
        {/* Title (shown ~50% of the time visually) */}
        <Skeleton className="h-5 w-3/5" />
        {/* Content lines */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        {/* Background tags */}
        <div className="flex gap-1.5 pt-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        {/* Author row */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
          <Skeleton className="h-3 w-32" />
        </div>
        {/* Slider reaction track */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
        </div>
        {/* Action bar */}
        <div className="flex gap-6 pt-1">
          <Skeleton className="h-4 w-10" />
          <Skeleton className="h-4 w-10" />
        </div>
      </div>
    </div>
  );
}
