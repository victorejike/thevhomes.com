"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp } from "lucide-react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";

export default function InvestmentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["investments"],
    queryFn: () => api.investments.list(),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
          Investment Platform
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
          Grow Your Wealth Through Real Estate
        </h1>
        <p className="mt-4 text-white/60">
          Curated development and shortlet fund opportunities with
          transparent timelines and projected returns.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-96 animate-pulse rounded-2xl bg-white/5" />
            ))
          : data?.map((investment, i) => (
              <motion.div
                key={investment.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] transition hover:border-teal-400/30 hover:shadow-glow"
              >
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={investment.image_url}
                    alt={investment.title}
                    fill
                    className="object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-teal-gradient px-3 py-1 text-xs font-semibold text-charcoal-950">
                    <TrendingUp size={13} />
                    {investment.roi_estimate_percent}% ROI
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="font-display text-lg font-semibold text-white">
                    {investment.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">
                    {investment.description}
                  </p>
                  <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/10 pt-5 text-sm">
                    <div>
                      <p className="text-white/40">Min. Investment</p>
                      <p className="font-semibold text-white">
                        {formatPrice(investment.min_investment, "NGN")}
                      </p>
                    </div>
                    <div>
                      <p className="text-white/40">Timeline</p>
                      <p className="font-semibold text-white">
                        {investment.timeline_months} months
                      </p>
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-6 w-full rounded-full bg-teal-gradient py-2.5 text-sm font-semibold text-charcoal-950 transition hover:brightness-110"
                  >
                    Request Investment Info
                  </motion.button>
                </div>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
