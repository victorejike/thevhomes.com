"use client";

import { motion } from "framer-motion";
import { Globe } from "lucide-react";
import { useState } from "react";
import { useLocaleStore, type Locale } from "@/lib/store";

const LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useLocaleStore();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        className="flex h-9 items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 text-xs font-medium uppercase tracking-wide text-white transition hover:border-teal-400/50 hover:text-teal-300"
      >
        <Globe size={14} />
        {locale}
      </motion.button>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-11 z-50 w-36 overflow-hidden rounded-xl border border-white/10 bg-charcoal-900/95 backdrop-blur-xl shadow-glow"
          onMouseLeave={() => setOpen(false)}
        >
          {LOCALES.map((l) => (
            <motion.button
              key={l.code}
              onClick={() => {
                setLocale(l.code);
                setOpen(false);
              }}
              whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.05)" }}
              whileTap={{ scale: 0.97 }}
              className={`block w-full px-4 py-2.5 text-left text-sm transition ${
                locale === l.code ? "text-teal-300" : "text-white/80"
              }`}
            >
              {l.label}
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
