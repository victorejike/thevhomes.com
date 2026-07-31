"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { MotionLink, tapScale } from "./motion-link";

// A second real property video (distinct from the hero) so the two video
// sections don't feel repetitive. Override with NEXT_PUBLIC_CTA_VIDEO_URL
// once TheVHomes' own branded footage is hosted on Cloudflare R2.
const CTA_VIDEO_URL =
  process.env.NEXT_PUBLIC_CTA_VIDEO_URL ??
  "https://assets.mixkit.co/videos/13107/13107-720.mp4";
const CTA_POSTER = "https://assets.mixkit.co/videos/13107/13107-thumb-720-0.jpg";

export function CtaSection() {
  const [videoFailed, setVideoFailed] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-6 pb-24 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl border border-teal-400/20">
        <div className="absolute inset-0">
          {!videoFailed ? (
            <video
              className="h-full w-full object-cover"
              src={CTA_VIDEO_URL}
              poster={CTA_POSTER}
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
              style={{ backgroundImage: `url(${CTA_POSTER})` }}
              initial={{ scale: 1 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: 20, ease: "easeOut" }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-br from-charcoal-950/90 via-charcoal-950/80 to-black/90" />
        </div>

        <div className="relative px-6 py-12 text-center sm:px-16 sm:py-16">
          <h2 className="font-display text-2xl font-semibold text-white sm:text-3xl lg:text-4xl">
            Ready to Find Your Perfect Property?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Speak with a TheVHomes specialist today or start exploring our
            curated collection of luxury homes and investment opportunities.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <MotionLink
              href="/properties"
              {...tapScale}
              className="group flex items-center gap-2 rounded-full bg-teal-gradient px-8 py-3.5 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
            >
              Explore Properties
              <ArrowRight size={16} className="transition group-hover:translate-x-1" />
            </MotionLink>
            <motion.a
              href="https://wa.me/2348062463468"
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="rounded-full border border-white/25 px-8 py-3.5 text-sm font-semibold text-white transition hover:border-teal-300/60 hover:text-teal-200"
            >
              Chat on WhatsApp
            </motion.a>
          </div>
        </div>
      </div>
    </section>
  );
}
