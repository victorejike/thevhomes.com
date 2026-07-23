"use client";

import { useQuery } from "@tanstack/react-query";
import { Heart } from "lucide-react";
import { api } from "@/lib/api";
import { useSavedPropertiesStore } from "@/lib/store";
import { PropertyCard } from "@/components/property-card";

export default function SavedPropertiesPage() {
  const { savedIds } = useSavedPropertiesStore();

  const { data, isLoading } = useQuery({
    queryKey: ["properties", "all-for-saved"],
    queryFn: () => api.properties.list({ page_size: 50 }),
  });

  const savedProperties = data?.items.filter((p) => savedIds.includes(p.id)) ?? [];

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-white">Saved Properties</h1>
      <p className="mt-1 text-white/50">Properties you&apos;ve bookmarked for later.</p>

      {isLoading && <p className="mt-8 text-white/50">Loading...</p>}

      {!isLoading && savedProperties.length === 0 && (
        <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center text-white/60">
          <Heart size={32} className="mx-auto text-white/30" />
          <p className="mt-4">You haven&apos;t saved any properties yet.</p>
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {savedProperties.map((property, i) => (
          <PropertyCard key={property.id} property={property} index={i} />
        ))}
      </div>
    </div>
  );
}
