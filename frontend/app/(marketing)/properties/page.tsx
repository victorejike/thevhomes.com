"use client";

import { useMemo, useState, Suspense } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { api } from "@/lib/api";
import type { PropertySearchFilters } from "@/lib/types";
import { PropertyCard } from "@/components/property-card";
import { CITIES } from "@/lib/mock-data";

const PROPERTY_TYPES = ["apartment", "villa", "duplex", "land", "office", "hotel", "shortlet"];
const PURPOSES = ["buy", "rent", "invest", "shortlet"];

function PropertiesPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters: PropertySearchFilters = useMemo(
    () => ({
      city: searchParams.get("city") ?? undefined,
      property_type: (searchParams.get("property_type") as PropertySearchFilters["property_type"]) ?? undefined,
      purpose: (searchParams.get("purpose") as PropertySearchFilters["purpose"]) ?? undefined,
      min_price: searchParams.get("min_price") ? Number(searchParams.get("min_price")) : undefined,
      max_price: searchParams.get("max_price") ? Number(searchParams.get("max_price")) : undefined,
      bedrooms: searchParams.get("bedrooms") ? Number(searchParams.get("bedrooms")) : undefined,
      q: searchParams.get("q") ?? undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      page_size: 9,
    }),
    [searchParams]
  );

  const { data, isLoading } = useQuery({
    queryKey: ["properties", filters],
    queryFn: () => api.properties.list(filters),
  });

  function updateFilter(key: string, value: string | undefined) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`/properties?${params.toString()}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    router.push(`/properties?${params.toString()}`);
  }

  const FilterPanel = (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Location
        </label>
        <select
          value={filters.city ?? ""}
          onChange={(e) => updateFilter("city", e.target.value || undefined)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
        >
          <option value="">All Locations</option>
          {CITIES.map((c) => (
            <option key={c} value={c} className="text-charcoal-900">
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Property Type
        </label>
        <select
          value={filters.property_type ?? ""}
          onChange={(e) => updateFilter("property_type", e.target.value || undefined)}
          className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
        >
          <option value="">Any Type</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type} className="text-charcoal-900">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Purpose
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PURPOSES.map((p) => (
            <motion.button
              key={p}
              onClick={() => updateFilter("purpose", filters.purpose === p ? undefined : p)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.94 }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium capitalize transition ${
                filters.purpose === p
                  ? "border-teal-400 bg-teal-gradient text-charcoal-950"
                  : "border-white/15 text-white/70 hover:border-teal-400/40"
              }`}
            >
              {p}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
          Min. Bedrooms
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <motion.button
              key={n}
              onClick={() => updateFilter("bedrooms", String(filters.bedrooms) === String(n) ? undefined : String(n))}
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.9 }}
              className={`h-9 w-9 rounded-full border text-xs font-medium transition ${
                filters.bedrooms === n
                  ? "border-teal-400 bg-teal-gradient text-charcoal-950"
                  : "border-white/15 text-white/70 hover:border-teal-400/40"
              }`}
            >
              {n}+
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Min Price
          </label>
          <input
            type="number"
            defaultValue={filters.min_price ?? ""}
            onBlur={(e) => updateFilter("min_price", e.target.value || undefined)}
            placeholder="₦0"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-white/50">
            Max Price
          </label>
          <input
            type="number"
            defaultValue={filters.max_price ?? ""}
            onBlur={(e) => updateFilter("max_price", e.target.value || undefined)}
            placeholder="Any"
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400"
          />
        </div>
      </div>

      <motion.button
        onClick={() => router.push("/properties")}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className="w-full rounded-xl border border-white/15 py-2.5 text-sm font-medium text-white/70 transition hover:border-teal-400/40 hover:text-teal-300"
      >
        Clear Filters
      </motion.button>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-400">
            Marketplace
          </span>
          <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">
            {isLoading ? "Searching..." : `${data?.total ?? 0} Properties Found`}
          </h1>
        </div>
        <motion.button
          onClick={() => setMobileFiltersOpen(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 self-start rounded-full border border-white/15 px-4 py-2 text-sm text-white lg:hidden"
        >
          <SlidersHorizontal size={15} /> Filters
        </motion.button>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-28 rounded-2xl border border-white/10 bg-white/[0.02] p-6">
            {FilterPanel}
          </div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[4/3] animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : data && data.items.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((property, i) => (
                  <PropertyCard key={property.id} property={property} index={i} />
                ))}
              </div>

              {data.total_pages > 1 && (
                <div className="mt-10 flex justify-center gap-2">
                  {Array.from({ length: data.total_pages }).map((_, i) => (
                    <motion.button
                      key={i}
                      onClick={() => goToPage(i + 1)}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      className={`h-9 w-9 rounded-full text-sm font-medium transition ${
                        data.page === i + 1
                          ? "bg-teal-gradient text-charcoal-950"
                          : "border border-white/15 text-white/70 hover:border-teal-400/40"
                      }`}
                    >
                      {i + 1}
                    </motion.button>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-16 text-center text-white/60">
              No properties match your filters yet. Try broadening your search.
            </div>
          )}
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 lg:hidden">
          <div className="h-full w-[85vw] max-w-sm overflow-y-auto bg-charcoal-950 p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-white">Filters</h2>
              <motion.button
                onClick={() => setMobileFiltersOpen(false)}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.85 }}
                className="text-white"
              >
                <X size={20} />
              </motion.button>
            </div>
            {FilterPanel}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PropertiesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <PropertiesPageInner />
    </Suspense>
  );
}
