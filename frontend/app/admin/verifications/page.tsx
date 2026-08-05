"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatDate } from "@/lib/format";

const TABS = ["pending", "verified", "failed", "rejected"] as const;

export default function AdminVerificationsPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("pending");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "verifications", tab],
    queryFn: () => api.admin.verifications(tab),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "verified" | "rejected" }) =>
      api.admin.reviewVerification(id, status, notes[id]),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "verifications"] }),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-white">Identity Verification</h1>
      <p className="mt-1 text-white/50">Review VerifyMe NIN verification submissions.</p>

      <div className="mt-6 flex gap-2 rounded-full border border-white/10 bg-white/5 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? "bg-teal-gradient text-charcoal-950" : "text-white/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {isLoading && <p className="mt-8 text-white/50">Loading...</p>}

      <div className="mt-6 space-y-3">
        {data?.map((v) => (
          <motion.div
            key={v.id}
            whileHover={{ x: 2 }}
            className="rounded-2xl border border-white/10 bg-white/[0.02] p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium text-white">{v.full_name}</p>
                <p className="text-sm text-white/50">
                  NIN ending {v.nin_last4} · DOB {formatDate(v.date_of_birth)} · {v.phone_number}
                </p>
                <p className="mt-1 text-xs text-white/40">Submitted {formatDate(v.verified_at ?? v.date_of_birth)}</p>
                {v.failure_reason && <p className="mt-1 text-xs text-red-400">{v.failure_reason}</p>}
              </div>
              {tab === "pending" || tab === "failed" ? (
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
                  <input
                    placeholder="Notes (optional)"
                    value={notes[v.id] ?? ""}
                    onChange={(e) => setNotes((n) => ({ ...n, [v.id]: e.target.value }))}
                    className="w-full min-w-0 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white sm:w-auto"
                  />
                  <button
                    onClick={() => reviewMutation.mutate({ id: v.id, status: "verified" })}
                    className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ id: v.id, status: "rejected" })}
                    className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30"
                  >
                    Reject
                  </button>
                </div>
              ) : (
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-white/70">{v.status}</span>
              )}
            </div>
          </motion.div>
        ))}
        {data && data.length === 0 && <p className="text-white/40">No {tab} verifications.</p>}
      </div>
    </div>
  );
}
