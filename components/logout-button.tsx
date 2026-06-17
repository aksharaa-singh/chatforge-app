"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/signin" })}
      className="h-10 rounded-lg border border-white/10 px-4 text-sm font-medium text-neutral-200 transition hover:bg-white/10"
    >
      Logout
    </button>
  );
}