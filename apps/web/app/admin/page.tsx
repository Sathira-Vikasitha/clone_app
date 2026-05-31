"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { AdminDashboard, User } from "@/lib/types";

export default function AdminPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [dashboard, setDashboard] = useState<AdminDashboard | null>(null);
  const [message, setMessage] = useState("Loading admin dashboard...");

  const loadDashboard = useCallback(async (token = getAccessToken()) => {
    if (!token) {
      return;
    }

    const response = await apiFetch("/admin/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (response.ok) {
      setDashboard(data as AdminDashboard);
      setMessage("");
    } else {
      setMessage(data.message || "Admin access required.");
    }
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
      .then((user: User) => {
        setMe(user);

        if (user.role !== "admin") {
          setMessage("Admin access required.");
          return;
        }

        loadDashboard(token);
      })
      .catch(() => {
        clearAccessToken();
        router.push("/login");
      });
  }, [loadDashboard, router]);

  async function deleteStoreItem(itemId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmed = window.confirm("Admin delete this store item?");

    if (!confirmed) {
      return;
    }

    const response = await apiFetch(`/admin/store/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Delete failed.");
      return;
    }

    setMessage("Store item deleted by admin.");
    loadDashboard(token);
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <AppNav user={me} />

        <header className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
            Moderation
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Admin dashboard</h1>
          <p className="mt-3 text-[#94A3B8]">
            Review app health and remove unsafe store items when needed.
          </p>
        </header>

        {message ? (
          <p className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4 text-sm text-[#B8C7C2]">
            {message}
          </p>
        ) : null}

        {dashboard ? (
          <>
            <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
              {Object.entries(dashboard.stats).map(([label, value]) => (
                <div key={label} className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
                  <p className="text-sm capitalize text-[#94A3B8]/90">
                    {label.replace(/([A-Z])/g, " $1")}
                  </p>
                  <p className="mt-2 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </section>

            <section>
              <h2 className="text-2xl font-semibold">Latest store items</h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {dashboard.latestStoreItems.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4"
                  >
                    <Image
                      className="aspect-video w-full rounded-md object-cover"
                      src={item.imageUrl}
                      alt={item.title}
                      width={800}
                      height={450}
                    />
                    <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-semibold">{item.title}</h3>
                        <p className="mt-1 text-sm text-[#94A3B8]/90">
                          @{item.seller.username} | {item.category}
                        </p>
                      </div>
                      <p className="rounded-md bg-white px-3 py-2 text-sm font-bold text-neutral-950">
                        {item.currency} {item.priceAmount}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                      <p className="rounded-md border border-[#2DD4BF]/25 px-3 py-2 text-[#B8C7C2]">
                        Purchases: {item._count.purchases}
                      </p>
                      <p className="rounded-md border border-[#2DD4BF]/25 px-3 py-2 text-[#B8C7C2]">
                        Downloads: {item._count.downloads}
                      </p>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        className="rounded-md border border-[#2DD4BF]/50 px-4 py-2 text-sm font-semibold text-[#7DEADF]"
                        href={`/store/${item.id}`}
                      >
                        View item
                      </Link>
                      <button
                        onClick={() => deleteStoreItem(item.id)}
                        className="rounded-md border border-[#F87171]/50 px-4 py-2 text-sm font-semibold text-[#FDA4A4]"
                      >
                        Admin delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </>
        ) : null}
      </section>
    </main>
  );
}
