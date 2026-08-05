"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { SearchBar } from "./search-bar";

/** A friendly, time-of-day-aware greeting used as the search input's
 * placeholder — it reads like a welcome message and, being a native
 * placeholder, disappears the instant the visitor starts typing. */
function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  if (hour < 5) return "Still up? Find your dream home...";
  if (hour < 12) return "Good morning! Find your dream home...";
  if (hour < 17) return "Good afternoon! Find your dream home...";
  if (hour < 21) return "Good evening! Find your dream home...";
  return "Good night! Find your dream home...";
}

/**
 * Mobile-only hero search affordance: a single floating "Search" pill that
 * expands into the full existing <SearchBar /> panel with a smooth
 * height/opacity animation, then collapses back down. This preserves
 * maximum vertical space for the hero video/animation on small screens.
 * Desktop/tablet keep the always-expanded <SearchBar /> unchanged (rendered
 * separately by the parent, hidden on mobile).
 */
export function MobileSearchToggle() {
  const [open, setOpen] = useState(false);
  const [greeting] = useState(getTimeBasedGreeting);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        aria-expanded={open}
        aria-controls="mobile-hero-search-panel"
        className="mx-auto flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white shadow-2xl backdrop-blur-xl transition hover:border-teal-300/50"
      >
        {open ? <X size={16} /> : <Search size={16} />}
        {open ? "Close Search" : "Search"}
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id="mobile-hero-search-panel"
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-3">
              <SearchBar placeholderOverride={greeting} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
