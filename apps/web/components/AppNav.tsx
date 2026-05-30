"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { clearAccessToken } from "@/lib/auth";
import type { User } from "@/lib/types";
import { NotificationsLink } from "./NotificationsLink";
import { SearchLink } from "./SearchLink";

type AppNavProps = {
  user?: Pick<User, "username" | "role"> | null;
  showLogout?: boolean;
};

const navLinkClass =
  "rounded-md border border-white/15 px-3 py-2 text-sm text-white/80 hover:border-teal-300/50 hover:text-teal-200";

export function AppNav({ user, showLogout = true }: AppNavProps) {
  const router = useRouter();

  function logout() {
    clearAccessToken();
    router.push("/login");
  }

  return (
    <nav className="flex flex-col gap-4 rounded-md border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center sm:justify-between">
      <Link className="text-xl font-semibold tracking-tight" href="/">
        InstaClone
      </Link>

      <div className="flex flex-wrap items-center gap-2">
        <SearchLink />
        <NotificationsLink />
        <Link className={navLinkClass} href="/">
          Feed
        </Link>
        <Link className={navLinkClass} href="/store">
          Store
        </Link>
        <Link className={navLinkClass} href="/purchases">
          Purchases
        </Link>
        <Link className={navLinkClass} href="/orders">
          Orders
        </Link>
        <Link className={navLinkClass} href="/messages">
          Messages
        </Link>
        <Link className={navLinkClass} href="/saved">
          Saved
        </Link>
        {user?.role === "admin" ? (
          <Link className={navLinkClass} href="/admin">
            Admin
          </Link>
        ) : null}
        {user ? (
          <Link
            className="rounded-md border border-teal-300/50 px-3 py-2 text-sm text-teal-200 hover:bg-teal-300/10"
            href={`/profile/${user.username}`}
          >
            Profile
          </Link>
        ) : null}
        {user && showLogout ? (
          <button
            onClick={logout}
            suppressHydrationWarning
            className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/80 hover:border-red-300/50 hover:text-red-200"
          >
            Logout
          </button>
        ) : null}
      </div>
    </nav>
  );
}
