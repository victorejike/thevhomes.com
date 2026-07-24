"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-300",
  confirmed: "bg-emerald-500/20 text-emerald-300",
  completed: "bg-white/10 text-white/60",
  cancelled: "bg-red-500/20 text-red-300",
};

export default function AdminBookingsPage() {
  const [filters, setFilters] = useState<{ upcoming?: string; paid_only?: string }>({ upcoming: "true" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "bookings", filters],
    queryFn: () => api.admin.bookings(filters as Record<string, string>),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-white">Viewing Management</h1>
      <p className="mt-1 text-white/50">Upcoming appointments, paid bookings, and attendance tracking.</p>

      <div className="mt-6 flex gap-3">
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={filters.upcoming === "true"}
            onChange={(e) => setFilters((f) => ({ ...f, upcoming: e.target.checked ? "true" : undefined }))}
            className="h-4 w-4 accent-teal-400"
          />
          Upcoming only
        </label>
        <label className="flex items-center gap-2 text-sm text-white/70">
          <input
            type="checkbox"
            checked={filters.paid_only === "true"}
            onChange={(e) => setFilters((f) => ({ ...f, paid_only: e.target.checked ? "true" : undefined }))}
            className="h-4 w-4 accent-teal-400"
          />
          Paid viewings only
        </label>
      </div>

      {isLoading && <p className="mt-8 text-white/50">Loading...</p>}

      <div className="mt-6 space-y-3">
        {data?.map((booking) => (
          <motion.div key={booking.id} whileHover={{ x: 2 }} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{booking.property?.title}</p>
                <p className="text-sm text-white/50">
                  {booking.customer_id.slice(0, 8)} → Agent {booking.agent_id.slice(0, 8)} · {formatDate(booking.scheduled_date)}
                </p>
                <p className="mt-1 text-xs text-white/40 capitalize">
                  {booking.viewing_type ?? "physical"} viewing
                  {booking.payment_required && ` · Fee required`}
                  {booking.ticket && ` · Ticket ${booking.ticket.status.replace("_", " ")}`}
                </p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[booking.status]}`}>
                {booking.status}
              </span>
            </div>
          </motion.div>
        ))}
        {data && data.length === 0 && <p className="text-white/40">No bookings match these filters.</p>}
      </div>
    </div>
  );
}
