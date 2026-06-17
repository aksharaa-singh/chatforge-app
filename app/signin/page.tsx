"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SigninPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/chat";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleCredentialsSignin(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setIsLoading(false);

    if (result?.error) {
      if (result.error === "EMAIL_NOT_VERIFIED") {
        setError("Please verify your email before signing in.");
        return;
      }

      setError("Invalid email or password.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  async function handleGoogleSignin() {
    await signIn("google", { callbackUrl });
  }

  return (
    <main className="flex min-h-screen bg-neutral-950 text-white">
      <section className="hidden flex-1 flex-col justify-between border-r border-white/10 bg-neutral-900 px-12 py-10 lg:flex">
        <div>
          <div className="mb-16 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-semibold text-neutral-950">
            CF
          </div>
          <h1 className="max-w-xl text-5xl font-semibold tracking-tight">
            A calmer way to build with AI.
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-8 text-neutral-300">
            Sign in to continue your conversations, manage chat history, and
            switch between OpenAI, Claude, and DeepSeek.
          </p>
        </div>

        <p className="text-sm text-neutral-500">
          Built with Next.js, Prisma, PostgreSQL, and NextAuth.
        </p>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-lg font-semibold text-neutral-950">
              CF
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Welcome back
            </h1>
          </div>

          <div className="mb-8 hidden lg:block">
            <h2 className="text-3xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-2 text-sm text-neutral-400">
              Use your account to continue.
            </p>
          </div>

          <button
            type="button"
            suppressHydrationWarning
            onClick={handleGoogleSignin}
            className="flex h-11 w-full items-center justify-center rounded-lg border border-white/10 bg-white text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              or
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleCredentialsSignin} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-neutral-300">
                Email
              </span>
              <input
                suppressHydrationWarning
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
                suppressHydrationWarning
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                className="h-11 w-full rounded-lg border border-white/10 bg-neutral-900 px-3 text-sm text-white outline-none transition placeholder:text-neutral-600 focus:border-white/30"
                placeholder="Enter your password"
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <Link
                href="/forgot-password"
                className="text-sm text-neutral-400 transition hover:text-white"
              >
                Forgot password?
              </Link>
              <Link
                href="/resend-verification"
                className="text-sm text-neutral-400 transition hover:text-white"
              >
                Verify email
              </Link>
            </div>

            {error ? (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              suppressHydrationWarning
              disabled={isLoading}
              className="h-11 w-full rounded-lg bg-white text-sm font-medium text-neutral-950 transition hover:bg-neutral-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-neutral-400">
            New here?{" "}
            <Link href="/signup" className="font-medium text-white">
              Create an account
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
