"use client";

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [resetUrl, setResetUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setResetUrl("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not prepare reset link.");
        return;
      }

      setMessage(data.message);
      if (data.resetUrl) {
        setResetUrl(data.resetUrl);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-10 text-white">
      <div className="w-full max-w-md">
        <Link
          href="/signin"
          className="mb-8 inline-block text-sm text-neutral-400 transition hover:text-white"
        >
          Back to sign in
        </Link>

        <div className="mb-8">
          <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-semibold text-neutral-950">
            CF
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">
            Reset your password
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Enter your email and we will prepare a reset link for your account.
          </p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm font-medium text-neutral-300">
              Email
            </span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              className="h-11 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
              placeholder="you@example.com"
            />
          </label>

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
              {message}
            </div>
          ) : null}

          {resetUrl ? (
            <div className="rounded-lg border border-white/10 bg-white/5 p-3">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
                Development reset link
              </p>
              <Link
                href={resetUrl}
                className="break-all text-sm text-neutral-200 underline decoration-white/30 underline-offset-4 hover:text-white"
              >
                {resetUrl}
              </Link>
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isLoading}
            className="h-11 w-full rounded-lg bg-white text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? "Preparing link..." : "Send reset link"}
          </button>
        </form>
      </div>
    </main>
  );
}