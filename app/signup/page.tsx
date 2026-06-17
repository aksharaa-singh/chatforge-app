"use client";

import Link from "next/link";
import { useState } from "react";

export default function SignupPage() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [verificationUrl, setVerificationUrl] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setVerificationUrl("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Could not create your account.");
        return;
      }
      setMessage(data.message || "Account created. Please verify your email.");
      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen bg-neutral-950 text-white">
      <section className="hidden flex-1 flex-col justify-between border-r border-white/10 bg-neutral-900 px-12 py-10 lg:flex">
        <div>
          <div className="mb-16 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-semibold text-neutral-950">
            CF
          </div>
          <h1 className="max-w-xl text-5xl font-semibold tracking-tight">
            Start building your AI workspace.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-neutral-300">
            Create an account to save conversations, revisit chat history, and
            choose the model provider that fits the task.
          </p>
        </div>

        <p className="text-sm text-neutral-500">
          Secure auth, private chats, and provider switching from day one.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-semibold text-neutral-950">
              CF
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Create account
            </h1>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-semibold tracking-tight">
              Create account
            </h2>
            <p className="mt-2 text-sm text-neutral-400">
              Sign up with email and password.
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                Name
              </span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                type="text"
                autoComplete="name"
                className="h-11 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
                placeholder="Akshay"
              />
            </label>

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

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                Password
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
                Confirm password
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

            {verificationUrl ? (
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Development verification link
                  </p>
                  <Link
                  href={verificationUrl}
                  className="break-all text-sm text-neutral-200 underline decoration-white/30 underline-offset-4 hover:text-white"
                  >
                    {verificationUrl}
                    </Link>
                    </div>
                  ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full rounded-lg bg-white text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-400">
            Already have an account?{" "}
            <Link href="/signin" className="font-medium text-white">
              Sign in
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
