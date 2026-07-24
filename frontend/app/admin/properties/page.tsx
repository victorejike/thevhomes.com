"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/format";

const TABS = ["pending_review", "under_inspection", "verified", "rejected", "all"] as const;

export default function AdminPropertyReviewPage() {
  const [tab, setTab] = useState<typeof TABS[number]>("pending_review");
  const [checklists, setChecklists] = useState<Record<string, Record<string, boolean>>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "property-review", tab],
    queryFn: () => api.admin.propertyReviewQueue(tab),
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "under_inspection" | "verified" | "rejected" }) => {
      const checklist = checklists[id] ?? {};
      return api.admin.reviewProperty(id, {
        status: decision,
        images_checked: Boolean(checklist.images),
        ownership_doc_checked: Boolean(checklist.ownership),
        location_checked: Boolean(checklist.location),
        details_checked: Boolean(checklist.details),
        tour_checked: Boolean(checklist.tour),
        notes: notes[id],
        premium_listing: Boolean(checklist.premium),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "property-review"] }),
  });

  function toggle(id: string, key: string) {
    setChecklists((c) => ({ ...c, [id]: { ...c[id], [key]: !c[id]?.[key] } }));
  }

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-white">Property Review</h1>
      <p className="mt-1 text-white/50">
        Verify images, ownership documents, location accuracy, listing details, and 3D tour quality.
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

      <div className="mt-6 space-y-4">
        {data?.map((property) => (
          <motion.div key={property.id} whileHover={{ x: 2 }} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-medium text-white">{property.title}</p>
                <p className="text-sm text-white/50">
                  {property.city} · {formatPrice(property.price, property.currency)}
                </p>
                <p className="mt-1 text-xs text-white/40">
                  Tour: {property.tour?.status ?? "not_started"} · Images: {property.images?.length ?? 0}
                </p>
                <a
                  href={`/properties/${property.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-xs text-teal-300 underline"
                >
                  View listing
                </a>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs capitalize text-white/70">
                {property.listing_status}
              </span>
            </div>

            {(property.listing_status === "pending_review" || property.listing_status === "under_inspection") && (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <div className="flex flex-wrap gap-3">
                  {[
                    ["images", "Images verified"],
                    ["ownership", "Ownership docs OK"],
                    ["location", "Location accurate"],
                    ["details", "Details accurate"],
                    ["tour", "3D tour quality OK"],
                    ["premium", "Mark as Premium Listing"],
                  ].map(([key, label]) => (
                    <label key={key} className="flex items-center gap-1.5 text-xs text-white/70">
                      <input
                        type="checkbox"
                        checked={Boolean(checklists[property.id]?.[key])}
                        onChange={() => toggle(property.id, key)}
                        className="h-3.5 w-3.5 accent-teal-400"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                <input
                  placeholder="Review notes"
                  value={notes[property.id] ?? ""}
                  onChange={(e) => setNotes((n) => ({ ...n, [property.id]: e.target.value }))}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => reviewMutation.mutate({ id: property.id, decision: "under_inspection" })}
                    className="rounded-full bg-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-300 hover:bg-sky-500/30"
                  >
                    Mark Under Inspection
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ id: property.id, decision: "verified" })}
                    className="rounded-full bg-emerald-500/20 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/30"
                  >
                    Verify & Publish
                  </button>
                  <button
                    onClick={() => reviewMutation.mutate({ id: property.id, decision: "rejected" })}
                    className="rounded-full bg-red-500/20 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/30"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        ))}
        {data && data.length === 0 && <p className="text-white/40">Nothing in this queue.</p>}
      </div>
    </div>
  );
}
