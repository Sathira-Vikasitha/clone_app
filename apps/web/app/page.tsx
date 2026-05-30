"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

    loadFeed(token);
  }, [router]);

  function logout() {
    clearAccessToken();
    router.push("/login");
  }

  async function loadFeed(token = getAccessToken()) {
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
  }

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
    <main className="min-h-screen bg-neutral-950 px-6 py-8 text-white">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-8">
        <nav className="flex items-center justify-between">
          <Link className="text-xl font-semibold" href="/">
            InstaClone
          </Link>
          <div className="flex items-center gap-3">
            <Link
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
              href="/notifications"
            >
              Notifications
            </Link>
            <Link
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
              href="/messages"
            >
              Messages
            </Link>
            {user ? (
              <Link
                className="rounded-md border border-teal-300/50 px-4 py-2 text-sm text-teal-200"
                href={`/profile/${user.username}`}
              >
                Profile
              </Link>
            ) : null}
            <button
              onClick={logout}
              className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/80"
            >
              Logout
            </button>
          </div>
        </nav>

        <div className="rounded-md border border-white/10 bg-white/10 p-6">
          <p className="text-sm uppercase tracking-[0.2em] text-teal-300">
            Week 2
          </p>
          <h1 className="mt-3 text-4xl font-semibold">
            {user ? `Hello, ${user.name}` : "Checking your login..."}
          </h1>
          {user ? (
            <div className="mt-6 grid gap-3 text-white/75">
              <p>Username: @{user.username}</p>
              <p>Email: {user.email}</p>
              <p>User ID: {user.id}</p>
            </div>
          ) : null}
        </div>

        <form
          onSubmit={createPost}
          className="rounded-md border border-white/10 bg-white/10 p-6"
        >
          <h2 className="text-2xl font-semibold">Create post</h2>
          <textarea
            className="mt-4 min-h-28 w-full resize-none rounded-md border border-white/15 bg-neutral-900 px-4 py-3 outline-none focus:border-teal-300"
            placeholder="Write a caption..."
            value={caption}
            onChange={(event) => setCaption(event.target.value)}
          />
          <input
            className="mt-4 h-12 w-full rounded-md border border-white/15 bg-neutral-900 px-4 outline-none focus:border-teal-300"
            placeholder="Optional image URL"
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
          />
          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="min-w-0 flex-1 rounded-md border border-white/15 bg-neutral-900 px-4 py-3 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-2 file:font-medium file:text-neutral-950"
              type="file"
              accept="image/*"
              onChange={(event) =>
                setSelectedImage(event.target.files?.[0] || null)
              }
            />
            <button
              type="button"
              onClick={uploadSelectedImage}
              className="rounded-md border border-teal-300/60 px-4 py-2 text-sm font-semibold text-teal-200"
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload image"}
            </button>
          </div>
          {imageUrl ? (
            <img
              className="mt-4 max-h-80 w-full rounded-md object-cover"
              src={imageUrl}
              alt=""
            />
          ) : null}
          {error ? <p className="mt-3 text-sm text-red-300">{error}</p> : null}
          <button className="mt-4 h-12 rounded-md bg-teal-300 px-5 font-semibold text-neutral-950">
            Share post
          </button>
        </form>

        <section className="flex flex-col gap-5">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-md border border-white/10 bg-white/10 p-5"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Link
                    className="font-semibold hover:text-teal-200"
                    href={`/profile/${post.author.username}`}
                  >
                    {post.author.name}
                  </Link>
                  <Link
                    className="block text-sm text-white/55 hover:text-teal-200"
                    href={`/profile/${post.author.username}`}
                  >
                    @{post.author.username}
                  </Link>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-xs text-white/45">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                  {user?.id === post.author.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEditing(post)}
                        className="rounded-md border border-white/15 px-3 py-1 text-xs font-medium text-white/75 hover:bg-white/10"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        className="rounded-md border border-red-300/40 px-3 py-1 text-xs font-medium text-red-200 hover:bg-red-300/10"
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
                    className="min-h-24 w-full resize-none rounded-md border border-white/15 bg-neutral-900 px-4 py-3 outline-none focus:border-teal-300"
                    value={editCaption}
                    onChange={(event) => setEditCaption(event.target.value)}
                  />
                  <input
                    className="h-11 rounded-md border border-white/15 bg-neutral-900 px-3 outline-none focus:border-teal-300"
                    placeholder="Optional image URL"
                    value={editImageUrl}
                    onChange={(event) => setEditImageUrl(event.target.value)}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => savePostEdit(post.id)}
                      className="rounded-md bg-teal-300 px-4 py-2 text-sm font-semibold text-neutral-950"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="rounded-md border border-white/15 px-4 py-2 text-sm text-white/75"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="mt-4 whitespace-pre-wrap text-white/90">
                    {post.caption}
                  </p>

                  {post.imageUrl ? (
                    <img
                      className="mt-4 max-h-[520px] w-full rounded-md object-cover"
                      src={post.imageUrl}
                      alt=""
                    />
                  ) : null}
                </>
              )}

              <div className="mt-4 flex items-center gap-3 text-sm">
                <button
                  onClick={() => toggleLike(post.id)}
                  className={`rounded-md px-4 py-2 font-medium ${
                    post.likedByMe
                      ? "bg-teal-300 text-neutral-950"
                      : "border border-white/15 text-white/75"
                  }`}
                >
                  {post.likedByMe ? "Liked" : "Like"} ({post._count.likes})
                </button>
                <span className="text-white/55">
                  {post._count.comments} comments
                </span>
              </div>

              <div className="mt-4 flex flex-col gap-3">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="rounded-md bg-neutral-900 p-3">
                    <p className="text-sm font-semibold">
                      @{comment.author.username}
                    </p>
                    <p className="mt-1 text-sm text-white/75">{comment.body}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <input
                  className="h-11 min-w-0 flex-1 rounded-md border border-white/15 bg-neutral-900 px-3 outline-none focus:border-teal-300"
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
