"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { Post, User } from "@/lib/types";

export default function SavedPostsPage() {
  const router = useRouter();
  const [me, setMe] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [message, setMessage] = useState("Loading saved posts...");

  const loadSavedPosts = useCallback(async (token = getAccessToken()) => {
    if (!token) {
      return;
    }

    const response = await apiFetch("/posts/saved", {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const savedPosts = (await response.json()) as Post[];
      setPosts(savedPosts);
      setMessage(savedPosts.length ? "" : "You have not saved any posts yet.");
    } else {
      setMessage("Could not load saved posts.");
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
      loadSavedPosts(token);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadSavedPosts, router]);

  async function toggleSave(postId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/posts/${postId}/save`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId),
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <AppNav user={me} />

        <header className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
            Private
          </p>
          <h1 className="mt-2 text-4xl font-semibold">Saved posts</h1>
          <p className="mt-3 text-[#94A3B8]">
            Only you can see the posts you save.
          </p>
        </header>

        {message ? <p className="text-sm text-[#94A3B8]">{message}</p> : null}

        <section className="flex flex-col gap-5">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Link
                    className="font-semibold hover:text-[#7DEADF]"
                    href={`/profile/${post.author.username}`}
                  >
                    {post.author.name}
                  </Link>
                  <Link
                    className="block text-sm text-[#94A3B8]/90 hover:text-[#7DEADF]"
                    href={`/profile/${post.author.username}`}
                  >
                    @{post.author.username}
                  </Link>
                </div>
                <p className="text-xs text-[#94A3B8]/75">
                  {new Date(post.createdAt).toLocaleDateString()}
                </p>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-[#F8FAFC]/90">
                {post.caption}
              </p>

              {post.imageUrl ? (
                <Image
                  className="mt-4 max-h-[520px] w-full rounded-md object-cover"
                  src={post.imageUrl}
                  alt=""
                  width={1200}
                  height={900}
                />
              ) : null}

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <Link
                  className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 font-medium text-[#DDEDE9]/85"
                  href={`/posts/${post.id}?from=saved`}
                >
                  View post
                </Link>
                <button
                  onClick={() => toggleSave(post.id)}
                  className="rounded-md bg-white px-4 py-2 font-medium text-neutral-950"
                >
                  Remove saved
                </button>
                <span className="text-[#94A3B8]/90">
                  {post._count.likes} likes
                </span>
                <span className="text-[#94A3B8]/90">
                  {post._count.comments} comments
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {post.comments.slice(-2).map((comment) => (
                  <div key={comment.id} className="rounded-md bg-[#10201D] p-3">
                    <p className="text-sm font-semibold">
                      @{comment.author.username}
                    </p>
                    <p className="mt-1 text-sm text-[#DDEDE9]/85">{comment.body}</p>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
