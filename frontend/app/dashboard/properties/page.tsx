"use client";

import { useQuery } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store";
import { PropertyCard } from "@/components/property-card";
import { MotionLink, tapScale } from "@/components/motion-link";

export default function MyListingsPage() {
  const { user } = useAuthStore();
  const agentId = user?.agent?.id;

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

      {isLoading && <p className="mt-8 text-white/50">Loading your listings...</p>}

      {data && data.items.length === 0 && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center text-white/60">
          <Building2 size={32} className="mx-auto text-white/30" />
          <p className="mt-4">You haven&apos;t listed any properties yet.</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {data?.items.map((property, i) => (
          <PropertyCard key={property.id} property={property} index={i} />
        ))}
      </div>
    </div>
  );
}
