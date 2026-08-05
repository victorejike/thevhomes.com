"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Facebook, Instagram, Mail, MapPin, Phone, Twitter } from "lucide-react";
import { MotionLink } from "./motion-link";
import { CookiePreferencesLink } from "./cookie-preferences-link";

// Footer background video — once TheVHomes' own branded footage is hosted,
// override with NEXT_PUBLIC_FOOTER_VIDEO_URL in .env.
//
// The previous Mixkit URL returned 403 (Mixkit blocks hotlinking), so both the
// video and its poster silently failed and the footer rendered as flat charcoal.
// These URLs are verified to serve cross-origin.
//
// Three resolutions: the browser picks one at load time from the <source>
// media queries, so phones pull 0.7 MB instead of the 6.4 MB desktop file.
// A 960-wide file stretched across a 1920 footer is what made it look soft.
const FOOTER_VIDEO_HD =
  process.env.NEXT_PUBLIC_FOOTER_VIDEO_URL ??
  "https://videos.pexels.com/video-files/3773486/3773486-hd_1920_1080_30fps.mp4";
const FOOTER_VIDEO_MD =
  "https://videos.pexels.com/video-files/3773486/3773486-sd_960_540_30fps.mp4";
const FOOTER_VIDEO_SM =
  "https://videos.pexels.com/video-files/3773486/3773486-sd_640_360_30fps.mp4";
const FOOTER_POSTER =
  process.env.NEXT_PUBLIC_FOOTER_POSTER_URL ??
  "https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=1600";

const columns = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Us" },
      { href: "/company/our-story", label: "Our Story" },
      { href: "/company/founder", label: "Meet the Founder" },
      { href: "/company/team", label: "Our Team" },
      { href: "/agents", label: "Our Agents" },
      { href: "/careers", label: "Careers" },
      { href: "/contact", label: "Contact Us" },
    ],
  },
  {
    title: "Services",
    links: [
      { href: "/services/buy", label: "Buy Property" },
      { href: "/services/sell", label: "Sell Property" },
      { href: "/services/rent", label: "Rent Property" },
      { href: "/services/shortlet", label: "Shortlet" },
      { href: "/services/hotels", label: "Hotels" },
      { href: "/services/commercial", label: "Commercial" },
      { href: "/investments", label: "Property Investment" },
      { href: "/services/property-management", label: "Property Management" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/legal/privacy-policy", label: "Privacy Policy" },
      { href: "/legal/cookie-policy", label: "Cookie Policy" },
      { href: "/legal/terms", label: "Terms & Conditions" },
      { href: "/legal/refund-policy", label: "Refund Policy" },
      { href: "/legal/property-listing-policy", label: "Property Listing Policy" },
      { href: "/legal/agent-terms", label: "Agent Terms" },
      { href: "/legal/community-guidelines", label: "Community Guidelines" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/support/help-center", label: "Help Center" },
      { href: "/support/faq", label: "FAQs" },
      { href: "/support/report-property", label: "Report a Property" },
      { href: "/support/report-agent", label: "Report an Agent" },
      { href: "/support/safety-tips", label: "Safety Tips" },
    ],
  },
];

export function Footer() {
  const [videoFailed, setVideoFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Resolution is chosen here rather than with <source media="…"> children,
  // because browsers only honour `media` inside <picture> — on <video> they
  // take the first playable source and would hand the 640px file to desktop.
  // Accounting for DPR keeps the footage sharp on retina laptops and phones.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const effectiveWidth = window.innerWidth * dpr;
    el.src =
      effectiveWidth <= 900
        ? FOOTER_VIDEO_SM
        : effectiveWidth <= 1600
          ? FOOTER_VIDEO_MD
          : FOOTER_VIDEO_HD;
    el.load();
  }, []);

  // Browsers can reject the initial autoplay attempt (or pause the element when
  // the tab is backgrounded / on low-power mode). Re-issuing play() on those
  // events is what makes the loop genuinely continuous rather than best-effort.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const resume = () => {
      if (el.paused && !el.ended) {
        void el.play().catch(() => {
          /* Autoplay still blocked — the poster stays visible. */
        });
      }
    };

    resume();
    el.addEventListener("pause", resume);
    el.addEventListener("stalled", resume);
    el.addEventListener("loadeddata", resume);
    document.addEventListener("visibilitychange", resume);

    return () => {
      el.removeEventListener("pause", resume);
      el.removeEventListener("stalled", resume);
      el.removeEventListener("loadeddata", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, []);

  return (
    <footer className="relative overflow-hidden border-t border-white/10 bg-charcoal-950 text-white/80 [text-shadow:0_1px_3px_rgb(0_0_0/60%)]">
      {/* Continuous background video */}
      <div className="absolute inset-0">
        {!videoFailed ? (
          <video
            ref={videoRef}
            className="h-full w-full object-cover"
            poster={FOOTER_POSTER}
            autoPlay
            loop
            muted
            playsInline
            preload="none"
            onError={() => setVideoFailed(true)}
          />
        ) : (
          <motion.div
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url(${FOOTER_POSTER})` }}
            initial={{ scale: 1 }}
            animate={{ scale: 1.05 }}
            transition={{ duration: 20, ease: "easeOut" }}
          />
        )}
        {/* Scrim: dark enough to keep body text legible, light enough that the
            footage actually reads as footage. The vertical gradient is heaviest
            at the edges so the seam against the page above and the copyright
            bar below stays clean. */}
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal-950/90 via-charcoal-950/60 to-charcoal-950/90" />
        {/* Left-weighted wash so the brand blurb and contact details — the
            longest run of small text — sit over the densest part of the scrim. */}
        <div className="absolute inset-0 bg-gradient-to-r from-charcoal-950/80 via-charcoal-950/40 to-charcoal-950/60" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 sm:gap-12 lg:grid-cols-5 lg:py-16 lg:px-8">
          <div className="sm:col-span-2 lg:col-span-1">
            <span className="font-display text-2xl font-semibold text-white">
              THE<span className="text-teal-400">V</span>HOMES
            </span>
            <p className="mt-4 max-w-sm text-sm leading-relaxed">
              Premium real estate marketplace and property management platform
              connecting discerning clients to Nigeria&apos;s finest homes,
              shortlets, and investment opportunities.
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-teal-400" /> Abuja, Nigeria
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} className="text-teal-400" />
                <a href="tel:+2348062463468" className="transition hover:text-teal-300">
                  +234 806 246 3468
                </a>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-teal-400" />
                <a href="mailto:thevhomes@gmail.com" className="transition hover:text-teal-300">
                  thevhomes@gmail.com
                </a>
              </div>
            </div>
            <div className="mt-6 flex gap-3">
              {[Facebook, Instagram, Twitter].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.15, y: -3, rotate: 6 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 transition hover:border-teal-400/50 hover:text-teal-300"
                >
                  <Icon size={16} />
                </motion.a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-white">
                {col.title}
              </h4>
              <ul className="mt-4 space-y-3 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <MotionLink
                      href={link.href}
                      whileHover={{ x: 4 }}
                      className="inline-block transition hover:text-teal-300"
                    >
                      {link.label}
                    </MotionLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 px-6 py-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-xs text-white/60 sm:flex-row sm:text-left">
            <p>© {new Date().getFullYear()} THE VHOMES LIMITED. All rights reserved.</p>
            <CookiePreferencesLink className="text-xs text-white/60 underline underline-offset-2 transition hover:text-teal-300" />
          </div>
        </div>
      </div>
    </footer>
  );
}
