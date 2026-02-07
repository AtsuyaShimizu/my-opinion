import Link from "next/link";
import { UserAvatar } from "./UserAvatar";
import { AttributeBadge } from "./AttributeBadge";

interface UserAttribute {
  type: "gender" | "age_range" | "education" | "occupation" | "political_stance" | "political_party";
  value: string;
}

interface UserCardProps {
  handle: string;
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  attributes?: UserAttribute[];
}

export function UserCard({
  handle,
  displayName,
  avatarUrl,
  bio,
  attributes,
}: UserCardProps) {
  return (
    <Link
      href={`/users/${handle}`}
      className="flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-accent"
    >
      <UserAvatar src={avatarUrl} displayName={displayName} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="truncate font-semibold">{displayName}</span>
          <span className="truncate text-sm text-muted-foreground">
            @{handle}
          </span>
        </div>
        {bio && (
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {bio}
          </p>
        )}
        {attributes && attributes.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {attributes.map((attr) => (
              <AttributeBadge
                key={attr.type}
                type={attr.type}
                value={attr.value}
              />
            ))}
          </div>
        )}
      </div>
    </Link>
  );
}
