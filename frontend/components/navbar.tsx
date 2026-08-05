"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./language-switcher";
import { MotionLink, tapScale, tapScaleSmall } from "./motion-link";
import { AnimatedLogo } from "./animated-logo";
import { useLocaleStore } from "@/lib/store";
import { t } from "@/lib/i18n";

const LINKS = [
  { href: "/properties?purpose=buy", key: "nav_buy" as const },
  { href: "/properties?purpose=rent", key: "nav_rent" as const },
  { href: "/properties?purpose=shortlet", key: "nav_shortlet" as const },
  { href: "/investments", key: "nav_invest" as const },
  { href: "/agents", key: "nav_agents" as const },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale } = useLocaleStore();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-white/10 bg-charcoal-950/80 backdrop-blur-xl"
          : "bg-gradient-to-b from-black/60 to-transparent"
      }`}
    >
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 lg:px-8">
        <MotionLink
          href="/"
          whileHover={{ scale: 1.03 }}
          aria-label="TheVHomes home"
          className="flex items-center gap-2"
        >
          <AnimatedLogo size="md" />
        </MotionLink>

        <div className="hidden items-center gap-6 md:flex">
          {LINKS.map((link) => (
            <MotionLink
              key={link.href}
              href={link.href}
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className="text-sm font-medium text-white/80 transition hover:text-teal-300"
            >
              {t(locale, link.key)}
            </MotionLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <LanguageSwitcher />
          <MotionLink
            href="/login"
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            className="text-sm font-medium text-white/80 transition hover:text-teal-300"
          >
            Sign In
          </MotionLink>
          <MotionLink
            href="/register"
            {...tapScale}
            className="rounded-full bg-teal-gradient px-5 py-2 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
          >
            Get Started
          </MotionLink>
        </div>

        <motion.button
          {...tapScaleSmall}
          className="text-white md:hidden"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X /> : <Menu />}
        </motion.button>
      </nav>

      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-white/10 bg-charcoal-950/95 px-4 py-5 backdrop-blur-xl md:hidden"
        >
          <div className="flex flex-col gap-4">
            {LINKS.map((link) => (
              <MotionLink
                key={link.href}
                href={link.href}
                whileTap={{ scale: 0.96 }}
                onClick={() => setMobileOpen(false)}
                className="text-base font-medium text-white/90"
              >
                {t(locale, link.key)}
              </MotionLink>
            ))}
            <div className="mt-2 flex items-center gap-3">
              <LanguageSwitcher />
            </div>
            <MotionLink
              href="/login"
              whileTap={{ scale: 0.96 }}
              onClick={() => setMobileOpen(false)}
              className="mt-2 rounded-full border border-white/20 px-5 py-2.5 text-center text-sm font-medium text-white"
            >
              Sign In
            </MotionLink>
            <MotionLink
              href="/register"
              {...tapScale}
              onClick={() => setMobileOpen(false)}
              className="rounded-full bg-teal-gradient px-5 py-2.5 text-center text-sm font-semibold text-charcoal-950"
            >
              Get Started
            </MotionLink>
          </div>
        </motion.div>
      )}
    </header>
  );
}
