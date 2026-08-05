"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import type { ListingQuality } from "@/lib/types";

/**
 * Listing Quality panel — the agent-facing surface of TheVHomes AI Engine's
 * completeness scorer.
 *
 * Shows the 0–100 score together with the specific outstanding items, because
 * a percentage on its own tells an agent they have a problem without telling
 * them how to fix it.
 */
export function ListingQualityPanel({ propertyId }: { propertyId: string }) {
  const [quality, setQuality] = useState<ListingQuality | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    api.properties
      .quality(propertyId)
      .then((data) => {
        if (cancelled) return;
        setQuality(data);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  if (state === "loading") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 text-sm text-white/40">
        Analysing listing…
      </div>
    );
  }

  if (state === "error" || !quality) {
    return null;
  }

  const score = quality.completeness_score;
  const tone =
    score >= 90
      ? { text: "text-teal-300", bar: "bg-teal-gradient", label: "Excellent" }
      : score >= 70
        ? { text: "text-amber-300", bar: "bg-amber-400", label: "Good" }
        : { text: "text-red-300", bar: "bg-red-400", label: "Needs work" };

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-white">
          <Sparkles size={15} className="text-teal-400" /> Listing Quality
        </h3>
        <span className={`font-display text-2xl font-semibold ${tone.text}`}>{score}%</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className={`h-full rounded-full ${tone.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className="mt-2 text-xs text-white/40">{tone.label}</p>

      {quality.suggestions.length > 0 && (
        <ul className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-xs text-white/60">
          {quality.suggestions.map((s) => (
            <li key={s} className="flex gap-2">
              <span className="text-teal-400">•</span> {s}
            </li>
          ))}
        </ul>
      )}

      {quality.moderation_status === "pending_review" && (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 p-3 text-xs text-amber-200/90">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          This listing has been referred to our moderation team for a routine check. It stays
          exactly as you left it while a member of staff reviews it.
        </p>
      )}
    </div>
  );
}
