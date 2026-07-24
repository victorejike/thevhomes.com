"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Award, CheckCircle2, Clock, XCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { AgentNumberBadge } from "@/components/badge";
import { MotionLink, tapScale } from "@/components/motion-link";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400";

const STATUS_META: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  not_applied: { label: "Not Applied", icon: Clock, className: "bg-white/10 text-white/60" },
  pending: { label: "Pending Review", icon: Clock, className: "bg-amber-500/20 text-amber-300" },
  under_review: { label: "Under Review", icon: Clock, className: "bg-amber-500/20 text-amber-300" },
  approved: { label: "Approved", icon: CheckCircle2, className: "bg-emerald-500/20 text-emerald-300" },
  rejected: { label: "Rejected", icon: XCircle, className: "bg-red-500/20 text-red-300" },
};

/**
 * Secure agent onboarding: after personal VerifyMe identity verification
 * (see /dashboard/verify), an agent submits business details for admin
 * review. Approval assigns a permanent TVH-AGT-###### agent number, the
 * sole gate for publishing property listings.
 */
export default function AgentApplicationPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["agent-applications", "me"],
    queryFn: () => api.agentApplications.mine(),
  });

  const [form, setForm] = useState({
    business_name: "",
    office_address: "",
    cac_number: "",
    cac_document_url: "",
    government_id_url: "",
    profile_photo_url: "",
    selfie_url: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      await api.agentApplications.submit(form);
      queryClient.invalidateQueries({ queryKey: ["agent-applications", "me"] });
      setStatus("idle");
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Could not submit your application.");
    }
  }

  if (isLoading) return <p className="text-white/50">Loading...</p>;

  const agent = data?.agent;
  const meta = STATUS_META[agent?.approval_status ?? "not_applied"];
  const identityVerified = agent?.identity_verified;

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-white">Become a Verified Agent</h1>
      <p className="mt-1 text-white/50">
        Only agents with an approved TheVHomes Agent ID can publish property listings.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${meta.className}`}>
          <meta.icon size={15} /> {meta.label}
        </span>
        {agent?.agent_number && <AgentNumberBadge agentNumber={agent.agent_number} />}
      </div>

      {!identityVerified && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          Complete{" "}
          <MotionLink href="/dashboard/verify" className="font-semibold underline">
            personal identity verification
          </MotionLink>{" "}
          (NIN via VerifyMe) before submitting your agent application.
        </div>
      )}

      {agent?.approval_status === "approved" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6"
        >
          <Award size={28} className="text-emerald-400" />
          <div>
            <p className="font-semibold text-white">🏅 You&apos;re an approved TheVHomes Agent</p>
            <p className="text-sm text-white/60">
              Agent ID {agent.agent_number} — you can now publish property listings.
            </p>
          </div>
        </motion.div>
      ) : (
        identityVerified &&
        agent?.approval_status !== "pending" &&
        agent?.approval_status !== "under_review" && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-xs font-medium text-white/50">Business / Agency Name</label>
              <input
                required
                value={form.business_name}
                onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Office Address</label>
              <input
                required
                value={form.office_address}
                onChange={(e) => setForm((f) => ({ ...f, office_address: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">CAC Registration Number (optional)</label>
              <input
                value={form.cac_number}
                onChange={(e) => setForm((f) => ({ ...f, cac_number: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">CAC Document URL (optional)</label>
              <input
                value={form.cac_document_url}
                onChange={(e) => setForm((f) => ({ ...f, cac_document_url: e.target.value }))}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Government ID URL</label>
              <input
                required
                value={form.government_id_url}
                onChange={(e) => setForm((f) => ({ ...f, government_id_url: e.target.value }))}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Profile Photo URL</label>
              <input
                required
                value={form.profile_photo_url}
                onChange={(e) => setForm((f) => ({ ...f, profile_photo_url: e.target.value }))}
                placeholder="https://..."
                className={inputClass}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-white/50">Selfie URL (optional, for face match)</label>
              <input
                value={form.selfie_url}
                onChange={(e) => setForm((f) => ({ ...f, selfie_url: e.target.value }))}
                placeholder="https://..."
                className={inputClass}
              />
            </div>

            {status === "error" && <p className="text-sm text-red-400">{errorMessage}</p>}

            <motion.button
              type="submit"
              disabled={status === "loading"}
              {...tapScale}
              className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 disabled:opacity-50"
            >
              {status === "loading" ? "Submitting..." : "Submit Application"}
            </motion.button>
          </form>
        )
      )}

      {data?.applications && data.applications.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-lg font-semibold text-white">Application History</h2>
          <div className="mt-4 space-y-3">
            {data.applications.map((app) => (
              <div key={app.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-white">{app.business_name}</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs ${STATUS_META[app.status].className}`}>
                    {STATUS_META[app.status].label}
                  </span>
                </div>
                {app.review_notes && <p className="mt-2 text-white/50">Admin note: {app.review_notes}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
