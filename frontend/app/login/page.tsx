"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.detail ?? "Invalid credentials");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-2xl font-semibold text-dark-navy">
          Account Heat Map
        </h1>
        <label className="flex flex-col gap-1 text-sm text-gray-text">
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-base text-zinc-900 focus:border-primary-blue focus:outline-none"
            autoFocus
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-gray-text">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded border border-zinc-300 px-3 py-2 text-base text-zinc-900 focus:border-primary-blue focus:outline-none"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-secondary-purple px-4 py-2 font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
