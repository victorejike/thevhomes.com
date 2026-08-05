"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { InfoPageShell } from "@/components/info-page-shell";

const reasons = [
  "Fraudulent listing",
  "Already sold/unavailable",
  "Misleading price or description",
  "Duplicate listing",
  "Inappropriate content",
  "Other",
];

export default function ReportPropertyPage() {
  const [propertyRef, setPropertyRef] = useState("");
  const [reason, setReason] = useState(reasons[0]);
  const [details, setDetails] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <InfoPageShell
      eyebrow="Support"
      title="Report a Property"
      subtitle="Spotted something wrong with a listing? Let our moderation team know and we'll take a look."
    >
      <div className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        {submitted ? (
          <div className="flex flex-col items-center py-8 text-center">
            <CheckCircle2 size={36} className="text-teal-400" />
            <h3 className="mt-4 font-display text-lg font-semibold text-white">Report received</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/60">
              Thank you — our moderation team will review this report within 24-48 hours and take
              appropriate action if the listing violates our policies.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm leading-relaxed text-white/60">
              Please provide as much detail as possible. Reports are reviewed manually by
              TheVHomes&apos; moderation team — this form does not notify the listing agent directly.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-white/50">Property URL, slug, or title</label>
                <input
                  type="text"
                  required
                  value={propertyRef}
                  onChange={(e) => setPropertyRef(e.target.value)}
                  placeholder="e.g. thevhomes.com/properties/3-bed-duplex-gwarinpa"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-white/50">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                >
                  {reasons.map((r) => (
                    <option key={r} value={r} className="bg-charcoal-900">
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-white/50">Additional details</label>
                <textarea
                  required
                  rows={4}
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Tell us what's wrong with this listing..."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 transition hover:brightness-110"
              >
                Submit Report
              </motion.button>
            </form>
          </>
        )}
      </div>
    </InfoPageShell>
  );
}
