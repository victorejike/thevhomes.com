"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Plus, View } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { PropertyCard } from "@/components/property-card";
import { MotionLink, tapScale } from "@/components/motion-link";

const LISTING_STATUS_STYLES: Record<string, string> = {
  draft: "bg-white/10 text-white/60",
  pending_review: "bg-amber-500/20 text-amber-300",
  under_inspection: "bg-sky-500/20 text-sky-300",
  verified: "bg-emerald-500/20 text-emerald-300",
  rejected: "bg-red-500/20 text-red-300",
};

export default function MyListingsPage() {
  const { user } = useAuthStore();
  const agentId = user?.agent?.id;
  const canPublish = user?.agent?.approval_status === "approved" && Boolean(user?.agent?.agent_number);

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "mine", agentId],
    queryFn: () => api.properties.list({ agent_id: agentId, page_size: 50 }),
    enabled: !!agentId,
  });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-white">My Listings</h1>
        <MotionLink
          href="/dashboard/properties/new"
          {...tapScale}
          className="flex items-center gap-2 rounded-full bg-teal-gradient px-5 py-2.5 text-sm font-semibold text-charcoal-950"
        >
          <Plus size={16} /> New Listing
        </MotionLink>
      </div>

      {!agentId && (
        <p className="mt-8 text-white/50">
          Complete your agent profile to start listing properties.
        </p>
      )}

      {agentId && !canPublish && (
        <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-200">
          You can prepare draft listings, but they cannot be published until your{" "}
          <MotionLink href="/dashboard/agent-application" className="font-semibold underline">
            agent application is approved
          </MotionLink>
          .
        </div>
      )}

      {isLoading && <p className="mt-8 text-white/50">Loading your listings...</p>}

      {data && data.items.length === 0 && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center text-white/60">
          <Building2 size={32} className="mx-auto text-white/30" />
          <p className="mt-4">You haven&apos;t listed any properties yet.</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {data?.items.map((property, i) => (
          <div key={property.id} className="space-y-2">
            <PropertyCard property={property} index={i} />
            <div className="flex items-center justify-between px-1">
              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${
                  LISTING_STATUS_STYLES[property.listing_status ?? "draft"]
                }`}
              >
                {(property.listing_status ?? "draft").replace("_", " ")}
              </span>
              <MotionLink
                href={`/dashboard/properties/${property.id}/tour`}
                {...tapScale}
                className="flex items-center gap-1 text-xs font-medium text-teal-300 hover:text-teal-200"
              >
                <View size={13} /> Manage 3D Tour
              </MotionLink>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
