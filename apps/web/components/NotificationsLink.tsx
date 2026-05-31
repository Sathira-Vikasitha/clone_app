"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL, apiFetch } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";

type NotificationsLinkProps = {
  className?: string;
};

export function NotificationsLink({ className }: NotificationsLinkProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    apiFetch("/notifications/count", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (data) {
          setCount(data.count);
        }
      });

    const events = new EventSource(
      `${API_URL}/notifications/events?token=${encodeURIComponent(token)}`,
    );

    events.addEventListener("notification", () => {
      setCount((currentCount) => currentCount + 1);
    });

    return () => events.close();
  }, []);

  return (
    <Link
      className={`relative ${className || ""}`}
      href="/notifications"
    >
      Notifications
      {count > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#2DD4BF] px-1 text-xs font-bold text-neutral-950">
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Link>
  );
}
