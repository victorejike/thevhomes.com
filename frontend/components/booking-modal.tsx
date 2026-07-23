"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import type { Property } from "@/lib/types";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

export function BookingModal({ property, onClose }: { property: Property; onClose: () => void }) {
  const { user } = useAuthStore();
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit() {
    if (!date) return;

    if (!user) {
      setStatus("error");
      setErrorMessage("Please sign in to book a viewing.");
      return;
    }

    setStatus("loading");
    try {
      await api.bookings.create({
        property_id: property.id,
        scheduled_date: new Date(`${date}T${time}:00`).toISOString(),
        notes,
      });
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-charcoal-900 p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-semibold text-white">Book a Viewing</h3>
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.15, rotate: 90 }}
            whileTap={{ scale: 0.85 }}
            className="text-white/60 hover:text-white"
          >
            <X size={18} />
          </motion.button>
        </div>
        <p className="mt-1 text-sm text-white/50">{property.title}</p>

        {status === "success" ? (
          <div className="mt-8 flex flex-col items-center text-center">
            <CheckCircle2 size={40} className="text-teal-400" />
            <p className="mt-3 font-medium text-white">Viewing requested!</p>
            <p className="mt-1 text-sm text-white/60">
              Our agent will confirm your appointment shortly via email/WhatsApp.
            </p>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              className="mt-6 rounded-full bg-teal-gradient px-6 py-2.5 text-sm font-semibold text-charcoal-950"
            >
              Done
            </motion.button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-white/50">Date</label>
                <input
                  type="date"
                  value={date}
                  min={new Date().toISOString().split("T")[0]}
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
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Anything specific you'd like the agent to know?"
                className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-teal-400"
              />
            </div>

            {status === "error" && (
              <p className="text-sm text-red-400">{errorMessage}</p>
            )}

            <motion.button
              onClick={handleSubmit}
              disabled={!date || status === "loading"}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 transition hover:brightness-110 disabled:opacity-50"
            >
              {status === "loading" ? "Submitting..." : "Confirm Viewing Request"}
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
