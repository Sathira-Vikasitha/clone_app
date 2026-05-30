"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { StoreItem, StorePurchaseRequest, User } from "@/lib/types";

export default function StorePage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [sellerRequests, setSellerRequests] = useState<StorePurchaseRequest[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceAmount, setPriceAmount] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [receiptFiles, setReceiptFiles] = useState<Record<string, File | null>>({});
  const [editingItemId, setEditingItemId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriceAmount, setEditPriceAmount] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [visibleItemCount, setVisibleItemCount] = useState(4);
  const [message, setMessage] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const loadStore = useCallback(async (token = getAccessToken(), query = searchQuery) => {
    if (!token) {
      return;
    }

    const cleanedQuery = query.trim();
    const [itemsResponse, requestsResponse] = await Promise.all([
      apiFetch(`/store${cleanedQuery ? `?q=${encodeURIComponent(cleanedQuery)}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      apiFetch("/store/seller/requests", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (itemsResponse.ok) {
      setItems((await itemsResponse.json()) as StoreItem[]);
    }

    if (requestsResponse.ok) {
      setSellerRequests((await requestsResponse.json()) as StorePurchaseRequest[]);
    }
  }, [searchQuery]);

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
      loadStore(token);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadStore, router]);

  useEffect(() => {
    const token = getAccessToken();

    if (!token) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadStore(token, searchQuery);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [loadStore, searchQuery]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisibleItemCount(4);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery]);

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

  async function uploadStoreImage() {
    if (!selectedImage) {
      setMessage("Choose a store image first.");
      return;
    }

    try {
      setMessage("");
      setIsUploading(true);
      const uploadedUrl = await uploadFile(selectedImage);
      setImageUrl(uploadedUrl);
      setMessage("Store image uploaded.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Image upload failed.");
    } finally {
      setIsUploading(false);
    }
  }

  async function createItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();
    const amount = Number(priceAmount);

    if (!token) {
      router.push("/login");
      return;
    }

    if (!imageUrl || !title.trim() || !amount) {
      setMessage("Title, price, and image are required.");
      return;
    }

    const response = await apiFetch("/store", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title,
        description,
        imageUrl,
        priceAmount: amount,
        currency: "LKR",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Could not create store item.");
      return;
    }

    setTitle("");
    setDescription("");
    setPriceAmount("");
    setImageUrl("");
    setSelectedImage(null);
    setMessage("Store item created.");
    loadStore(token);
  }

  async function submitReceipt(itemId: string) {
    const token = getAccessToken();
    const receiptFile = receiptFiles[itemId];

    if (!token) {
      router.push("/login");
      return;
    }

    if (!receiptFile) {
      setMessage("Choose a receipt image first.");
      return;
    }

    try {
      setMessage("");
      const receiptUrl = await uploadFile(receiptFile);
      const response = await apiFetch(`/store/${itemId}/purchase/receipt`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiptUrl }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not submit receipt.");
        return;
      }

      setReceiptFiles((current) => ({ ...current, [itemId]: null }));
      setMessage("Receipt submitted. Seller must approve it.");
      loadStore(token);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Receipt upload failed.");
    }
  }

  async function payByDemoCard(itemId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/store/${itemId}/purchase/card-demo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Card payment failed.");
      return;
    }

    setMessage(data.message || "Demo card payment complete.");
    loadStore(token);
  }

  async function updateRequest(purchaseId: string, action: "approve" | "reject") {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/store/purchases/${purchaseId}/${action}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setMessage(action === "approve" ? "Purchase approved." : "Purchase rejected.");
      loadStore(token);
    }
  }

  function startEditingItem(item: StoreItem) {
    setEditingItemId(item.id);
    setEditTitle(item.title);
    setEditDescription(item.description || "");
    setEditPriceAmount(String(item.priceAmount));
    setEditImageUrl(item.imageUrl);
  }

  function cancelEditingItem() {
    setEditingItemId("");
    setEditTitle("");
    setEditDescription("");
    setEditPriceAmount("");
    setEditImageUrl("");
  }

  async function saveStoreItemEdit(itemId: string) {
    const token = getAccessToken();
    const amount = Number(editPriceAmount);

    if (!token) {
      router.push("/login");
      return;
    }

    if (!editTitle.trim() || !editImageUrl || !amount) {
      setMessage("Edit title, price, and image URL are required.");
      return;
    }

    const response = await apiFetch(`/store/${itemId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: editTitle,
        description: editDescription,
        imageUrl: editImageUrl,
        priceAmount: amount,
        currency: "LKR",
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Could not update store item.");
      return;
    }

    setMessage("Store item updated.");
    cancelEditingItem();
    loadStore(token);
  }

  async function deleteStoreItem(itemId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmed = window.confirm("Delete this store item?");

    if (!confirmed) {
      return;
    }

    const response = await apiFetch(`/store/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setMessage("Store item deleted.");
      loadStore(token);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <AppNav user={me} />

        <header className="rounded-md border border-white/10 bg-white/10 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-teal-300">
            Marketplace
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Store</h1>
          <p className="mt-3 text-white/60">
            Sell downloadable images. Buyers can pay by receipt approval or demo card payment.
          </p>
        </header>

        {message ? (
          <p className="rounded-md border border-teal-300/30 bg-teal-300/10 p-3 text-sm text-teal-100">
            {message}
          </p>
        ) : null}

        <form onSubmit={createItem} className="rounded-md border border-white/10 bg-white/10 p-5">
          <h2 className="text-2xl font-semibold">Add image to store</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              className="h-12 rounded-md border border-white/15 bg-neutral-900 px-4 outline-none focus:border-teal-300"
              placeholder="Image title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
            <input
              className="h-12 rounded-md border border-white/15 bg-neutral-900 px-4 outline-none focus:border-teal-300"
              placeholder="Price in LKR"
              type="number"
              min="1"
              value={priceAmount}
              onChange={(event) => setPriceAmount(event.target.value)}
            />
          </div>
          <textarea
            className="mt-3 min-h-24 w-full resize-none rounded-md border border-white/15 bg-neutral-900 px-4 py-3 outline-none focus:border-teal-300"
            placeholder="Description with hashtags, example: Edited nature image #nature #wallpaper"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
          <input
            className="mt-3 h-12 w-full rounded-md border border-white/15 bg-neutral-900 px-4 outline-none focus:border-teal-300"
            placeholder="Uploaded image URL"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-md border border-white/15 bg-neutral-900 px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-neutral-950"
              type="file"
              accept="image/*"
              onChange={(event) => setSelectedImage(event.target.files?.[0] || null)}
            />
            <button
              type="button"
              onClick={uploadStoreImage}
              disabled={isUploading}
              className="rounded-md border border-teal-300/60 px-4 py-2 text-sm font-semibold text-teal-200"
            >
              {isUploading ? "Uploading..." : "Upload image"}
            </button>
          </div>
          {imageUrl ? (
            <img className="mt-4 max-h-72 w-full rounded-md object-cover" src={imageUrl} alt="" />
          ) : null}
          <button className="mt-4 rounded-md bg-teal-300 px-5 py-3 font-semibold text-neutral-950">
            Publish to store
          </button>
        </form>

        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Explore store</h2>
              <p className="mt-1 text-sm text-white/55">
                Search by title, description, or hashtags like #nature.
              </p>
            </div>
            <input
              className="h-12 w-full rounded-md border border-white/15 bg-neutral-900 px-4 outline-none focus:border-teal-300 sm:max-w-xs"
              placeholder="Search #nature or wallpaper"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            {items.length === 0 ? (
              <p className="rounded-md border border-white/10 bg-white/10 p-4 text-sm text-white/60 md:col-span-2">
                No store images found.
              </p>
            ) : null}
            {items.slice(0, visibleItemCount).map((item) => {
              const isMine = me?.id === item.sellerId;
              const purchaseStatus = item.purchase?.status;
              const isEditing = editingItemId === item.id;

              return (
                <article key={item.id} className="rounded-md border border-white/10 bg-white/10 p-4">
                  <img className="aspect-video w-full rounded-md object-cover" src={item.imageUrl} alt="" />
                  {isEditing ? (
                    <div className="mt-4 flex flex-col gap-3">
                      <input
                        className="h-11 rounded-md border border-white/15 bg-neutral-900 px-3 outline-none focus:border-teal-300"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                      />
                      <input
                        className="h-11 rounded-md border border-white/15 bg-neutral-900 px-3 outline-none focus:border-teal-300"
                        type="number"
                        min="1"
                        value={editPriceAmount}
                        onChange={(event) => setEditPriceAmount(event.target.value)}
                      />
                      <textarea
                        className="min-h-24 resize-none rounded-md border border-white/15 bg-neutral-900 px-3 py-2 outline-none focus:border-teal-300"
                        value={editDescription}
                        onChange={(event) => setEditDescription(event.target.value)}
                      />
                      <input
                        className="h-11 rounded-md border border-white/15 bg-neutral-900 px-3 outline-none focus:border-teal-300"
                        value={editImageUrl}
                        onChange={(event) => setEditImageUrl(event.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveStoreItemEdit(item.id)}
                          className="rounded-md bg-teal-300 px-3 py-2 text-sm font-semibold text-neutral-950"
                        >
                          Save changes
                        </button>
                        <button
                          onClick={cancelEditingItem}
                          className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/80"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mt-4 flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-xl font-semibold">{item.title}</h3>
                          <p className="mt-1 text-sm text-white/55">
                            by @{item.seller.username}
                          </p>
                        </div>
                        <p className="rounded-md bg-white px-3 py-2 text-sm font-bold text-neutral-950">
                          {item.currency} {item.priceAmount}
                        </p>
                      </div>
                      {item.description ? (
                        <p className="mt-3 text-sm text-white/70">{item.description}</p>
                      ) : null}
                    </>
                  )}

                  <div className="mt-4 flex flex-col gap-3">
                    {isMine ? (
                      <div className="flex flex-wrap gap-2">
                        <p className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/70">
                          This is your store item.
                        </p>
                        {!isEditing ? (
                          <>
                            <button
                              onClick={() => startEditingItem(item)}
                              className="rounded-md border border-white/15 px-3 py-2 text-sm text-white/80"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => deleteStoreItem(item.id)}
                              className="rounded-md border border-red-300/40 px-3 py-2 text-sm text-red-200"
                            >
                              Delete
                            </button>
                          </>
                        ) : null}
                      </div>
                    ) : item.canDownload ? (
                      <a
                        className="rounded-md bg-teal-300 px-4 py-2 text-center text-sm font-semibold text-neutral-950"
                        href={item.imageUrl}
                        download
                        target="_blank"
                      >
                        Download image
                      </a>
                    ) : (
                      <>
                        <button
                          onClick={() => payByDemoCard(item.id)}
                          className="rounded-md bg-teal-300 px-4 py-2 text-sm font-semibold text-neutral-950"
                        >
                          Demo card payment
                        </button>
                        <div className="rounded-md border border-white/10 bg-neutral-900 p-3">
                          <p className="text-sm font-semibold">Pay manually and attach receipt</p>
                          <input
                            className="mt-3 w-full rounded-md border border-white/15 bg-neutral-950 px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-neutral-950"
                            type="file"
                            accept="image/*"
                            onChange={(event) =>
                              setReceiptFiles((current) => ({
                                ...current,
                                [item.id]: event.target.files?.[0] || null,
                              }))
                            }
                          />
                          <button
                            onClick={() => submitReceipt(item.id)}
                            className="mt-3 rounded-md border border-white/15 px-3 py-2 text-sm text-white/80"
                          >
                            Submit receipt
                          </button>
                        </div>
                      </>
                    )}

                    {purchaseStatus ? (
                      <p className="text-sm text-white/55">Payment status: {purchaseStatus}</p>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          {items.length > visibleItemCount ? (
            <button
              onClick={() => setVisibleItemCount((currentCount) => currentCount + 4)}
              className="mt-5 rounded-md border border-white/15 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
            >
              See more store images
            </button>
          ) : null}
        </section>

        <section className="rounded-md border border-white/10 bg-white/10 p-5">
          <h2 className="text-2xl font-semibold">Buyer requests for your store items</h2>
          <div className="mt-4 flex flex-col gap-3">
            {sellerRequests.length === 0 ? (
              <p className="text-sm text-white/60">No buyer requests yet.</p>
            ) : null}
            {sellerRequests.map((request) => (
              <article key={request.id} className="rounded-md bg-neutral-900 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{request.item.title}</p>
                    <p className="text-sm text-white/60">
                      @{request.buyer.username} paid with {request.paymentMethod}. Status: {request.status}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-teal-200">
                    {request.item.currency} {request.item.priceAmount}
                  </p>
                </div>
                {request.receiptUrl ? (
                  <a className="mt-3 inline-flex text-sm text-teal-200" href={request.receiptUrl} target="_blank">
                    View receipt
                  </a>
                ) : null}
                {request.status === "pending" ? (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => updateRequest(request.id, "approve")}
                      className="rounded-md bg-teal-300 px-3 py-2 text-sm font-semibold text-neutral-950"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateRequest(request.id, "reject")}
                      className="rounded-md border border-red-300/40 px-3 py-2 text-sm text-red-200"
                    >
                      Reject
                    </button>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
