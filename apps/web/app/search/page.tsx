"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { User, UserSearchResult } from "@/lib/types";

export default function SearchPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<UserSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const searchUsers = useCallback(async (cleanedQuery: string, token: string) => {
    setMessage("");
    setIsSearching(true);

    const response = await apiFetch(
      `/users/search?q=${encodeURIComponent(cleanedQuery)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (response.ok) {
      const results = (await response.json()) as UserSearchResult[];
      setUsers(results);
      setMessage(results.length === 0 ? "No users found." : "");
    }

    setIsSearching(false);
  }, []);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    apiFetch("/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Not logged in");
        }

        return response.json();
      })
      .then(setMe)
      .catch(() => {
        clearAccessToken();
        router.push("/login");
      });
  }, [router]);

  useEffect(() => {
    const token = getAccessToken();
    const cleanedQuery = query.replace(/^@/, "").trim();

    if (!token || !cleanedQuery) {
      const timeoutId = window.setTimeout(() => {
        setUsers([]);
        setMessage(cleanedQuery ? "" : "Type a name or username to search.");
      }, 0);

      return () => window.clearTimeout(timeoutId);
    }

    const timeoutId = window.setTimeout(() => {
      searchUsers(cleanedQuery, token);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [query, searchUsers]);

  async function startChatWithUsername(username: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch("/chats/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username }),
    });

    if (response.ok) {
      router.push("/messages");
    }
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <AppNav user={me} />

        <header className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
            Discover
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Search users</h1>
          <p className="mt-3 text-[#94A3B8]">
            Search by name or username. Email is never used for search.
          </p>
        </header>

        <div className="flex gap-3">
          <input
            className="h-12 min-w-0 flex-1 rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 outline-none focus:border-[#2DD4BF]"
            placeholder="name or username"
            suppressHydrationWarning
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {isSearching ? (
          <p className="text-sm text-[#7DEADF]">Searching...</p>
        ) : message ? (
          <p className="text-sm text-[#94A3B8]">{message}</p>
        ) : null}

        <section className="flex flex-col gap-3">
          {users.map((user) => (
            <article
              key={user.id}
              className="flex items-center gap-4 rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4 hover:border-[#2DD4BF]/50"
            >
              <Link
                className="flex min-w-0 flex-1 items-center gap-4"
                href={`/profile/${user.username}`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#2DD4BF] font-bold text-neutral-950">
                  {user.avatarUrl ? (
                    <Image
                      className="h-full w-full rounded-full object-cover"
                      src={user.avatarUrl}
                      alt=""
                      width={56}
                      height={56}
                    />
                  ) : (
                    user.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-[#94A3B8]/90">@{user.username}</p>
                  <p className="mt-1 truncate text-sm text-[#B8C7C2]">
                    {user.bio || "No bio yet."}
                  </p>
                </div>
              </Link>
              <p className="text-sm text-[#94A3B8]/75">{user._count.posts} posts</p>
              <button
                onClick={() => startChatWithUsername(user.username)}
                className="rounded-md bg-[#2DD4BF] px-4 py-2 text-sm font-semibold text-neutral-950"
              >
                Message
              </button>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
