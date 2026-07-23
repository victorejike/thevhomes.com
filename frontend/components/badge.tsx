import { cn } from "@/lib/utils";
import { BadgeCheck, ShieldCheck } from "lucide-react";
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
