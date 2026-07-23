"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck, Star } from "lucide-react";
import { api } from "@/lib/api";

export default function AgentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: () => api.agents.list(),
  });

  return (
    <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
      <div className="mx-auto max-w-2xl text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
          Agent Marketplace
        </span>
        <h1 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
          Meet Our Verified Agents
        </h1>
        <p className="mt-4 text-white/60">
          Every TheVHomes agent is vetted for professionalism, market
          expertise, and a proven track record.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-56 animate-pulse rounded-2xl bg-white/5" />
            ))
          : data?.map((agent, i) => (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                whileHover={{ y: -6, scale: 1.02 }}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition hover:border-teal-400/30 hover:shadow-glow"
              >
                <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-full bg-white/10">
                  {agent.user?.avatar_url && (
                    <Image src={agent.user.avatar_url} alt={agent.user.name} fill className="object-cover" />
                  )}
                </div>
                <h3 className="mt-4 flex items-center justify-center gap-1.5 font-display text-lg font-semibold text-white">
                  {agent.user?.name}
                  {agent.verified && <ShieldCheck size={15} className="text-teal-400" />}
                </h3>
                <p className="text-sm text-white/50">{agent.agency_name}</p>
                <p className="mt-2 text-xs text-white/40">
                  {agent.experience_years} years experience
                </p>
                {agent.reviews_count > 0 && (
                  <div className="mt-3 flex items-center justify-center gap-1 text-sm text-white/70">
                    <Star size={14} className="fill-teal-400 text-teal-400" />
                    {agent.rating.toFixed(1)} ({agent.reviews_count})
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="mt-5 w-full rounded-full border border-white/15 py-2 text-sm font-medium text-white transition hover:border-teal-400/40 hover:text-teal-300"
                >
                  View Profile
                </motion.button>
              </motion.div>
            ))}
      </div>
    </div>
  );
}
