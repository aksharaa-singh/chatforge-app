"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not reset your password.");
        return;
      }

      setMessage(data.message || "Password reset successfully.");
      setTimeout(() => {
        router.push("/signin");
      }, 1000);
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
            Choose a new password
          </h1>
          <p className="mt-2 text-sm leading-6 text-neutral-400">
            Enter a new password for your account.
          </p>
        </div>

        {!token ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            This reset link is missing a token. Please request a new reset link.
          </div>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                New password
              </span>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                className="h-11 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
                placeholder="At least 8 characters"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                Confirm new password
              </span>
              <input
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                type="password"
                autoComplete="new-password"
                className="h-11 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
                placeholder="Enter the same password again"
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

            <button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-lg bg-white text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Resetting password..." : "Reset password"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
