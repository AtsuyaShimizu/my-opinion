"use client";

import Link from "next/link";

interface PostContentProps {
  content: string;
  className?: string;
}

const MENTION_REGEX = /@([a-zA-Z0-9_]+)/g;

export function PostContent({ content, className }: PostContentProps) {
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = MENTION_REGEX.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const handle = match[1];
    parts.push(
      <Link
        key={`mention-${match.index}`}
        href={`/users/${handle}`}
        onClick={(e) => e.stopPropagation()}
        className="text-primary font-medium hover:underline"
      >
        @{handle}
      </Link>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  return <p className={className}>{parts}</p>;
}
