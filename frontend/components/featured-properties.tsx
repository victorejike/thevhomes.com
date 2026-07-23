"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight } from "lucide-react";
import { api } from "@/lib/api";
import { PropertyCard } from "./property-card";
import { MotionLink } from "./motion-link";

export function FeaturedProperties() {
  const { data, isLoading } = useQuery({
    queryKey: ["properties", "featured"],
    queryFn: () => api.properties.list({ page: 1, page_size: 6 }),
  });

  return (
    <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
            Curated Selection
          </span>
          <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-4xl">
            Featured Properties
          </h2>
        </div>
        <MotionLink
          href="/properties"
          whileHover={{ scale: 1.05, x: 2 }}
          whileTap={{ scale: 0.97 }}
          className="group flex items-center gap-1.5 text-sm font-semibold text-teal-300 transition hover:text-teal-200"
        >
          View all properties
          <ArrowUpRight size={16} className="transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </MotionLink>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[4/3] animate-pulse rounded-2xl bg-white/5"
              />
            ))
          : data?.items.map((property, i) => (
              <PropertyCard key={property.id} property={property} index={i} />
            ))}
      </div>
    </section>
  );
}
