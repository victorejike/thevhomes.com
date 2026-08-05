"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ShieldCheck, BarChart3, Megaphone, Sliders } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCookieConsentStore, type CookiePreferences } from "@/lib/cookie-consent";

const CATEGORIES: {
  key: keyof Omit<CookiePreferences, "necessary">;
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    key: "analytics",
    icon: BarChart3,
    title: "Analytics Cookies",
    description:
      "Help us understand how visitors use TheVHomes — pages viewed, search patterns, and performance — so we can measure and improve the site.",
  },
  {
    key: "marketing",
    icon: Megaphone,
    title: "Marketing Cookies",
    description:
      "Used to show you more relevant property listings and offers across TheVHomes and, where applicable, partner channels.",
  },
  {
    key: "preferences",
    icon: Sliders,
    title: "Preference Cookies",
    description:
      "Remember your language, dark/light mode, saved searches, and other settings so TheVHomes feels the same every time you visit.",
  },
];

/**
 * Full cookie preference center. Opened from the consent banner's "Manage
 * Preferences" button, or later at any time from the footer's "Cookie
 * Preferences" link — both simply call openPreferencesModal() on the shared
 * store.
 */
export function CookiePreferencesModal() {
  const { isPreferencesModalOpen, closePreferencesModal, preferences, savePreferences, acceptAll } =
    useCookieConsentStore();
  const [draft, setDraft] = useState(preferences);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isPreferencesModalOpen) {
      setDraft(preferences);
      closeButtonRef.current?.focus();
    }
  }, [isPreferencesModalOpen, preferences]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closePreferencesModal();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [closePreferencesModal]);

  return (
    <AnimatePresence>
      {isPreferencesModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-preferences-title"
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 p-4"
          onClick={closePreferencesModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-charcoal-900 p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 id="cookie-preferences-title" className="font-display text-lg font-semibold text-white">
                Cookie Preferences
              </h2>
              <motion.button
                ref={closeButtonRef}
                onClick={closePreferencesModal}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                aria-label="Close"
                className="text-white/60 hover:text-white"
              >
                <X size={18} />
              </motion.button>
            </div>
            <p className="mt-2 text-sm text-white/60">
              Choose which categories of cookies TheVHomes may use. Necessary cookies are always on
              because the platform can&apos;t function without them.
            </p>

            <div className="mt-6 space-y-4">
              <div className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="flex gap-3">
                  <ShieldCheck size={18} className="mt-0.5 shrink-0 text-teal-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Necessary Cookies</p>
                    <p className="mt-1 text-xs text-white/50">
                      Required for core features like signing in, security, and remembering items
                      in your session. Always enabled.
                    </p>
                  </div>
                </div>
                <Toggle checked disabled onChange={() => {}} label="Necessary cookies (always on)" />
              </div>

              {CATEGORIES.map(({ key, icon: Icon, title, description }) => (
                <div
                  key={key}
                  className="flex items-start justify-between gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex gap-3">
                    <Icon size={18} className="mt-0.5 shrink-0 text-teal-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{title}</p>
                      <p className="mt-1 text-xs text-white/50">{description}</p>
                    </div>
                  </div>
                  <Toggle
                    checked={draft[key]}
                    onChange={(checked) => setDraft((d) => ({ ...d, [key]: checked }))}
                    label={`Toggle ${title}`}
                  />
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <motion.button
                onClick={acceptAll}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-full border border-white/15 py-2.5 text-sm font-semibold text-white transition hover:border-teal-400/40"
              >
                Accept All
              </motion.button>
              <motion.button
                onClick={() => savePreferences(draft)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 rounded-full bg-teal-gradient py-2.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
              >
                Save Preferences
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${
        checked ? "bg-teal-gradient" : "bg-white/15"
      } ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow ${checked ? "left-5" : "left-0.5"}`}
      />
    </button>
  );
}
