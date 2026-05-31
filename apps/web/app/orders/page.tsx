"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { StorePurchaseRequest, User } from "@/lib/types";

export default function OrdersPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [orders, setOrders] = useState<StorePurchaseRequest[]>([]);
  const [message, setMessage] = useState("Loading seller orders...");

  const loadOrders = useCallback(async (token = getAccessToken()) => {
    if (!token) {
      return;
    }

    const response = await apiFetch("/store/seller/requests", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = (await response.json()) as StorePurchaseRequest[];
      setOrders(data);
      setMessage(data.length ? "" : "No store orders yet.");
    } else {
      setMessage("Could not load seller orders.");
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
      loadOrders(token);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadOrders, router]);

  const summary = useMemo(() => {
    const successfulOrders = orders.filter(
      (order) => order.status === "paid" || order.status === "approved",
    );

    return {
      total: orders.length,
      pending: orders.filter((order) => order.status === "pending").length,
      paid: orders.filter((order) => order.status === "paid").length,
      approved: orders.filter((order) => order.status === "approved").length,
      rejected: orders.filter((order) => order.status === "rejected").length,
      earnings: successfulOrders.reduce(
        (total, order) => total + order.item.priceAmount,
        0,
      ),
      downloads: orders.reduce(
        (total, order) => total + order.item._count.downloads,
        0,
      ),
      currency: orders[0]?.item.currency || "LKR",
    };
  }, [orders]);

  function getStatusLabel(status: string) {
    if (status === "paid") {
      return "Paid by card";
    }

    if (status === "approved") {
      return "Receipt approved";
    }

    if (status === "pending") {
      return "Waiting for approval";
    }

    if (status === "rejected") {
      return "Rejected";
    }

    return status;
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <AppNav user={me} />

        <header className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
            Seller dashboard
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Orders summary</h1>
          <p className="mt-3 text-[#94A3B8]">
            Track buyer requests, paid orders, approval status, and estimated earnings.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7">
          <div className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
            <p className="text-sm text-[#94A3B8]/90">Total</p>
            <p className="mt-2 text-3xl font-semibold">{summary.total}</p>
          </div>
          <div className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
            <p className="text-sm text-[#94A3B8]/90">Pending</p>
            <p className="mt-2 text-3xl font-semibold">{summary.pending}</p>
          </div>
          <div className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
            <p className="text-sm text-[#94A3B8]/90">Card paid</p>
            <p className="mt-2 text-3xl font-semibold">{summary.paid}</p>
          </div>
          <div className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
            <p className="text-sm text-[#94A3B8]/90">Approved</p>
            <p className="mt-2 text-3xl font-semibold">{summary.approved}</p>
          </div>
          <div className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
            <p className="text-sm text-[#94A3B8]/90">Rejected</p>
            <p className="mt-2 text-3xl font-semibold">{summary.rejected}</p>
          </div>
          <div className="rounded-md border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 p-4">
            <p className="text-sm text-[#BDF7EF]">Earnings</p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.currency} {summary.earnings}
            </p>
          </div>
          <div className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
            <p className="text-sm text-[#94A3B8]/90">Downloads</p>
            <p className="mt-2 text-3xl font-semibold">{summary.downloads}</p>
          </div>
        </section>

        {message ? <p className="text-sm text-[#94A3B8]">{message}</p> : null}

        <section className="flex flex-col gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4">
              <div className="grid gap-4 md:grid-cols-[180px_1fr]">
                <Image
                  className="aspect-video w-full rounded-md object-cover"
                  src={order.item.imageUrl}
                  alt=""
                  width={360}
                  height={203}
                />
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-semibold">{order.item.title}</h2>
                      <p className="mt-1 text-sm text-[#94A3B8]/90">
                        Buyer: @{order.buyer.username}
                      </p>
                    </div>
                    <p className="rounded-md bg-white px-3 py-2 text-sm font-bold text-neutral-950">
                      {order.item.currency} {order.item.priceAmount}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-[#94A3B8] sm:grid-cols-2">
                    <p>Payment method: {order.paymentMethod}</p>
                    <p>Status: {getStatusLabel(order.status)}</p>
                    <p>Downloads: {order.item._count.downloads}</p>
                    <p>Created: {new Date(order.createdAt).toLocaleDateString()}</p>
                    {order.receiptUrl ? (
                      <a className="text-[#7DEADF]" href={order.receiptUrl} target="_blank">
                        View receipt
                      </a>
                    ) : (
                      <p>No receipt attached</p>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
