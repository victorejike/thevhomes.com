"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store";
import { DashboardShell } from "@/components/dashboard-shell";
import { MotionLink, tapScale } from "@/components/motion-link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return null;

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-charcoal-950 px-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-white">
          Sign in to view your dashboard
        </h1>
        <p className="max-w-sm text-white/60">
          Create an account or sign in to manage your saved properties, viewings, and messages.
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

  return <DashboardShell>{children}</DashboardShell>;
}
