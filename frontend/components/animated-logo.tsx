"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

/**
 * Animated brand mark: types out "THEVHOMES" letter by letter, holds, fades
 * to the TheVHomes roof+V icon, holds, fades back to the typing text, and
 * repeats forever. Falls back to the plain static wordmark (no motion) when
 * the visitor has `prefers-reduced-motion` enabled, so branding is always
 * preserved and nothing ever flickers or auto-plays unnecessarily.
 */

const WORD = "THEVHOMES";
const ACCENT_INDEX = 3; // the "V" in "THE-V-HOMES"
const TYPE_SPEED_MS = 150;
const HOLD_TEXT_MS = 2000;
const FADE_MS = 600;
const HOLD_ICON_MS = 3400;

type Size = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<Size, string> = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-3xl sm:text-4xl",
};

// Icon sits a little larger than the text cap-height so it reads clearly at
// a glance once the wordmark fades out.
const ICON_SIZES: Record<Size, number> = { sm: 26, md: 36, lg: 48 };

// A fixed footprint (in `em`, so it scales with the size variant's own font
// size) reserved for BOTH the typed text and the icon phase. Without this,
// the wordmark growing letter-by-letter — and then swapping to the much
// narrower icon — changes this element's rendered width, which nudges
// everything laid out after it (nav links, buttons) sideways. Reserving a
// constant box up front means only the content inside cross-fades; nothing
// else on the page ever moves.
const RESERVED_WIDTH_EM = 7.2;

export function AnimatedLogo({
  size = "md",
  className = "",
}: {
  size?: Size;
  className?: string;
}) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showText, setShowText] = useState(true);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!mounted || reducedMotion) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const schedule = (fn: () => void, delay: number) => {
      const id = setTimeout(() => {
        if (!cancelled) fn();
      }, delay);
      timers.push(id);
    };

    function cycle() {
      setShowText(true);
      setCharCount(0);

      for (let i = 1; i <= WORD.length; i++) {
        schedule(() => setCharCount(i), TYPE_SPEED_MS * i);
      }

      const typedAt = TYPE_SPEED_MS * WORD.length;
      schedule(() => setShowText(false), typedAt + HOLD_TEXT_MS);

      const restartAt = typedAt + HOLD_TEXT_MS + FADE_MS + HOLD_ICON_MS + FADE_MS;
      schedule(cycle, restartAt);
    }

    cycle();
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [mounted, reducedMotion]);

  if (!mounted || reducedMotion) {
    return (
      <span
        className={`font-display font-semibold tracking-tight text-white ${SIZE_CLASSES[size]} ${className}`}
      >
        THE<span className="text-teal-400">V</span>HOMES
      </span>
    );
  }

  return (
    <span
      role="img"
      aria-label="TheVHomes"
      style={{ width: `${RESERVED_WIDTH_EM}em` }}
      className={`relative inline-flex h-[1.5em] shrink-0 items-center justify-start overflow-visible font-display font-semibold tracking-tight text-white ${SIZE_CLASSES[size]} ${className}`}
    >
      <AnimatePresence mode="wait">
        {showText ? (
          <motion.span
            key="text"
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
            className="inline-flex items-center whitespace-nowrap"
          >
            {WORD.slice(0, charCount)
              .split("")
              .map((char, i) => (
                <span key={i} className={i === ACCENT_INDEX ? "text-teal-400" : undefined}>
                  {char}
                </span>
              ))}
            {charCount < WORD.length && (
              <motion.span
                aria-hidden="true"
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.55, repeat: Infinity, repeatType: "reverse" }}
                className="ml-0.5 inline-block w-[2px] self-stretch bg-teal-300"
              />
            )}
          </motion.span>
        ) : (
          <motion.span
            key="icon"
            aria-hidden="true"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: FADE_MS / 1000, ease: "easeInOut" }}
            className="inline-flex items-center"
          >
            <LogoIcon size={ICON_SIZES[size]} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

function LogoIcon({ size }: { size: number }) {
  const gradientId = "thevhomes-logo-gradient";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className="drop-shadow-[0_0_12px_rgba(11,138,133,0.45)]"
    >
      <defs>
        <linearGradient id={gradientId} x1="4" y1="6" x2="44" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6bc5bf" />
          <stop offset="1" stopColor="#0b8a85" />
        </linearGradient>
      </defs>
      <path
        d="M4 23 L24 6 L44 23"
        stroke={`url(#${gradientId})`}
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 25 L24 43 L36 25"
        stroke="currentColor"
        className="text-white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
