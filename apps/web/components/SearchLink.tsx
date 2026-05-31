"use client";

import Link from "next/link";

type SearchLinkProps = {
  className?: string;
};

export function SearchLink({ className }: SearchLinkProps) {
  return (
    <Link
      className={className}
      href="/search"
    >
      Search
    </Link>
  );
}
