import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type UserAvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<UserAvatarSize, string> = {
  sm: "h-8 w-8",
  md: "h-10 w-10",
  lg: "h-16 w-16",
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
    <Avatar className={cn(sizeClasses[size], className)}>
      {src && <AvatarImage src={src} alt={displayName} />}
      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
