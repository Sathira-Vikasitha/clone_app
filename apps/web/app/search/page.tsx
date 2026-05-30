"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { NotificationsLink } from "@/components/NotificationsLink";
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
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <nav className="flex items-center justify-between">
          <Link className="text-xl font-semibold" href="/">
            InstaClone
          </Link>
          <div className="flex items-center gap-3">
            <NotificationsLink />
            {me ? (
              <Link
                className="rounded-md border border-teal-300/50 px-4 py-2 text-sm text-teal-200"
                href={`/profile/${me.username}`}
              >
                Profile
              </Link>
            ) : null}
            <Link
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
              href="/"
            >
              Feed
            </Link>
          </div>
        </nav>

        <header className="rounded-md border border-white/10 bg-white/10 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-teal-300">
            Discover
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Search users</h1>
          <p className="mt-3 text-white/60">
            Search by name or username. Email is never used for search.
          </p>
        </header>

        <div className="flex gap-3">
          <input
            className="h-12 min-w-0 flex-1 rounded-md border border-white/15 bg-neutral-900 px-4 outline-none focus:border-teal-300"
            placeholder="name or username"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>

        {isSearching ? (
          <p className="text-sm text-teal-200">Searching...</p>
        ) : message ? (
          <p className="text-sm text-white/60">{message}</p>
        ) : null}

        <section className="flex flex-col gap-3">
          {users.map((user) => (
            <article
              key={user.id}
              className="flex items-center gap-4 rounded-md border border-white/10 bg-white/10 p-4 hover:border-teal-300/50"
            >
              <Link
                className="flex min-w-0 flex-1 items-center gap-4"
                href={`/profile/${user.username}`}
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-300 font-bold text-neutral-950">
                  {user.avatarUrl ? (
                    <img
                      className="h-full w-full rounded-full object-cover"
                      src={user.avatarUrl}
                      alt=""
                    />
                  ) : (
                    user.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-white/55">@{user.username}</p>
                  <p className="mt-1 truncate text-sm text-white/65">
                    {user.bio || "No bio yet."}
                  </p>
                </div>
              </Link>
              <p className="text-sm text-white/45">{user._count.posts} posts</p>
              <button
                onClick={() => startChatWithUsername(user.username)}
                className="rounded-md bg-teal-300 px-4 py-2 text-sm font-semibold text-neutral-950"
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
