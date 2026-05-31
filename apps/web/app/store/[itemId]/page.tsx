"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { StoreItem, User } from "@/lib/types";

export default function StoreItemPage() {
  const params = useParams<{ itemId: string }>();
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [item, setItem] = useState<StoreItem | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const loadItem = useCallback(
    async (token = getAccessToken()) => {
      if (!token) {
        return;
      }

      const response = await apiFetch(`/store/${params.itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (response.ok) {
        setItem(data as StoreItem);
        setMessage("");
      } else {
        setMessage(data.message || "Store item not found.");
      }
    },
    [params.itemId],
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

    void Promise.resolve().then(() => loadItem(token));
  }, [loadItem, router]);

  async function uploadFile(file: File) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      throw new Error("Not logged in");
    }

    const formData = new FormData();
    formData.append("image", file);

    const response = await apiFetch("/uploads/image", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Upload failed");
    }

    return data.imageUrl as string;
  }

  async function payByDemoCard() {
    const token = getAccessToken();

    if (!token || !item) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/store/${item.id}/purchase/card-demo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Card payment failed.");
      return;
    }

    setMessage(data.message || "Demo card payment complete.");
    loadItem(token);
  }

  async function downloadStoreItem() {
    const token = getAccessToken();

    if (!token || !item) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/store/${item.id}/download`, {
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
    loadItem(token);
  }

  async function submitReceipt() {
    const token = getAccessToken();

    if (!token || !item) {
      router.push("/login");
      return;
    }

    if (!receiptFile) {
      setMessage("Choose a receipt image first.");
      return;
    }

    try {
      setMessage("");
      setIsUploading(true);
      const receiptUrl = await uploadFile(receiptFile);
      const response = await apiFetch(`/store/${item.id}/purchase/receipt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiptUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not submit receipt.");
        return;
      }

      setReceiptFile(null);
      setMessage("Receipt submitted. Seller must approve it before download.");
      loadItem(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Receipt upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  const isMine = Boolean(me && item && me.id === item.sellerId);
  const purchaseStatus = item?.purchase?.status;

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <AppNav user={me} />

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-md border border-[#2DD4BF]/40 px-4 py-2 text-sm text-[#7DEADF]"
            href="/store"
          >
            Go to store
          </Link>
          <Link
            className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 text-sm text-[#DDEDE9]/85"
            href="/purchases"
          >
            My purchases
          </Link>
        </div>

        {message ? (
          <p className="rounded-md border border-[#2DD4BF]/30 bg-[#2DD4BF]/10 p-3 text-sm text-[#BDF7EF]">
            {message}
          </p>
        ) : null}

        {item ? (
          <article className="grid gap-6 rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-5 lg:grid-cols-[1.3fr_0.7fr]">
            <Image
              className="max-h-[720px] w-full rounded-md object-cover"
              src={item.imageUrl}
              alt={item.title}
              width={1400}
              height={1000}
              priority
            />

            <aside className="flex flex-col gap-5">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
                  Store item
                </p>
                <h1 className="mt-2 text-4xl font-semibold">{item.title}</h1>
                <p className="mt-2 text-[#94A3B8]">
                  Sold by{" "}
                  <Link className="text-[#7DEADF]" href={`/profile/${item.seller.username}`}>
                    @{item.seller.username}
                  </Link>
                </p>
                <p className="mt-3 inline-flex rounded-full border border-[#2DD4BF]/30 px-3 py-1 text-xs text-[#7DEADF]">
                  {item.category || "Other"}
                </p>
              </div>

              <p className="rounded-md bg-white px-4 py-3 text-lg font-bold text-neutral-950">
                {item.currency} {item.priceAmount}
              </p>
              <p className="rounded-md border border-[#2DD4BF]/15 bg-[#10201D] p-3 text-sm text-[#B8C7C2]">
                Downloaded {item.downloadCount} times
              </p>

              {item.description ? (
                <p className="whitespace-pre-wrap text-[#DDEDE9]/85">{item.description}</p>
              ) : (
                <p className="text-[#94A3B8]/75">No description added.</p>
              )}

              {purchaseStatus ? (
                <p className="rounded-md border border-[#2DD4BF]/15 bg-[#10201D] p-3 text-sm text-[#B8C7C2]">
                  Payment status: {purchaseStatus}
                </p>
              ) : null}

              {isMine ? (
                <div className="rounded-md border border-[#2DD4BF]/15 bg-[#10201D] p-4">
                  <p className="font-semibold">This is your store item.</p>
                  <p className="mt-1 text-sm text-[#94A3B8]/90">
                    Buyers can pay and request access from this page.
                  </p>
                  <a
                    className="mt-4 inline-flex rounded-md bg-[#2DD4BF] px-4 py-2 text-sm font-semibold text-neutral-950"
                    href={item.imageUrl}
                    target="_blank"
                    download
                  >
                    Download original
                  </a>
                </div>
              ) : item.canDownload ? (
                <button
                  onClick={downloadStoreItem}
                  className="rounded-md bg-[#2DD4BF] px-5 py-3 text-center font-semibold text-neutral-950"
                >
                  Download image
                </button>
              ) : (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={payByDemoCard}
                    className="rounded-md bg-[#2DD4BF] px-5 py-3 font-semibold text-neutral-950"
                  >
                    Pay by demo card
                  </button>

                  <div className="rounded-md border border-[#2DD4BF]/15 bg-[#10201D] p-4">
                    <p className="font-semibold">Manual payment receipt</p>
                    <p className="mt-1 text-sm text-[#94A3B8]/90">
                      Upload your receipt. The seller approves it, then download unlocks.
                    </p>
                    <input
                      className="mt-4 w-full rounded-md border border-[#2DD4BF]/25 bg-[#071311] px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-neutral-950"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                    />
                    <button
                      onClick={submitReceipt}
                      disabled={isUploading}
                      className="mt-3 rounded-md border border-[#2DD4BF]/25 px-3 py-2 text-sm text-[#DDEDE9]"
                    >
                      {isUploading ? "Uploading receipt..." : "Submit receipt"}
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </article>
        ) : (
          <p className="text-[#94A3B8]">Loading store item...</p>
        )}
      </section>
    </main>
  );
}
