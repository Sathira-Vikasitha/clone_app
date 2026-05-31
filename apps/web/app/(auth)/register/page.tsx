"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { setAccessToken } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const response = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(form),
    });
    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Register failed");
      return;
    }

    setAccessToken(data.accessToken);
    router.push(`/profile/${data.user.username}`);
  }

  return (
    <main className="min-h-screen bg-[#071311] px-6 py-10 text-white">
      <section className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-[#2DD4BF]">
            Social app
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Create your account</h1>
        </div>

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <input
            className="h-12 rounded-md border border-[#2DD4BF]/25 bg-[#162B27]/80 px-4 outline-none focus:border-[#2DD4BF]"
            placeholder="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            className="h-12 rounded-md border border-[#2DD4BF]/25 bg-[#162B27]/80 px-4 outline-none focus:border-[#2DD4BF]"
            placeholder="Username"
            value={form.username}
            onChange={(event) =>
              setForm({ ...form, username: event.target.value })
            }
          />
          <input
            className="h-12 rounded-md border border-[#2DD4BF]/25 bg-[#162B27]/80 px-4 outline-none focus:border-[#2DD4BF]"
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm({ ...form, email: event.target.value })
            }
          />
          <input
            className="h-12 rounded-md border border-[#2DD4BF]/25 bg-[#162B27]/80 px-4 outline-none focus:border-[#2DD4BF]"
            placeholder="Password"
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm({ ...form, password: event.target.value })
            }
          />
          {error ? <p className="text-sm text-[#F87171]">{error}</p> : null}
          <button className="h-12 rounded-md bg-[#2DD4BF] font-semibold text-neutral-950">
            Register
          </button>
        </form>

        <p className="text-sm text-[#B8C7C2]">
          Already have an account?{" "}
          <Link className="text-[#2DD4BF]" href="/login">
            Login
          </Link>
        </p>
      </section>
    </main>
  );
}
