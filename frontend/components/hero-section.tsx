"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocaleStore } from "@/lib/store";
import { t, heroRotatingWords } from "@/lib/i18n";
import { SearchBar } from "./search-bar";
import { MobileSearchToggle } from "./mobile-search-toggle";
import { MotionLink, tapScale } from "./motion-link";

// How long each rotating headline word stays put before crossfading to the
// next one. Deliberately slow/cinematic so it feels like part of the hero
// video's own pacing rather than a fast-ticking banner.
const ROTATE_WORD_MS = 3600;

// Real cinematic property-walkthrough footage by default (hosted on Mixkit's
// CDN, free to hotlink under the Mixkit license). Override with
// NEXT_PUBLIC_HERO_VIDEO_URL to swap in TheVHomes' own branded footage once
// it's uploaded to Cloudflare R2.
const HERO_VIDEO_URL =
  process.env.NEXT_PUBLIC_HERO_VIDEO_URL ??
  "https://assets.mixkit.co/videos/28215/28215-720.mp4";
const HERO_POSTER =
  "https://assets.mixkit.co/videos/28215/28215-thumb-720-0.jpg";

export function HeroSection() {
  const { locale } = useLocaleStore();
  const [videoFailed, setVideoFailed] = useState(false);
  const reducedMotion = useReducedMotion();
  const rotatingWords = heroRotatingWords[locale] ?? heroRotatingWords.en;
  const [wordIndex, setWordIndex] = useState(0);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [wordBoxWidth, setWordBoxWidth] = useState<number | null>(null);

  useEffect(() => {
    if (reducedMotion || rotatingWords.length <= 1) return;
    const id = setInterval(() => {
      setWordIndex((i) => (i + 1) % rotatingWords.length);
    }, ROTATE_WORD_MS);
    return () => clearInterval(id);
  }, [reducedMotion, rotatingWords.length]);

  // Reserve exactly as much horizontal space as the single widest rotating
  // word needs (measured at the heading's actual rendered font size) so the
  // line's total width never changes between rotations — that keeps "Find
  // Your" perfectly still while both words stay on one line. Re-measured on
  // resize since the heading's font size changes across breakpoints.
  useLayoutEffect(() => {
    function measure() {
      const container = measureRef.current;
      if (!container) return;
      let max = 0;
      Array.from(container.children).forEach((child) => {
        max = Math.max(max, (child as HTMLElement).getBoundingClientRect().width);
      });
      if (max > 0) setWordBoxWidth(max);
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [rotatingWords]);

  return (
    <section className="relative flex h-[100svh] min-h-[640px] w-full items-center justify-center overflow-hidden bg-charcoal-950">
      <div className="absolute inset-0">
        {!videoFailed ? (
          <video
            className="h-full w-full object-cover"
            src={HERO_VIDEO_URL}
            poster={HERO_POSTER}
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <motion.div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${HERO_POSTER})` }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.08 }}
            transition={{ duration: 20, ease: "easeOut" }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-charcoal-950" />
        <div className="absolute inset-0 backdrop-blur-[1px]" />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-4 text-center sm:px-6">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4 rounded-full border border-teal-400/40 bg-white/5 px-4 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-teal-300 backdrop-blur sm:mb-5 sm:text-xs sm:tracking-[0.3em]"
        >
          {t(locale, "hero_kicker")}
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="font-display text-3xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-7xl"
        >
          {t(locale, "hero_title_1")}{" "}
          <span
            className="relative inline-block text-left align-baseline"
            style={wordBoxWidth ? { width: `${wordBoxWidth}px` } : undefined}
          >
            {/* Invisible ruler: renders every rotating word (in the exact
                same font/size) off-screen purely to measure the widest one
                in pixels — see the effect above. */}
            <span
              ref={measureRef}
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 -z-10 whitespace-nowrap opacity-0"
            >
              {rotatingWords.map((word) => (
                <span key={word} className="block">
                  {word}
                </span>
              ))}
            </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={reducedMotion ? "static" : wordIndex}
                initial={reducedMotion ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reducedMotion ? undefined : { opacity: 0, y: -14 }}
                transition={{ duration: 0.7, ease: "easeInOut" }}
                className="inline-block whitespace-nowrap bg-teal-gradient bg-clip-text text-transparent"
              >
                {rotatingWords[wordIndex]}
              </motion.span>
            </AnimatePresence>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-5 max-w-xl text-balance text-base text-white/80 sm:mt-6 sm:text-lg md:text-xl"
        >
          {t(locale, "hero_subtitle")}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-8 flex w-full flex-col gap-3 sm:mt-10 sm:flex-row sm:justify-center"
        >
          <MotionLink
            href="/properties"
            {...tapScale}
            className="group flex items-center justify-center gap-2 rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
          >
            {t(locale, "cta_explore")}
            <ArrowRight size={16} className="transition group-hover:translate-x-1" />
          </MotionLink>
          <MotionLink
            href="/dashboard/bookings/new"
            {...tapScale}
            className="flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-teal-300/60 hover:text-teal-200"
          >
            <CalendarCheck2 size={16} />
            {t(locale, "cta_book")}
          </MotionLink>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-12 w-full"
        >
          {/* Mobile: compact floating search icon that expands on tap, to
              preserve space for the hero video/animation. */}
          <div className="sm:hidden">
            <MobileSearchToggle />
          </div>
          {/* Tablet/desktop: full search panel, unchanged. */}
          <div className="hidden sm:block">
            <SearchBar />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
