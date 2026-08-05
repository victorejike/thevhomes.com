"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { MotionLink, tapScale } from "@/components/motion-link";
import { AnimatedLogo } from "@/components/animated-logo";

const NAV = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/verifications", label: "Identity Verification" },
  { href: "/admin/agents", label: "Agent Approval" },
  { href: "/admin/properties", label: "Property Review" },
  { href: "/admin/bookings", label: "Viewing Management" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/content", label: "Site Content" },
  { href: "/admin/ai", label: "AI Insights" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
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
        <MotionLink href="/" whileHover={{ scale: 1.03 }} aria-label="TheVHomes home" className="flex items-center gap-2">
          <AnimatedLogo size="sm" />
          <span className="text-sm text-white/40">Admin</span>
        </MotionLink>
        <nav className="mt-4 flex flex-wrap gap-2">
          {NAV.map((item) => (
            <MotionLink
              key={item.href}
              href={item.href}
              whileHover={{ y: -1 }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                pathname === item.href
                  ? "bg-teal-gradient text-charcoal-950"
                  : "text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
            </MotionLink>
          ))}
        </nav>
      </header>
      <main className="p-6 lg:p-10">{children}</main>
    </div>
  );
}
