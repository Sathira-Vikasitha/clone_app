"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { StorePurchaseHistory, User } from "@/lib/types";

export default function PurchasesPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [purchases, setPurchases] = useState<StorePurchaseHistory[]>([]);
  const [message, setMessage] = useState("Loading purchases...");

  const loadPurchases = useCallback(async (token = getAccessToken()) => {
    if (!token) {
      return;
    }

    const response = await apiFetch("/store/purchases", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = (await response.json()) as StorePurchaseHistory[];
      setPurchases(data);
      setMessage(data.length ? "" : "You have not bought any store images yet.");
    } else {
      setMessage("Could not load purchases.");
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
      .then(setMe)
      .catch(() => {
        clearAccessToken();
        router.push("/login");
      });

    const timeoutId = window.setTimeout(() => {
      loadPurchases(token);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadPurchases, router]);

  function canDownload(status: string) {
    return status === "paid" || status === "approved";
  }

  function getStatusLabel(status: string) {
    if (status === "paid") {
      return "Paid by card";
    }

    if (status === "approved") {
      return "Receipt approved";
    }

    if (status === "pending") {
      return "Waiting for seller approval";
    }

    if (status === "rejected") {
      return "Receipt rejected";
    }

    return status;
  }

  async function downloadPurchase(itemId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/store/${itemId}/download`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Download failed.");
      return;
    }

    window.open(data.imageUrl, "_blank", "noopener,noreferrer");
    setMessage(`Download recorded. Total downloads: ${data.downloadCount}.`);
    loadPurchases(token);
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <AppNav user={me} />

        <header className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
            Buyer history
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Purchases</h1>
          <p className="mt-3 text-[#94A3B8]">
            Track your store payments and download approved images.
          </p>
        </header>

        {message ? <p className="text-sm text-[#94A3B8]">{message}</p> : null}

        <section className="grid gap-5 md:grid-cols-2">
          {purchases.map((purchase) => (
            <article key={purchase.id} className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
              <Image
                className="aspect-video w-full rounded-md object-cover"
                src={purchase.item.imageUrl}
                alt=""
                width={900}
                height={506}
              />
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">{purchase.item.title}</h2>
                  <p className="mt-1 text-sm text-[#94A3B8]/90">
                    Seller: @{purchase.item.seller.username}
                  </p>
                </div>
                <p className="rounded-md bg-white px-3 py-2 text-sm font-bold text-neutral-950">
                  {purchase.item.currency} {purchase.item.priceAmount}
                </p>
              </div>

              {purchase.item.description ? (
                <p className="mt-3 text-sm text-[#B8C7C2]">{purchase.item.description}</p>
              ) : null}

              <div className="mt-4 flex flex-col gap-2 text-sm">
                <p className="text-[#94A3B8]">Method: {purchase.paymentMethod}</p>
                <p className="text-[#94A3B8]">Status: {getStatusLabel(purchase.status)}</p>
                <p className="text-[#94A3B8]/70">
                  Requested: {new Date(purchase.createdAt).toLocaleDateString()}
                </p>
                <p className="text-[#94A3B8]/70">
                  Downloads: {purchase.item._count.downloads}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {canDownload(purchase.status) ? (
                  <button
                    onClick={() => downloadPurchase(purchase.itemId)}
                    className="rounded-md bg-[#2DD4BF] px-4 py-2 text-sm font-semibold text-neutral-950"
                  >
                    Download image
                  </button>
                ) : (
                  <Link
                    className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 text-sm text-[#DDEDE9]"
                    href="/store"
                  >
                    Back to store
                  </Link>
                )}
                {purchase.receiptUrl ? (
                  <a className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 text-sm text-[#DDEDE9]" href={purchase.receiptUrl} target="_blank">
                    View receipt
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
