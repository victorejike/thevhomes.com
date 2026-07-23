"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api, ApiError } from "@/lib/api";

export default function NewBookingPage() {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["properties", "for-booking"],
    queryFn: () => api.properties.list({ page_size: 50 }),
  });

  const [propertyId, setPropertyId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!propertyId || !date) return;

    setStatus("loading");
    try {
      await api.bookings.create({
        property_id: propertyId,
        scheduled_date: new Date(`${date}T${time}:00`).toISOString(),
        notes,
      });
      router.push("/dashboard/bookings");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong.");
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-display text-2xl font-semibold text-white">Book a Viewing</h1>
      <p className="mt-1 text-white/50">Choose a property and pick a convenient date/time.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="text-xs font-medium text-white/50">Property</label>
          <select
            required
            value={propertyId}
            onChange={(e) => setPropertyId(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          >
            <option value="">Select a property</option>
            {data?.items.map((p) => (
              <option key={p.id} value={p.id} className="text-charcoal-900">
                {p.title} — {p.city}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-white/50">Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split("T")[0]}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-white/50">Time</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-white/50">Notes (optional)</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>

        {status === "error" && <p className="text-sm text-red-400">{errorMessage}</p>}

        <motion.button
          type="submit"
          disabled={status === "loading"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 disabled:opacity-50"
        >
          {status === "loading" ? "Submitting..." : "Confirm Booking Request"}
        </motion.button>
      </form>
    </div>
  );
}
