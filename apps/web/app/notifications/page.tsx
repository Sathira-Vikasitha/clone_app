"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { Notification, User } from "@/lib/types";

export default function NotificationsPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const markAllRead = useCallback(async () => {
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
  }, [router]);

  const loadNotifications = useCallback(
    async (token = getAccessToken()) => {
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
    },
    [markAllRead],
  );

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

    void Promise.resolve().then(() => loadNotifications(token));
  }, [loadNotifications, router]);

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <AppNav user={me} />

        <header className="flex items-center justify-between rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
              Activity
            </p>
            <h1 className="mt-2 text-4xl font-semibold">Notifications</h1>
          </div>
          <button
            onClick={markAllRead}
            className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 text-sm text-[#DDEDE9]"
          >
            Mark read
          </button>
        </header>

        <section className="flex flex-col gap-3">
          {notifications.length === 0 ? (
            <p className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-5 text-[#94A3B8]">
              No notifications yet.
            </p>
          ) : null}

          {notifications.map((notification) => (
            <article
              key={notification.id}
              className={`flex items-center gap-4 rounded-md border p-4 ${
                notification.readAt
                  ? "border-[#2DD4BF]/15 bg-[#10201D]/70"
                  : "border-[#2DD4BF]/40 bg-[#2DD4BF]/10"
              }`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#2DD4BF] font-bold text-neutral-950">
                {notification.actor.avatarUrl ? (
                  <Image
                    className="h-full w-full rounded-full object-cover"
                    src={notification.actor.avatarUrl}
                    alt=""
                    width={48}
                    height={48}
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
                  className="rounded-md border border-[#2DD4BF]/25 px-3 py-2 text-sm text-[#DDEDE9]"
                  href="/messages"
                >
                  Open
                </Link>
              ) : notification.postId ? (
                <Link
                  className="rounded-md border border-[#2DD4BF]/25 px-3 py-2 text-sm text-[#DDEDE9]"
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
