"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { User } from "@/lib/types";

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

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
      .then((data: User) => {
        setUser(data);
        setName(data.name);
        setBio(data.bio || "");
        setAvatarUrl(data.avatarUrl || "");
      })
      .catch(() => {
        clearAccessToken();
        router.push("/login");
      });
  }, [router]);

  async function uploadAvatar() {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!selectedAvatar) {
      setMessage("Choose an avatar image first");
      return;
    }

    setMessage("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("image", selectedAvatar);

    const response = await apiFetch("/uploads/image", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();
    setIsUploading(false);

    if (!response.ok) {
      setMessage(data.message || "Avatar upload failed");
      return;
    }

    setAvatarUrl(data.imageUrl);
  }

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch("/auth/me", {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        bio,
        avatarUrl,
      }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Profile update failed");
      return;
    }

    router.push(`/profile/${data.username}`);
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <AppNav user={user} />
        <Link
          className="w-fit rounded-md border border-[#2DD4BF]/25 px-4 py-2 text-sm text-[#DDEDE9]"
          href={user ? `/profile/${user.username}` : "/"}
        >
          Back to profile
        </Link>

        <form
          onSubmit={saveProfile}
          className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-6"
        >
          <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
            Profile
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Edit your profile</h1>

          <div className="mt-6 flex items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#2DD4BF] text-3xl font-bold text-neutral-950">
              {avatarUrl ? (
                <Image
                  className="h-full w-full rounded-full object-cover"
                  src={avatarUrl}
                  alt=""
                  width={96}
                  height={96}
                />
              ) : (
                name.slice(0, 1).toUpperCase()
              )}
            </div>
            <div className="min-w-0 flex-1">
              <input
                className="w-full rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-neutral-950"
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setSelectedAvatar(event.target.files?.[0] || null)
                }
              />
              <button
                className="mt-3 rounded-md border border-[#2DD4BF]/60 px-4 py-2 text-sm font-semibold text-[#7DEADF]"
                type="button"
                onClick={uploadAvatar}
                disabled={isUploading}
              >
                {isUploading ? "Uploading..." : "Upload avatar"}
              </button>
            </div>
          </div>

          <label className="mt-6 block text-sm text-[#B8C7C2]">Name</label>
          <input
            className="mt-2 h-12 w-full rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 outline-none focus:border-[#2DD4BF]"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />

          <label className="mt-4 block text-sm text-[#B8C7C2]">Bio</label>
          <textarea
            className="mt-2 min-h-28 w-full resize-none rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 py-3 outline-none focus:border-[#2DD4BF]"
            value={bio}
            onChange={(event) => setBio(event.target.value)}
            placeholder="Write a short bio..."
          />

          <label className="mt-4 block text-sm text-[#B8C7C2]">Avatar URL</label>
          <input
            className="mt-2 h-12 w-full rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 outline-none focus:border-[#2DD4BF]"
            value={avatarUrl}
            onChange={(event) => setAvatarUrl(event.target.value)}
            placeholder="Optional avatar URL"
          />

          {message ? <p className="mt-4 text-sm text-[#F87171]">{message}</p> : null}

          <button className="mt-6 h-12 rounded-md bg-[#2DD4BF] px-5 font-semibold text-neutral-950">
            Save profile
          </button>
        </form>
      </section>
    </main>
  );
}
