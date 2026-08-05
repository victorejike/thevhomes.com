"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";
import { useCookieConsentStore } from "@/lib/cookie-consent";
import { MotionLink, tapScale } from "./motion-link";

/**
 * Site-wide cookie consent banner. Shown once on first visit (persisted via
 * the cookie-consent store) and never again once the visitor has made a
 * choice. "Manage Preferences" opens the full toggle modal; the same modal
 * can be reopened later from the footer's "Cookie Preferences" link.
 */
export function CookieConsentBanner() {
  const { hasResponded, acceptAll, rejectNonEssential, openPreferencesModal } = useCookieConsentStore();
  const [mounted, setMounted] = useState(false);

  // Avoid a hydration flash: only decide whether to show the banner once
  // the persisted store has rehydrated on the client.
  useEffect(() => setMounted(true), []);

  if (!mounted || hasResponded) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        role="dialog"
        aria-label="Cookie consent"
        className="fixed inset-x-0 bottom-0 z-[100] border-t border-white/10 bg-charcoal-950/95 p-4 backdrop-blur-xl sm:p-6"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-400/10 text-teal-300">
              <Cookie size={18} />
            </span>
            <div>
              <p className="font-display text-sm font-semibold text-white sm:text-base">
                We value your privacy
              </p>
              <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-white/60 sm:text-sm">
                TheVHomes uses cookies to improve your browsing experience, remember your
                preferences, keep you signed in, save your language and theme settings, improve
                property recommendations, measure site performance, and improve search. You can
                accept all cookies, reject non-essential ones, or manage your preferences at any
                time — see our{" "}
                <MotionLink href="/legal/cookie-policy" className="text-teal-300 underline hover:text-teal-200">
                  Cookie Policy
                </MotionLink>
                .
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 lg:shrink-0">
            <motion.button
              onClick={openPreferencesModal}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-teal-400/40 sm:text-sm"
            >
              Manage Preferences
            </motion.button>
            <motion.button
              onClick={rejectNonEssential}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full border border-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:border-teal-400/40 sm:text-sm"
            >
              Reject Non-Essential
            </motion.button>
            <motion.button
              onClick={acceptAll}
              {...tapScale}
              className="rounded-full bg-teal-gradient px-5 py-2.5 text-xs font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110 sm:text-sm"
            >
              Accept All
            </motion.button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
