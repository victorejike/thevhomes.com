"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

const TABS = ["pending", "under_review", "approved", "rejected"] as const;

export default function AdminAgentApplicationsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "agent-applications", tab],
    queryFn: () => api.admin.agentApplications(tab),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "approve" | "reject" | "under_review" }) =>
      api.admin.reviewAgentApplication(id, decision, notes[id]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "agent-applications"] }),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-white">Agent Approval</h1>
      <p className="mt-1 text-white/50">
        Review business onboarding applications. Approving assigns a permanent TVH-AGT-###### ID.
      </p>

      <div className="mt-6 flex flex-wrap gap-2 rounded-full border border-white/10 bg-white/5 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? "bg-teal-gradient text-charcoal-950" : "text-white/60"
            }`}
          >
            {t.replace("_", " ")}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-white/50">Loading...</p>}

      <div className="mt-6 space-y-3">
        {data?.map((app) => (
          <motion.div key={app.id} whileHover={{ x: 2 }} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{app.business_name}</p>
                <p className="text-sm text-white/50">{app.office_address}</p>
                <div className="mt-1 flex flex-wrap gap-3 text-xs text-white/40">
                  {app.cac_number && <span>CAC: {app.cac_number}</span>}
                  <a href={app.government_id_url} target="_blank" rel="noreferrer" className="text-teal-300 underline">
                    Government ID
                  </a>
                  <a href={app.profile_photo_url} target="_blank" rel="noreferrer" className="text-teal-300 underline">
                    Profile Photo
                  </a>
                  {app.selfie_url && (
                    <a href={app.selfie_url} target="_blank" rel="noreferrer" className="text-teal-300 underline">
                      Selfie
                    </a>
                  )}
                </div>
                <p className="mt-1 text-xs text-white/40">Submitted {formatDate(app.submitted_at)}</p>
              </div>
              {app.status === "pending" || app.status === "under_review" ? (
                <div className="flex items-center gap-2">
                  <input
                    placeholder="Notes (optional)"
                    value={notes[app.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [app.id]: e.target.value }))}
                    className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                  />
                  <button
                    onClick={() => reviewMutation.mutate({ id: app.id, decision: "approve" })}
                    className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ id: app.id, decision: "reject" })}
                    className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-white/70">{app.status}</span>
              )}
            </div>
          </motion.div>
        ))}
        {data && data.length === 0 && <p className="text-white/40">No applications in this state.</p>}
      </div>
    </div>
  );
}
