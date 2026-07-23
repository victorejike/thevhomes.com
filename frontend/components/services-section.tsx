"use client";

import { motion } from "framer-motion";
import { Building2, CalendarCheck, MessageCircleMore, ShieldCheck, TrendingUp, Video } from "lucide-react";

const SERVICES = [
  {
    icon: Building2,
    title: "Buy, Rent & Shortlet",
    description:
      "Browse verified apartments, villas, land, and commercial spaces across Abuja, Lagos, Dubai, and beyond.",
  },
  {
    icon: CalendarCheck,
    title: "Instant Viewing Bookings",
    description:
      "Schedule property inspections in seconds with real-time agent availability and calendar sync.",
  },
  {
    icon: MessageCircleMore,
    title: "Real-Time Agent Chat",
    description:
      "Message agents and support directly with live typing indicators, read receipts, and file sharing.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Listings",
    description:
      "Every property is reviewed by our team, with Premium Verified status for the highest trust tier.",
  },
  {
    icon: TrendingUp,
    title: "Real Estate Investment",
    description:
      "Access curated development and shortlet fund opportunities with transparent ROI projections.",
  },
  {
    icon: Video,
    title: "Virtual Tours",
    description:
      "Explore immersive 360° virtual tours and video walkthroughs before ever stepping on-site.",
  },
];

export function ServicesSection() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
          Why TheVHomes
        </span>
        <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
          Everything You Need, In One Platform
        </h2>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((service, i) => (
          <motion.div
            key={service.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            whileHover={{ y: -6, scale: 1.02 }}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-teal-400/30 hover:bg-white/[0.05] hover:shadow-glow"
          >
            <motion.div
              whileHover={{ rotate: 8, scale: 1.1 }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-gradient text-charcoal-950"
            >
              <service.icon size={22} />
            </motion.div>
            <h3 className="mt-5 font-display text-lg font-semibold text-white">
              {service.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              {service.description}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
