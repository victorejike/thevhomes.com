"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  CalendarCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  User,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { ThemeToggle } from "./theme-toggle";
import { MotionLink } from "./motion-link";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "My Viewings", icon: CalendarCheck },
  { href: "/dashboard/saved", label: "Saved Properties", icon: Heart },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/properties", label: "My Listings", icon: Building2, agentOnly: true },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen bg-charcoal-950">
      <aside className="relative hidden w-64 shrink-0 border-r border-white/10 bg-charcoal-900/40 lg:block">
        <div className="p-6">
          <MotionLink
            href="/"
            whileHover={{ scale: 1.03 }}
            className="font-display text-xl font-semibold text-white"
          >
            THE<span className="text-teal-400">V</span>HOMES
          </MotionLink>
        </div>
        <nav className="space-y-1 px-3">
          {LINKS.filter((l) => !l.agentOnly || user?.role === "agent" || user?.role === "admin").map(
            (link) => {
              const active = pathname === link.href;
              return (
                <MotionLink
                  key={link.href}
                  href={link.href}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.97 }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-teal-gradient text-charcoal-950"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <link.icon size={17} />
                  {link.label}
                </MotionLink>
              );
            }
          )}
        </nav>
        <div className="absolute bottom-6 w-64 px-6">
          <motion.button
            onClick={() => {
              logout();
              router.push("/");
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-red-400"
          >
            <LogOut size={16} /> Sign Out
          </motion.button>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-6">
          <p className="text-sm text-white/50 capitalize">{user?.role ?? "Guest"} Dashboard</p>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-sm text-white">
              <User size={16} /> {user?.name ?? "Guest"}
            </div>
          </div>
        </header>
        <main className="p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
