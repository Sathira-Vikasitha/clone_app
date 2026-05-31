"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { Post, User } from "@/lib/types";

export default function PostDetailPage() {
  const params = useParams<{ postId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [me, setMe] = useState<User | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [visibleCommentCount, setVisibleCommentCount] = useState(4);
  const [error, setError] = useState("");
  const from = searchParams.get("from");

  const loadPost = useCallback(
    async (token = getAccessToken()) => {
      if (!token) {
        return;
      }

      const response = await apiFetch(`/posts/${params.postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setPost(await response.json());
      } else {
        setError("Post not found");
      }
    },
    [params.postId],
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

    void Promise.resolve().then(() => loadPost(token));
  }, [loadPost, params.postId, router]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setVisibleCommentCount(4);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [params.postId]);

  function getFallbackHref() {
    if (from === "profile" && post) {
      return `/profile/${post.author.username}`;
    }

    if (from === "saved") {
      return "/saved";
    }

    return "/";
  }

  async function toggleLike() {
    const token = getAccessToken();

    if (!token || !post) {
      return;
    }

    const response = await apiFetch(`/posts/${post.id}/like`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      setPost({
        ...post,
        likedByMe: data.liked,
        _count: {
          ...post._count,
          likes: post._count.likes + (data.liked ? 1 : -1),
        },
      });
    }
  }

  async function toggleSave() {
    const token = getAccessToken();

    if (!token || !post) {
      return;
    }

    const response = await apiFetch(`/posts/${post.id}/save`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      setPost({
        ...post,
        savedByMe: data.saved,
      });
    }
  }

  async function addComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const token = getAccessToken();

    if (!token || !post || !commentText.trim()) {
      return;
    }

    const response = await apiFetch(`/posts/${post.id}/comments`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body: commentText }),
    });

    if (response.ok) {
      setCommentText("");
      loadPost(token);
    }
  }

  async function addReply(commentId: string) {
    const token = getAccessToken();
    const body = replyText[commentId]?.trim();

    if (!token || !body) {
      return;
    }

    const response = await apiFetch(`/posts/comments/${commentId}/replies`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({ body }),
    });

    if (response.ok) {
      setReplyText((current) => ({ ...current, [commentId]: "" }));
      loadPost(token);
    }
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <AppNav user={me} />

        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="rounded-md border border-[#2DD4BF]/40 px-4 py-2 text-sm text-[#7DEADF]"
            href={getFallbackHref()}
          >
            {from === "profile"
              ? "Go to profile"
              : from === "saved"
                ? "Go to saved"
                : "Go to feed"}
          </Link>
        </div>

        {error ? (
          <p className="rounded-md border border-[#F87171]/30 bg-[#F87171]/10 p-4 text-[#FDA4A4]">
            {error}
          </p>
        ) : null}

        {post ? (
          <article className="rounded-md border border-[#2DD4BF]/15 bg-[#162B27]/80 p-5">
            <div className="flex items-center justify-between">
              <Link href={`/profile/${post.author.username}`}>
                <p className="font-semibold">{post.author.name}</p>
                <p className="text-sm text-[#94A3B8]/90">@{post.author.username}</p>
              </Link>
              <p className="text-xs text-[#94A3B8]/75">
                {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </div>

            <p className="mt-4 whitespace-pre-wrap text-[#F8FAFC]/90">{post.caption}</p>

            {post.imageUrl ? (
              <Image
                className="mt-4 max-h-[620px] w-full rounded-md object-cover"
                src={post.imageUrl}
                alt=""
                width={1200}
                height={900}
              />
            ) : null}

            <div className="mt-4 flex items-center gap-3 text-sm">
              <button
                onClick={toggleLike}
                className={`rounded-md px-4 py-2 font-medium ${
                  post.likedByMe
                    ? "bg-[#2DD4BF] text-neutral-950"
                    : "border border-[#2DD4BF]/25 text-[#DDEDE9]/85"
                }`}
              >
                {post.likedByMe ? "Liked" : "Like"} ({post._count.likes})
              </button>
              {me?.id !== post.author.id ? (
                <button
                  onClick={toggleSave}
                  className={`rounded-md px-4 py-2 font-medium ${
                    post.savedByMe
                      ? "bg-white text-neutral-950"
                      : "border border-[#2DD4BF]/25 text-[#DDEDE9]/85"
                  }`}
                >
                  {post.savedByMe ? "Saved" : "Save"}
                </button>
              ) : null}
              <span className="text-[#94A3B8]/90">{post._count.comments} comments</span>
            </div>

            <form onSubmit={addComment} className="mt-5 flex gap-2">
              <input
                className="h-11 min-w-0 flex-1 rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-3 outline-none focus:border-[#2DD4BF]"
                placeholder="Write a comment..."
                value={commentText}
                onChange={(event) => setCommentText(event.target.value)}
              />
              <button className="h-11 rounded-md bg-white px-4 font-medium text-neutral-950">
                Send
              </button>
            </form>

            <section className="mt-6 flex flex-col gap-4">
              {post.comments.slice(0, visibleCommentCount).map((comment) => (
                <div key={comment.id} className="rounded-md bg-[#10201D] p-4">
                  <p className="text-sm font-semibold">
                    @{comment.author.username}
                  </p>
                  <p className="mt-1 text-[#DDEDE9]">{comment.body}</p>

                  {comment.replies.length > 0 ? (
                    <div className="mt-4 ml-5 flex flex-col gap-3 border-l border-[#2DD4BF]/15 pl-4">
                      {comment.replies.map((reply) => (
                        <div key={reply.id}>
                          <p className="text-sm font-semibold text-[#DDEDE9]">
                            @{reply.author.username}
                          </p>
                          <p className="text-sm text-[#B8C7C2]">{reply.body}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 flex gap-2">
                    <input
                      className="h-10 min-w-0 flex-1 rounded-md border border-[#2DD4BF]/25 bg-[#071311] px-3 text-sm outline-none focus:border-[#2DD4BF]"
                      placeholder="Reply..."
                      value={replyText[comment.id] || ""}
                      onChange={(event) =>
                        setReplyText((current) => ({
                          ...current,
                          [comment.id]: event.target.value,
                        }))
                      }
                    />
                    <button
                      onClick={() => addReply(comment.id)}
                      className="h-10 rounded-md border border-[#2DD4BF]/25 px-3 text-sm text-[#DDEDE9]"
                    >
                      Reply
                    </button>
                  </div>
                </div>
              ))}
              {post.comments.length > visibleCommentCount ? (
                <button
                  onClick={() =>
                    setVisibleCommentCount((currentCount) => currentCount + 4)
                  }
                  className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 text-sm font-medium text-[#DDEDE9] hover:bg-[#162B27]/80"
                >
                  See more comments
                </button>
              ) : null}
            </section>
          </article>
        ) : (
          <p className="text-[#94A3B8]">Loading post...</p>
        )}
      </section>
    </main>
  );
}
