"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Login failed");
      return;
    }

    setAccessToken(data.accessToken);
    router.push(data.user.role === "admin" ? "/admin" : `/profile/${data.user.username}`);
  }

  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-300">
            Welcome back
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Login to continue</h1>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            className="h-12 rounded-md border border-white/15 bg-white/10 px-4 outline-none focus:border-teal-300"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
          />
          <input
            className="h-12 rounded-md border border-white/15 bg-white/10 px-4 outline-none focus:border-teal-300"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button className="h-12 rounded-md bg-teal-300 font-semibold text-neutral-950">
            Login
          </button>
        </form>

        <p className="text-sm text-white/70">
          New here?{" "}
          <Link className="text-teal-300" href="/register">
            Create account
          </Link>
        </p>
      </section>
    </main>
  );
}
