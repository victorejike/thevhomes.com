"use client";

import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Heart, MessageCircle } from "lucide-react";
import { useAuthStore, useSavedPropertiesStore } from "@/lib/store";
import { api } from "@/lib/api";
import { MotionLink, tapScale } from "@/components/motion-link";

export default function DashboardOverviewPage() {
  const { user } = useAuthStore();
  const { savedIds } = useSavedPropertiesStore();

  const { data: bookings } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => api.bookings.listMine(),
    retry: false,
  });

  const cards = [
    { label: "Upcoming Viewings", value: bookings?.length ?? 0, icon: CalendarCheck, href: "/dashboard/bookings" },
    { label: "Saved Properties", value: savedIds.length, icon: Heart, href: "/dashboard/saved" },
    { label: "Unread Messages", value: 0, icon: MessageCircle, href: "/dashboard/messages" },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-white">
        Welcome back, {user?.name?.split(" ")[0] ?? "there"} 👋
      </h1>
      <p className="mt-1 text-white/50">Here&apos;s what&apos;s happening with your account.</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
        {cards.map((card) => (
          <MotionLink
            key={card.label}
            href={card.href}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-teal-400/30 hover:shadow-glow"
          >
            <card.icon size={22} className="text-teal-400" />
            <p className="mt-4 text-2xl font-semibold text-white">{card.value}</p>
            <p className="text-sm text-white/50">{card.label}</p>
          </MotionLink>
        ))}
      </div>

      <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
        <h2 className="font-display text-lg font-semibold text-white">Quick Actions</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <MotionLink
            href="/properties"
            {...tapScale}
            className="rounded-full bg-teal-gradient px-5 py-2.5 text-sm font-semibold text-charcoal-950"
          >
            Browse Properties
          </MotionLink>
          <MotionLink
            href="/dashboard/bookings/new"
            {...tapScale}
            className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:border-teal-400/40"
          >
            Book a Viewing
          </MotionLink>
          {(user?.role === "agent" || user?.role === "admin") && (
            <MotionLink
              href="/dashboard/properties/new"
              {...tapScale}
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-white hover:border-teal-400/40"
            >
              List a Property
            </MotionLink>
          )}
        </div>
      </div>
    </div>
  );
}
