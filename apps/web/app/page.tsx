"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";

type User = {
  id: string;
  name: string;
  username: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
};

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    apiFetch("/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Not logged in");
        }
        return response.json();
      })
      .then(setUser)
      .catch(() => {
        clearAccessToken();
        router.push("/login");
      });
  }, [router]);

  function logout() {
    clearAccessToken();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <nav className="flex items-center justify-between">
          <Link className="text-xl font-semibold" href="/">
            InstaClone
          </Link>
          <button
            onClick={logout}
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
          >
            Logout
          </button>
        </nav>

        <div className="rounded-md border border-white/10 bg-white/10 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-teal-300">
            Week 1 complete
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            {user ? `Hello, ${user.name}` : "Checking your login..."}
          </h1>
          {user ? (
            <div className="mt-6 grid gap-3 text-white/75">
              <p>Username: @{user.username}</p>
              <p>Email: {user.email}</p>
              <p>User ID: {user.id}</p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
