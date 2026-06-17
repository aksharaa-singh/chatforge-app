"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const token = searchParams.get("token") || "";
  const hasVerifiedRef = useRef(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    async function verifyEmail() {
  if (hasVerifiedRef.current) {
    return;
  }

  hasVerifiedRef.current = true;

  if (!email || !token) {
        setError("This ChatForge verification link is missing information.");
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, token }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || "Could not verify your email.");
          return;
        }

        setMessage(data.message || "Your email has been verified.");
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setIsVerifying(false);
      }
    }

    verifyEmail();
  }, [email, token]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-6 py-10 text-white">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white text-lg font-semibold text-neutral-950">
          CF
        </div>

        <h1 className="text-3xl font-semibold tracking-tight">
          Verify your email
        </h1>

        <p className="mt-3 text-sm leading-6 text-neutral-400">
          We are confirming that this email belongs to you.
        </p>

        <div className="mt-8">
          {isVerifying ? (
            <div className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-neutral-300">
              Verifying your email...
            </div>
          ) : null}

          {message ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </div>

        <div className="mt-6">
          <Link
            href="/signin"
            className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-neutral-950 transition hover:bg-neutral-200"
          >
            Go to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}