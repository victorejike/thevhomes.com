"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { MotionLink, tapScale } from "@/components/motion-link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;

  if (!user || user.role !== "admin") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-charcoal-950 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-white">Admin Access Only</h1>
        <p className="max-w-sm text-white/60">
          You need an administrator account to view this page.
        </p>
        <MotionLink
          href="/login"
          {...tapScale}
          className="rounded-full bg-teal-gradient px-6 py-3 text-sm font-semibold text-charcoal-950"
        >
          Sign In
        </MotionLink>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-charcoal-950">
      <header className="border-b border-white/10 px-6 py-5 lg:px-10">
        <MotionLink
          href="/"
          whileHover={{ scale: 1.03 }}
          className="font-display text-xl font-semibold text-white"
        >
          THE<span className="text-teal-400">V</span>HOMES <span className="text-sm text-white/40">Admin</span>
        </MotionLink>
      </header>
      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
