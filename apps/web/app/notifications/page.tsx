"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchLink } from "@/components/SearchLink";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { Notification, User } from "@/lib/types";

export default function NotificationsPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

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

    loadNotifications(token);
  }, [router]);

  async function loadNotifications(token = getAccessToken()) {
    if (!token) {
      return;
    }

    const response = await apiFetch("/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = (await response.json()) as Notification[];
      setNotifications(data);

      if (data.some((notification) => !notification.readAt)) {
        markAllRead();
      }
    }
  }

  async function markAllRead() {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch("/notifications/read", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setNotifications((currentNotifications) =>
        currentNotifications.map((notification) => ({
          ...notification,
          readAt: notification.readAt || new Date().toISOString(),
        })),
      );
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
            <SearchLink />
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
              href="/messages"
            >
              Messages
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
              href="/"
            >
              Feed
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
              href="/store"
            >
              Store
            </Link>
          </div>
        </nav>

        <header className="flex items-center justify-between rounded-md border border-white/10 bg-white/10 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-teal-300">
              Activity
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Notifications</h1>
          </div>
          <button
            onClick={markAllRead}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
          >
            Mark read
          </button>
        </header>

        <section className="flex flex-col gap-3">
          {notifications.length === 0 ? (
            <p className="rounded-md border border-white/10 bg-white/10 p-5 text-white/60">
              No notifications yet.
            </p>
          ) : null}

          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`flex items-center gap-4 rounded-md border p-4 ${
                notification.readAt
                  ? "border-white/10 bg-white/5"
                  : "border-teal-300/40 bg-teal-300/10"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-300 font-bold text-neutral-950">
                {notification.actor.avatarUrl ? (
                  <img
                    className="h-full w-full rounded-full object-cover"
                    src={notification.actor.avatarUrl}
                    alt=""
                  />
                ) : (
                  notification.actor.name.slice(0, 1).toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p>{notification.message}</p>
                <p className="mt-1 text-sm text-white/50">
                  {new Date(notification.createdAt).toLocaleString()}
                </p>
              </div>
              {notification.type === "message" ? (
                <Link
                  className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/80"
                  href="/messages"
                >
                  Open
                </Link>
              ) : notification.postId ? (
                <Link
                  className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/80"
                  href={`/posts/${notification.postId}`}
                >
                  Open
                </Link>
              ) : null}
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
