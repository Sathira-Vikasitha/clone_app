"use client";

import Link from "next/link";

export function SearchLink() {
  return (
    <Link
      className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 text-sm text-[#DDEDE9]"
      href="/search"
    >
      Search
    </Link>
  );
}
