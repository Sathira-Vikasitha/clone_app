"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppNav } from "@/components/AppNav";
import { apiFetch } from "@/lib/api";
import { clearAccessToken, getAccessToken } from "@/lib/auth";
import type { Post, User } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [error, setError] = useState("");

  const loadFeed = useCallback(async (token = getAccessToken()) => {
    if (!token) {
      return;
    }

    const response = await apiFetch("/posts", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setPosts(await response.json());
    }
  }, []);

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
      .then(setUser)
      .catch(() => {
        clearAccessToken();
        router.push("/login");
      });

    const timeoutId = window.setTimeout(() => {
      loadFeed(token);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [loadFeed, router]);

  async function createPost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch("/posts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        caption,
        imageUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Could not create post");
      return;
    }

    setCaption("");
    setImageUrl("");
    setSelectedImage(null);
    setPosts((currentPosts) => [data, ...currentPosts]);
  }

  async function uploadSelectedImage() {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!selectedImage) {
      setError("Choose an image first");
      return;
    }

    setError("");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("image", selectedImage);

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
      setError(data.message || "Image upload failed");
      return;
    }

    setImageUrl(data.imageUrl);
  }

  async function toggleLike(postId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/posts/${postId}/like`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              likedByMe: data.liked,
              _count: {
                ...post._count,
                likes: post._count.likes + (data.liked ? 1 : -1),
              },
            }
          : post,
      ),
    );
  }

  async function toggleSave(postId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/posts/${postId}/save`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const data = await response.json();

    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId ? { ...post, savedByMe: data.saved } : post,
      ),
    );
  }

  async function addComment(postId: string) {
    const token = getAccessToken();
    const body = commentText[postId]?.trim();

    if (!token) {
      router.push("/login");
      return;
    }

    if (!body) {
      return;
    }

    const response = await apiFetch(`/posts/${postId}/comments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ body }),
    });

    if (!response.ok) {
      return;
    }

    const newComment = await response.json();
    setCommentText((current) => ({ ...current, [postId]: "" }));
    setPosts((currentPosts) =>
      currentPosts.map((post) =>
        post.id === postId
          ? {
              ...post,
              comments: [...post.comments, newComment],
              _count: {
                ...post._count,
                comments: post._count.comments + 1,
              },
            }
          : post,
      ),
    );
  }

  async function deletePost(postId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const confirmed = window.confirm("Delete this post?");

    if (!confirmed) {
      return;
    }

    const response = await apiFetch(`/posts/${postId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      setPosts((currentPosts) =>
        currentPosts.filter((post) => post.id !== postId),
      );
    }
  }

  function startEditing(post: Post) {
    setEditingPostId(post.id);
    setEditCaption(post.caption);
    setEditImageUrl(post.imageUrl || "");
  }

  function cancelEditing() {
    setEditingPostId(null);
    setEditCaption("");
    setEditImageUrl("");
  }

  async function savePostEdit(postId: string) {
    const token = getAccessToken();

    if (!token) {
      router.push("/login");
      return;
    }

    const response = await apiFetch(`/posts/${postId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        caption: editCaption,
        imageUrl: editImageUrl,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Could not update post");
      return;
    }

    setPosts((currentPosts) =>
      currentPosts.map((post) => (post.id === postId ? data : post)),
    );
    cancelEditing();
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <AppNav user={user} showLogout />

        <div className="overflow-hidden rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-7 shadow-2xl shadow-black/20">
          <p className="text-sm uppercase tracking-[0.24em] text-[#F4C95D]">
            Pixora Feed
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            {user ? `Welcome back, ${user.name}` : "Checking your login..."}
          </h1>
          {user ? (
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#DDEDE9]/85">
              <p className="rounded-full border border-[#2DD4BF]/20 bg-[#071311]/35 px-4 py-2">
                @{user.username}
              </p>
              <p className="rounded-full border border-[#2DD4BF]/20 bg-[#071311]/35 px-4 py-2">
                {user.email}
              </p>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={createPost}
          className="rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-6 shadow-xl shadow-black/10"
        >
          <h2 className="text-2xl font-black">Create post</h2>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Share a thought, a photo, or a moment with your Pixora circle.
          </p>
          <textarea
            className="mt-4 min-h-28 w-full resize-none rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 py-3 outline-none focus:border-[#2DD4BF]"
            placeholder="Write a caption..."
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
          <input
            className="mt-4 h-12 w-full rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 outline-none focus:border-[#2DD4BF]"
            placeholder="Optional image URL"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-neutral-950"
              type="file"
              accept="image/*"
              onChange={(event) =>
                setSelectedImage(event.target.files?.[0] || null)
              }
            />
            <button
              type="button"
              onClick={uploadSelectedImage}
              className="rounded-md border border-[#2DD4BF]/60 px-4 py-2 text-sm font-semibold text-[#7DEADF]"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload image"}
            </button>
          </div>
          {imageUrl ? (
            <Image
              className="mt-4 max-h-80 w-full rounded-md object-cover"
              src={imageUrl}
              alt=""
              width={1200}
              height={800}
            />
          ) : null}
          {error ? <p className="mt-3 text-sm text-[#F87171]">{error}</p> : null}
          <button className="mt-4 h-12 rounded-md bg-[#2DD4BF] px-5 font-semibold text-neutral-950">
            Share post
          </button>
        </form>

        <section className="flex flex-col gap-5">
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-8 text-center shadow-xl shadow-black/10">
              <p className="text-sm uppercase tracking-[0.2em] text-[#F4C95D]">
                Empty feed
              </p>
              <h2 className="mt-2 text-2xl font-black">No posts yet</h2>
              <p className="mt-2 text-[#94A3B8]">
                Create the first post and start the feed.
              </p>
            </div>
          ) : null}
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-3xl border border-[#2DD4BF]/15 bg-[#162B27]/80 p-5 shadow-xl shadow-black/10 transition hover:border-[#2DD4BF]/30"
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
                <div className="flex items-center gap-3">
                  <p className="text-xs text-[#94A3B8]/75">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  {user?.id === post.author.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(post)}
                        className="rounded-md border border-[#2DD4BF]/25 px-3 py-1 text-xs font-medium text-[#DDEDE9]/85 hover:bg-[#162B27]/80"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="rounded-md border border-[#F87171]/40 px-3 py-1 text-xs font-medium text-[#FDA4A4] hover:bg-[#F87171]/10"
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {editingPostId === post.id ? (
                <div className="mt-4 flex flex-col gap-3">
                  <textarea
                    className="min-h-24 w-full resize-none rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-4 py-3 outline-none focus:border-[#2DD4BF]"
                    value={editCaption}
                    onChange={(event) => setEditCaption(event.target.value)}
                  />
                  <input
                    className="h-11 rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-3 outline-none focus:border-[#2DD4BF]"
                    placeholder="Optional image URL"
                    value={editImageUrl}
                    onChange={(event) => setEditImageUrl(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => savePostEdit(post.id)}
                      className="rounded-md bg-[#2DD4BF] px-4 py-2 text-sm font-semibold text-neutral-950"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 text-sm text-[#DDEDE9]/85"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}

              <div className="mt-4 flex items-center gap-3 text-sm">
                <Link
                  className="rounded-md border border-[#2DD4BF]/25 px-4 py-2 font-medium text-[#DDEDE9]/85"
                  href={`/posts/${post.id}?from=feed`}
                >
                  View post
                </Link>
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`rounded-md px-4 py-2 font-medium ${
                    post.likedByMe
                      ? "bg-[#2DD4BF] text-neutral-950"
                      : "border border-[#2DD4BF]/25 text-[#DDEDE9]/85"
                  }`}
                >
                  {post.likedByMe ? "Liked" : "Like"} ({post._count.likes})
                </button>
                {user?.id !== post.author.id ? (
                  <button
                    onClick={() => toggleSave(post.id)}
                    className={`rounded-md px-4 py-2 font-medium ${
                      post.savedByMe
                        ? "bg-white text-neutral-950"
                        : "border border-[#2DD4BF]/25 text-[#DDEDE9]/85"
                    }`}
                  >
                    {post.savedByMe ? "Saved" : "Save"}
                  </button>
                ) : null}
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
                {post.comments.length > 2 ? (
                  <Link
                    className="text-sm font-medium text-[#7DEADF] hover:text-[#BDF7EF]"
                    href={`/posts/${post.id}?from=feed`}
                  >
                    View all {post._count.comments} comments
                  </Link>
                ) : null}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  className="h-11 min-w-0 flex-1 rounded-md border border-[#2DD4BF]/25 bg-[#10201D] px-3 outline-none focus:border-[#2DD4BF]"
                  placeholder="Write a comment..."
                  value={commentText[post.id] || ""}
                  onChange={(event) =>
                    setCommentText((current) => ({
                      ...current,
                      [post.id]: event.target.value,
                    }))
                  }
                />
                <button
                  onClick={() => addComment(post.id)}
                  className="h-11 rounded-md bg-white px-4 font-medium text-neutral-950"
                >
                  Send
                </button>
              </div>
            </article>
          ))}
        </section>
      </section>
    </main>
  );
}
