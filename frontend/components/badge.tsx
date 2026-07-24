import { cn } from "@/lib/utils";
import { Award, BadgeCheck, Home, ShieldCheck, Sparkles } from "lucide-react";
import type { VerificationStatus } from "@/lib/types";

export function VerificationBadge({ status }: { status: VerificationStatus }) {
  if (status === "pending") return null;

  const isPremium = status === "premium_verified";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur",
        isPremium
          ? "bg-teal-gradient text-charcoal-950"
          : "bg-emerald-500/90 text-white"
      )}
    >
      {isPremium ? <ShieldCheck size={12} /> : <BadgeCheck size={12} />}
      {isPremium ? "Premium Verified" : "Verified"}
    </span>
  );
}

/**
 * Trust badge primitives used across search results, property pages, and
 * agent profiles: ✅ Identity Verified · 🏅 Verified Agent · 🏠 Verified
 * Property · ⭐ Premium Listing.
 */
export function IdentityVerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300",
        className
      )}
    >
      <BadgeCheck size={12} /> Identity Verified
    </span>
  );
}

export function VerifiedAgentBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-teal-500/15 px-2.5 py-1 text-[11px] font-semibold text-teal-300",
        className
      )}
    >
      <Award size={12} /> Verified Agent
    </span>
  );
}

export function VerifiedPropertyBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-300",
        className
      )}
    >
      <Home size={12} /> Verified Property
    </span>
  );
}

export function PremiumListingBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300",
        className
      )}
    >
      <Sparkles size={12} /> Premium Listing
    </span>
  );
}

export function AgentNumberBadge({ agentNumber, className }: { agentNumber: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 text-[11px] font-medium text-white/70",
        className
      )}
    >
      ID: {agentNumber}
    </span>
  );
}
