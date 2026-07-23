"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, MapPin } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { MotionLink, tapScale } from "@/components/motion-link";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300",
  confirmed: "bg-emerald-500/20 text-emerald-300",
  completed: "bg-white/10 text-white/60",
  cancelled: "bg-red-500/20 text-red-300",
};

export default function BookingsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["bookings", "me"],
    queryFn: () => api.bookings.listMine(),
    retry: false,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-white">My Viewings</h1>
        <MotionLink
          href="/dashboard/bookings/new"
          {...tapScale}
          className="rounded-full bg-teal-gradient px-5 py-2.5 text-sm font-semibold text-charcoal-950"
        >
          Book New Viewing
        </MotionLink>
      </div>

      {isLoading && <p className="mt-8 text-white/50">Loading your viewings...</p>}

      {error && (
        <p className="mt-8 text-white/50">
          Could not load bookings from the API yet. Once `thevhomes-api` is deployed and you
          sign in, your viewing requests will appear here.
        </p>
      )}

      {data && data.length === 0 && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center text-white/60">
          <CalendarCheck size={32} className="mx-auto text-white/30" />
          <p className="mt-4">You haven&apos;t booked any viewings yet.</p>
        </div>
      )}

      <div className="mt-8 space-y-4">
        {data?.map((booking) => (
          <motion.div
            key={booking.id}
            whileHover={{ x: 4 }}
            className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-teal-400/30"
          >
            <div>
              <p className="font-medium text-white">{booking.property?.title ?? "Property"}</p>
              {booking.property && (
                <p className="mt-1 flex items-center gap-1 text-sm text-white/50">
                  <MapPin size={13} /> {booking.property.city}
                </p>
              )}
              <p className="mt-1 text-sm text-white/50">{formatDate(booking.scheduled_date)}</p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[booking.status]}`}
            >
              {booking.status}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
