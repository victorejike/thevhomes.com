"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Award, Building2, ClipboardCheck, ShieldCheck, Users, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { VerificationBadge } from "@/components/badge";
import { formatPrice } from "@/lib/format";

interface AdminStats {
  total_users: number;
  total_agents: number;
  approved_agents: number;
  pending_verifications: number;
  pending_agent_apps: number;
  pending_property_review: number;
  verified_properties: number;
  upcoming_bookings: number;
  total_revenue: number;
}

export default function AdminDashboardPage() {
  const { data: stats } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => api.admin.stats() as unknown as Promise<AdminStats>,
    retry: false,
  });
  const { data: properties } = useQuery({
    queryKey: ["properties", "admin-overview"],
    queryFn: () => api.properties.list({ page_size: 50 }),
  });
  const { data: agents } = useQuery({
    queryKey: ["agents", "admin-overview"],
    queryFn: () => api.agents.list(),
  });

  const cards = [
    { label: "Registered Users", value: stats?.total_users ?? "—", icon: Users },
    { label: "Approved Agents", value: stats?.approved_agents ?? "—", icon: Award },
    { label: "Verified Properties", value: stats?.verified_properties ?? "—", icon: ShieldCheck },
    { label: "Pending Verifications", value: stats?.pending_verifications ?? "—", icon: ClipboardCheck },
    { label: "Pending Agent Applications", value: stats?.pending_agent_apps ?? "—", icon: Building2 },
    { label: "Properties Awaiting Review", value: stats?.pending_property_review ?? "—", icon: ClipboardCheck },
    { label: "Upcoming Bookings", value: stats?.upcoming_bookings ?? "—", icon: Building2 },
    {
      label: "Total Revenue",
      value: stats ? formatPrice(stats.total_revenue, "NGN") : "—",
      icon: Wallet,
    },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-white">Admin Overview</h1>
      <p className="mt-1 text-white/50">
        Platform-wide analytics and management tools.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -6, scale: 1.02 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-teal-400/30 hover:shadow-glow"
          >
            <card.icon size={20} className="text-teal-400" />
            <p className="mt-4 text-2xl font-semibold text-white">{card.value}</p>
            <p className="text-sm text-white/50">{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg font-semibold text-white">Recent Listings</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="pb-3 font-medium">Title</th>
                <th className="pb-3 font-medium">City</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {properties?.items.slice(0, 8).map((property) => (
                <motion.tr
                  key={property.id}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  className="border-b border-white/5 text-white/80"
                >
                  <td className="py-3 pr-4">{property.title}</td>
                  <td className="py-3 pr-4">{property.city}</td>
                  <td className="py-3 pr-4">{formatPrice(property.price, property.currency)}</td>
                  <td className="py-3">
                    <VerificationBadge status={property.verification_status} />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg font-semibold text-white">Agents</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-white/40">
                <th className="pb-3 font-medium">Name</th>
                <th className="pb-3 font-medium">Agency</th>
                <th className="pb-3 font-medium">Agent ID</th>
                <th className="pb-3 font-medium">Rating</th>
                <th className="pb-3 font-medium">Verification</th>
              </tr>
            </thead>
            <tbody>
              {agents?.map((agent) => (
                <motion.tr
                  key={agent.id}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                  className="border-b border-white/5 text-white/80"
                >
                  <td className="py-3 pr-4">{agent.user?.name}</td>
                  <td className="py-3 pr-4">{agent.agency_name}</td>
                  <td className="py-3 pr-4">{agent.agent_number ?? "—"}</td>
                  <td className="py-3 pr-4">{agent.rating.toFixed(1)}</td>
                  <td className="py-3 capitalize">{agent.verification_level.replace("_", " ")}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
