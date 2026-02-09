import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarSize = "xs" | "sm" | "md" | "lg";

const sizeClasses: Record<UserAvatarSize, string> = {
  xs: "h-6 w-6",
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-20 w-20",
};

const fallbackTextSize: Record<UserAvatarSize, string> = {
  xs: "text-[10px]",
  sm: "text-xs",
  md: "text-sm",
  lg: "text-xl",
};

interface UserAvatarProps {
  src?: string | null;
  displayName: string;
  size?: UserAvatarSize;
  className?: string;
}

export function UserAvatar({
  src,
  displayName,
  size = "md",
  className,
}: UserAvatarProps) {
  const initials = displayName.slice(0, 2);

  return (
    <Avatar className={cn(sizeClasses[size], "ring-2 ring-background", className)}>
      {src && <AvatarImage src={src} alt={displayName} />}
      <AvatarFallback
        className={cn(
          "bg-primary/10 text-primary font-medium",
          fallbackTextSize[size]
        )}
      >
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
