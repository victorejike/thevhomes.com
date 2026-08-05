"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, ShieldAlert } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { useAuthStore } from "@/lib/store";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400";

/**
 * VerifyMe-backed NIN identity verification. Every user (customer or agent)
 * completes this for full platform access; agents additionally need this
 * done before they can submit a business onboarding application (see
 * /dashboard/agent-application).
 */
export default function VerifyIdentityPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: status, isLoading } = useQuery({
    queryKey: ["verification", "me"],
    queryFn: () => api.verification.status(),
  });

  const [form, setForm] = useState({
    full_name: user?.name ?? "",
    nin: "",
    date_of_birth: "",
    phone_number: user?.phone ?? "",
  });
  const [submitState, setSubmitState] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const isVerified = status && "status" in status && status.status === "verified";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitState("loading");
    setErrorMessage("");
    try {
      await api.verification.submit(form);
      queryClient.invalidateQueries({ queryKey: ["verification", "me"] });
      setSubmitState("idle");
    } catch (err) {
      setSubmitState("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Verification failed. Please try again.");
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-2xl font-semibold text-white">Identity Verification</h1>
      <p className="mt-1 text-white/50">
        TheVHomes verifies every user&apos;s identity via VerifyMe using your National
        Identification Number (NIN) to keep the marketplace safe and trustworthy.
      </p>

      {isLoading && <p className="mt-8 text-white/50">Loading verification status...</p>}

      {isVerified ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6"
        >
          <BadgeCheck size={28} className="text-emerald-400" />
          <div>
            <p className="font-semibold text-white">✅ Identity Verified</p>
            <p className="text-sm text-white/60">
              Your identity has been confirmed. You have full access to TheVHomes platform.
            </p>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {status && "status" in status && status.status === "failed" && (
            <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
              <ShieldAlert size={18} className="mt-0.5 shrink-0" />
              <div>
                <p className="font-medium">Verification unsuccessful</p>
                <p className="mt-1 text-red-300/80">
                  {"failure_reason" in status ? status.failure_reason : "Please double-check your details and try again."}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-white/50">Full Name (as on your NIN)</label>
            <input
              required
              value={form.full_name}
              onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-white/50">National Identification Number (NIN)</label>
            <input
              required
              maxLength={11}
              minLength={11}
              pattern="[0-9]{11}"
              value={form.nin}
              onChange={(e) => setForm((f) => ({ ...f, nin: e.target.value.replace(/\D/g, "") }))}
              placeholder="11-digit NIN"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-white/50">Date of Birth</label>
              <input
                required
                type="date"
                value={form.date_of_birth}
                onChange={(e) => setForm((f) => ({ ...f, date_of_birth: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Phone Number</label>
              <input
                required
                value={form.phone_number}
                onChange={(e) => setForm((f) => ({ ...f, phone_number: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>

          {submitState === "error" && <p className="text-sm text-red-400">{errorMessage}</p>}

          <motion.button
            type="submit"
            disabled={submitState === "loading"}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 disabled:opacity-50"
          >
            {submitState === "loading" ? "Verifying with VerifyMe..." : "Verify My Identity"}
          </motion.button>

          <p className="text-xs text-white/40">
            Your NIN is encrypted at rest and is never shown to other users, agents, or displayed
            publicly. It is only used to confirm your identity via VerifyMe.
          </p>
        </form>
      )}
    </div>
  );
}
