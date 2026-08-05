"use client";

import { motion } from "framer-motion";
import { useCookieConsentStore } from "@/lib/cookie-consent";

/**
 * A button styled like an inline link that reopens the cookie preferences
 * modal — used both on the Cookie Policy page and in the footer, so
 * visitors can change their cookie choices at any time after their first
 * visit (not just from the initial banner).
 */
export function CookiePreferencesLink({ className }: { className?: string }) {
  const openPreferencesModal = useCookieConsentStore((s) => s.openPreferencesModal);

  return (
    <motion.button
      type="button"
      onClick={openPreferencesModal}
      whileHover={{ x: 4 }}
      className={
        className ??
        "mt-4 inline-block rounded-full bg-teal-gradient px-6 py-2.5 text-sm font-semibold text-charcoal-950 transition hover:brightness-110"
      }
    >
      Manage Cookie Preferences
    </motion.button>
  );
}
