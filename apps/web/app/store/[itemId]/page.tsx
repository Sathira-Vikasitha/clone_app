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
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <AppNav user={me} />

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-md border border-teal-300/40 px-4 py-2 text-sm text-teal-200"
            href="/store"
          >
            Go to store
          </Link>
          <Link
            className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/75"
            href="/purchases"
          >
            My purchases
          </Link>
        </div>

        {message ? (
          <p className="rounded-md border border-teal-300/30 bg-teal-300/10 p-3 text-sm text-teal-100">
            {message}
          </p>
        ) : null}

        {item ? (
          <article className="grid gap-6 rounded-md border border-white/10 bg-white/10 p-5 lg:grid-cols-[1.3fr_0.7fr]">
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
                <p className="text-sm uppercase tracking-[0.2em] text-teal-300">
                  Store item
                </p>
                <h1 className="mt-2 text-4xl font-semibold">{item.title}</h1>
                <p className="mt-2 text-white/60">
                  Sold by{" "}
                  <Link className="text-teal-200" href={`/profile/${item.seller.username}`}>
                    @{item.seller.username}
                  </Link>
                </p>
                <p className="mt-3 inline-flex rounded-full border border-teal-300/30 px-3 py-1 text-xs text-teal-200">
                  {item.category || "Other"}
                </p>
              </div>

              <p className="rounded-md bg-white px-4 py-3 text-lg font-bold text-neutral-950">
                {item.currency} {item.priceAmount}
              </p>
              <p className="rounded-md border border-white/10 bg-neutral-900 p-3 text-sm text-white/65">
                Downloaded {item.downloadCount} times
              </p>

              {item.description ? (
                <p className="whitespace-pre-wrap text-white/75">{item.description}</p>
              ) : (
                <p className="text-white/45">No description added.</p>
              )}

              {purchaseStatus ? (
                <p className="rounded-md border border-white/10 bg-neutral-900 p-3 text-sm text-white/70">
                  Payment status: {purchaseStatus}
                </p>
              ) : null}

              {isMine ? (
                <div className="rounded-md border border-white/10 bg-neutral-900 p-4">
                  <p className="font-semibold">This is your store item.</p>
                  <p className="mt-1 text-sm text-white/55">
                    Buyers can pay and request access from this page.
                  </p>
                  <a
                    className="mt-4 inline-flex rounded-md bg-teal-300 px-4 py-2 text-sm font-semibold text-neutral-950"
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
                  className="rounded-md bg-teal-300 px-5 py-3 text-center font-semibold text-neutral-950"
                >
                  Download image
                </button>
              ) : (
                <div className="flex flex-col gap-4">
                  <button
                    onClick={payByDemoCard}
                    className="rounded-md bg-teal-300 px-5 py-3 font-semibold text-neutral-950"
                  >
                    Pay by demo card
                  </button>

                  <div className="rounded-md border border-white/10 bg-neutral-900 p-4">
                    <p className="font-semibold">Manual payment receipt</p>
                    <p className="mt-1 text-sm text-white/55">
                      Upload your receipt. The seller approves it, then download unlocks.
                    </p>
                    <input
                      className="mt-4 w-full rounded-md border border-white/15 bg-neutral-950 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-neutral-950"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
                    />
                    <button
                      onClick={submitReceipt}
                      disabled={isUploading}
                      className="mt-3 rounded-md border border-white/15 px-3 py-2 text-sm text-white/80"
                    >
                      {isUploading ? "Uploading receipt..." : "Submit receipt"}
                    </button>
                  </div>
                </div>
              )}
            </aside>
          </article>
        ) : (
          <p className="text-white/60">Loading store item...</p>
        )}
      </section>
    </main>
  );
}
