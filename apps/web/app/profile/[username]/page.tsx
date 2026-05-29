"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { User, UserProfile } from "@/lib/types";

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

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <nav className="flex items-center justify-between">
          <Link className="text-xl font-semibold" href="/">
            InstaClone
          </Link>
          <div className="flex items-center gap-3">
            {me?.username === profile?.username ? (
              <Link
                className="rounded-md border border-teal-300/50 px-4 py-2 text-sm text-teal-200"
                href="/profile/edit"
              >
                Edit profile
              </Link>
            ) : null}
            <Link
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
              href="/"
            >
              Feed
            </Link>
          </div>
        </nav>

        {error ? (
          <p className="rounded-md border border-red-300/30 bg-red-300/10 p-4 text-red-200">
            {error}
          </p>
        ) : null}

        {profile ? (
          <>
            <header className="rounded-md border border-white/10 bg-white/10 p-6">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-teal-300 text-3xl font-bold text-neutral-950">
                  {profile.avatarUrl ? (
                    <img
                      className="h-full w-full rounded-full object-cover"
                      src={profile.avatarUrl}
                      alt=""
                    />
                  ) : (
                    profile.name.slice(0, 1).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-4xl font-semibold">{profile.name}</h1>
                  <p className="mt-2 text-white/60">@{profile.username}</p>
                  <p className="mt-4 text-white/80">
                    {profile.bio || "No bio yet."}
                  </p>
                  <p className="mt-4 text-sm text-teal-200">
                    {profile._count.posts} posts
                  </p>
                </div>
              </div>
            </header>

            <section className="grid gap-4 sm:grid-cols-2">
              {profile.posts.map((post) => (
                <article
                  key={post.id}
                  className="rounded-md border border-white/10 bg-white/10 p-4"
                >
                  {post.imageUrl ? (
                    <img
                      className="aspect-square w-full rounded-md object-cover"
                      src={post.imageUrl}
                      alt=""
                    />
                  ) : null}
                  <p className="mt-4 whitespace-pre-wrap text-white/90">
                    {post.caption}
                  </p>
                  <div className="mt-4 flex gap-4 text-sm text-white/55">
                    <span>{post._count.likes} likes</span>
                    <span>{post._count.comments} comments</span>
                  </div>
                </article>
              ))}
            </section>
          </>
        ) : (
          <p className="text-white/60">Loading profile...</p>
        )}
      </section>
    </main>
  );
}
