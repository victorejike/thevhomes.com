"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, MapPin, QrCode, Video } from "lucide-react";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";
import { MotionLink, tapScale } from "@/components/motion-link";
import type { Booking } from "@/lib/types";

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

  const [ticketFor, setTicketFor] = useState<Booking | null>(null);

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
              {booking.viewing_type && booking.viewing_type !== "physical" && (
                <p className="mt-1 flex items-center gap-1 text-xs text-teal-300">
                  <Video size={12} /> {booking.viewing_type === "virtual" ? "Live Video Tour" : "Video Inspection"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              {booking.payment_required && !booking.ticket && (
                <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-medium text-amber-300">
                  Payment Pending
                </span>
              )}
              {booking.ticket && (
                <button
                  onClick={() => setTicketFor(booking)}
                  className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white hover:border-teal-400/40"
                >
                  <QrCode size={13} /> Ticket
                </button>
              )}
              {booking.viewing_type && booking.viewing_type !== "physical" && (
                <MotionLink
                  href={`/dashboard/bookings/${booking.id}/live`}
                  {...tapScale}
                  className="flex items-center gap-1.5 rounded-full bg-teal-gradient px-3 py-1.5 text-xs font-semibold text-charcoal-950"
                >
                  <Video size={13} /> Join
                </MotionLink>
              )}
              <span
                className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_STYLES[booking.status]}`}
              >
                {booking.status}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {ticketFor?.ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setTicketFor(null)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-charcoal-900 p-6 text-center shadow-2xl"
          >
            <h3 className="font-display text-lg font-semibold text-white">Viewing Ticket</h3>
            <p className="mt-1 text-sm text-white/50">{ticketFor.property?.title}</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ticketFor.ticket.qr_code_url}
              alt="Viewing ticket QR code"
              className="mx-auto mt-4 h-48 w-48 rounded-xl bg-white p-2"
            />
            <p className="mt-3 font-mono text-sm text-teal-300">{ticketFor.ticket.ticket_code}</p>
            <p className="mt-1 text-xs text-white/40 capitalize">Status: {ticketFor.ticket.status.replace("_", " ")}</p>
            <button
              onClick={() => setTicketFor(null)}
              className="mt-5 w-full rounded-full border border-white/15 py-2.5 text-sm font-medium text-white"
            >
              Close
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
