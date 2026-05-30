"use client";

import Link from "next/link";

export function SearchLink() {
  return (
    <Link
      className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
      href="/search"
    >
      Search
    </Link>
  );
}
