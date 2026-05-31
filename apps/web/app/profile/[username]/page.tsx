"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { Post, User, UserProfile } from "@/lib/types";

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [me, setMe] = useState<User | null>(null);
  const [error, setError] = useState("");

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
      .then((response) => (response.ok ? response.json() : null))
      .then(setMe);

    apiFetch(`/users/${params.username}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (response.status === 401) {
          clearAccessToken();
          router.push("/login");
          return null;
        }

        if (!response.ok) {
          throw new Error("Profile not found");
        }

        return response.json();
      })
      .then((data) => {
        if (data) {
          setProfile(data);
        }
      })
      .catch((caughtError: Error) => setError(caughtError.message));
  }, [params.username, router]);

  async function startChatWithProfile() {
    const token = getAccessToken();

    if (!token || !profile) {
      return;
    }

    const response = await apiFetch("/chats/start", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ username: profile.username }),
    });

    if (response.ok) {
      router.push("/messages");
    }
  }

  async function toggleSave(postId: string) {
    const token = getAccessToken();

    if (!token || !profile) {
      return;
    }

    const response = await apiFetch(`/posts/${postId}/save`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    setProfile({
      ...profile,
      posts: profile.posts.map((post: Post) =>
        post.id === postId ? { ...post, savedByMe: data.saved } : post,
      ),
    });
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <AppNav user={me} />

        {me?.username === profile?.username ? (
          <Link
            className="w-fit rounded-full border border-[#2DD4BF]/50 bg-[#2DD4BF]/10 px-4 py-2 text-sm font-semibold text-[#7DEADF]"
            href="/profile/edit"
          >
            Edit profile
          </Link>
        ) : null}

        {error ? (
          <p className="rounded-md border border-[#F87171]/30 bg-[#F87171]/10 p-4 text-[#FDA4A4]">
            {error}
          </p>
        ) : null}

        {profile ? (
          <>
            <header className="rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-7 shadow-2xl shadow-black/20">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 items-center justify-center rounded-3xl bg-[#2DD4BF] text-4xl font-black text-neutral-950 shadow-lg shadow-[#2DD4BF]/20">
                  {profile.avatarUrl ? (
                    <Image
                      className="h-full w-full rounded-full object-cover"
                      src={profile.avatarUrl}
                      alt=""
                      width={96}
                      height={96}
                    />
                  ) : (
                    profile.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-black tracking-tight sm:text-5xl">{profile.name}</h1>
                  <p className="mt-2 text-[#94A3B8]">@{profile.username}</p>
                  <p className="mt-4 text-[#DDEDE9]">
                    {profile.bio || "No bio yet."}
                  </p>
                  <p className="mt-4 text-sm text-[#7DEADF]">
                    {profile._count.posts} posts
                  </p>
                  {me?.username !== profile.username ? (
                    <button
                      onClick={startChatWithProfile}
                    className="mt-5 rounded-full bg-[#2DD4BF] px-5 py-2 text-sm font-semibold text-neutral-950"
                    >
                      Message
                    </button>
                  ) : null}
                </div>
              </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-2">
              {profile.posts.length === 0 ? (
                <div className="rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-8 text-center text-[#94A3B8] sm:col-span-2">
                  No posts on this profile yet.
                </div>
              ) : null}
              {profile.posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-4 shadow-xl shadow-black/10 transition hover:border-[#2DD4BF]/30"
                >
                  {post.imageUrl ? (
                    <Image
                      className="aspect-square w-full rounded-md object-cover"
                      src={post.imageUrl}
                      alt=""
                      width={600}
                      height={600}
                    />
                  ) : null}
                  <p className="mt-4 whitespace-pre-wrap text-[#F8FAFC]/90">
                    {post.caption}
                  </p>
                  <div className="mt-4 flex gap-4 text-sm text-[#94A3B8]/90">
                    <span>{post._count.likes} likes</span>
                    <span>{post._count.comments} comments</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      className="inline-flex rounded-md border border-[#2DD4BF]/25 px-3 py-2 text-sm text-[#DDEDE9]"
                      href={`/posts/${post.id}?from=profile`}
                    >
                      View post
                    </Link>
                    {me?.id !== post.author.id ? (
                      <button
                        onClick={() => toggleSave(post.id)}
                        className={`rounded-md px-3 py-2 text-sm font-medium ${
                          post.savedByMe
                            ? "bg-white text-neutral-950"
                            : "border border-[#2DD4BF]/25 text-[#DDEDE9]"
                        }`}
                      >
                        {post.savedByMe ? "Saved" : "Save"}
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : (
          <p className="text-[#94A3B8]">Loading profile...</p>
        )}
      </section>
    </main>
  );
}
