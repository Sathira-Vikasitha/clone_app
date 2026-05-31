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
  "rounded-full border border-[#2DD4BF]/20 bg-[#071311]/35 px-3.5 py-2 text-sm font-medium text-[#DDEDE9] shadow-sm shadow-black/10 transition hover:-translate-y-0.5 hover:border-[#2DD4BF]/60 hover:bg-[#2DD4BF]/10 hover:text-[#7DEADF]";

export function AppNav({ user, showLogout = true }: AppNavProps) {
  const router = useRouter();

  function logout() {
    clearAccessToken();
    router.push("/login");
  }

  return (
    <nav className="sticky top-4 z-20 flex flex-col gap-4 rounded-3xl border border-[#2DD4BF]/15 bg-[#10201D]/85 p-4 shadow-2xl shadow-black/25 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <Link className="flex items-center gap-3" href="/">
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#2DD4BF]/35 bg-[#071311] shadow-lg shadow-[#2DD4BF]/20">
          <span className="absolute left-2 top-3 h-1.5 w-1.5 rounded-sm bg-[#2DD4BF]" />
          <span className="absolute left-3 top-7 h-2 w-2 rounded-sm bg-[#2DD4BF]" />
          <span className="absolute left-2.5 top-5 h-2.5 w-1.5 rotate-45 bg-[#F4C95D]" />
          <svg
            className="h-10 w-10 text-[#2DD4BF]"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M16 8h12c7.7 0 14 6.3 14 14s-6.3 14-14 14h-6v6h-6V8Zm6 6v16h6c4.4 0 8-3.6 8-8s-3.6-8-8-8h-6Z"
            />
            <path
              fill="#071311"
              d="M28 14h8l-8 8v-8Zm8 8v8h-8l8-8Zm-14 0 8-8v8h-8Zm0 0h8l-8 8v-8Z"
            />
          </svg>
        </span>
        <span>
          <span className="block text-xl font-black tracking-tight text-[#F8FAFC]">
            Pixora
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.2em] text-[#F4C95D]">
            Social Market
          </span>
        </span>
      </Link>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#2DD4BF]/10 bg-[#071311]/25 p-2">
        <SearchLink className={navLinkClass} />
        <NotificationsLink className={navLinkClass} />
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
            className="rounded-full border border-[#2DD4BF]/50 bg-[#2DD4BF]/10 px-3.5 py-2 text-sm font-semibold text-[#7DEADF] transition hover:-translate-y-0.5 hover:bg-[#2DD4BF]/20"
            href={`/profile/${user.username}`}
          >
            Profile
          </Link>
        ) : null}
        {user && showLogout ? (
          <button
            onClick={logout}
            suppressHydrationWarning
            className="rounded-full border border-[#F87171]/30 bg-[#F87171]/5 px-3.5 py-2 text-sm font-medium text-[#FDA4A4] transition hover:-translate-y-0.5 hover:border-[#F87171]/60 hover:bg-[#F87171]/10"
          >
            Logout
          </button>
        ) : null}
      </div>
    </nav>
  );
}
