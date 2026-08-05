"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import {
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CalendarCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  User,
  X,
} from "lucide-react";
import { useAuthStore } from "@/lib/store";
import { MotionLink } from "./motion-link";
import { NotificationBell } from "./notification-bell";
import { AnimatedLogo } from "./animated-logo";

const LINKS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/bookings", label: "My Viewings", icon: CalendarCheck },
  { href: "/dashboard/saved", label: "Saved Properties", icon: Heart },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/verify", label: "Identity Verification", icon: BadgeCheck },
  { href: "/dashboard/agent-application", label: "Agent Approval", icon: Award, agentOnly: true },
  { href: "/dashboard/properties", label: "My Listings", icon: Building2, agentOnly: true },
  { href: "/dashboard/knowledge-center", label: "Knowledge Center", icon: BookOpen, agentOnly: true },
];

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  const visibleLinks = LINKS.filter(
    (l) => !l.agentOnly || user?.role === "agent" || user?.role === "admin"
  );

  function handleSignOut() {
    logout();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen bg-charcoal-950">
      <aside className="relative hidden w-64 shrink-0 border-r border-white/10 bg-charcoal-900/40 md:block">
        <div className="p-6">
          <MotionLink href="/" whileHover={{ scale: 1.03 }} aria-label="TheVHomes home">
            <AnimatedLogo size="sm" />
          </MotionLink>
        </div>
        <nav className="space-y-1 px-3">
          {visibleLinks.map((link) => {
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
          })}
        </nav>
        <div className="absolute bottom-6 w-64 px-6">
          <motion.button
            onClick={handleSignOut}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 text-sm text-white/50 hover:text-red-400"
          >
            <LogOut size={16} /> Sign Out
          </motion.button>
        </div>
      </aside>

      {/* Mobile slide-in navigation drawer */}
      <AnimatePresence>
        {mobileNavOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileNavOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 md:hidden"
              aria-hidden="true"
            />
            <motion.aside
              key="drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-white/10 bg-charcoal-950 md:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Dashboard navigation"
            >
              <div className="flex items-center justify-between p-6">
                <MotionLink href="/" whileHover={{ scale: 1.03 }} aria-label="TheVHomes home">
                  <AnimatedLogo size="sm" />
                </MotionLink>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                  className="text-white/70 hover:text-white"
                >
                  <X size={20} />
                </motion.button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto px-3">
                {visibleLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <MotionLink
                      key={link.href}
                      href={link.href}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                        active
                          ? "bg-teal-gradient text-charcoal-950"
                          : "text-white/70 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <link.icon size={17} />
                      {link.label}
                    </MotionLink>
                  );
                })}
              </nav>
              <div className="p-6">
                <motion.button
                  onClick={handleSignOut}
                  whileTap={{ scale: 0.96 }}
                  className="flex items-center gap-2 text-sm text-white/50 hover:text-red-400"
                >
                  <LogOut size={16} /> Sign Out
                </motion.button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-between border-b border-white/10 px-4 md:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open dashboard menu"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/80 md:hidden"
            >
              <Menu size={17} />
            </motion.button>
            <p className="truncate text-sm text-white/50 capitalize">
              {user?.role ?? "Guest"} Dashboard
            </p>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <NotificationBell />
            <div className="hidden items-center gap-2 text-sm text-white sm:flex">
              <User size={16} /> {user?.name ?? "Guest"}
            </div>
          </div>
        </header>
        <main className="p-4 md:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}
