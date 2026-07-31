"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { CITIES } from "@/lib/mock-data";
import { useLocaleStore } from "@/lib/store";
import { t } from "@/lib/i18n";

export function SearchBar() {
  const router = useRouter();
  const { locale } = useLocaleStore();
  const [city, setCity] = useState("");
  const [propertyType, setPropertyType] = useState("");
  const [purpose, setPurpose] = useState("");
  const [query, setQuery] = useState("");

  function handleSearch() {
    const params = new URLSearchParams();
    if (city) params.set("city", city);
    if (propertyType) params.set("property_type", propertyType);
    if (purpose) params.set("purpose", purpose);
    if (query) params.set("q", query);
    router.push(`/properties?${params.toString()}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 rounded-3xl border border-white/15 bg-white/10 p-3 shadow-2xl backdrop-blur-xl sm:flex-row sm:items-center sm:rounded-full sm:p-2">
      <div className="flex flex-1 items-center gap-2 rounded-full bg-white/10 px-4 py-2.5 sm:bg-transparent">
        <Search size={16} className="shrink-0 text-white/60" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder={t(locale, "search_placeholder")}
          className="w-full bg-transparent text-sm text-white placeholder:text-white/50 focus:outline-none"
        />
      </div>

      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        aria-label="Location"
        className="rounded-full border border-white/10 bg-charcoal-900/80 px-4 py-2.5 text-sm text-white focus:outline-none sm:border-0 sm:bg-transparent"
      >
        <option value="">All Locations</option>
        {CITIES.map((c) => (
          <option key={c} value={c} className="text-charcoal-900">
            {c}
          </option>
        ))}
      </select>

      <select
        value={propertyType}
        onChange={(e) => setPropertyType(e.target.value)}
        aria-label="Property type"
        className="rounded-full border border-white/10 bg-charcoal-900/80 px-4 py-2.5 text-sm text-white focus:outline-none sm:border-0 sm:bg-transparent"
      >
        <option value="">Any Type</option>
        {["apartment", "villa", "duplex", "land", "office", "hotel", "shortlet"].map(
          (type) => (
            <option key={type} value={type} className="text-charcoal-900">
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </option>
          )
        )}
      </select>

      <select
        value={purpose}
        onChange={(e) => setPurpose(e.target.value)}
        aria-label="Purpose"
        className="rounded-full border border-white/10 bg-charcoal-900/80 px-4 py-2.5 text-sm text-white focus:outline-none sm:border-0 sm:bg-transparent"
      >
        <option value="">Any Purpose</option>
        <option value="buy" className="text-charcoal-900">Buy</option>
        <option value="rent" className="text-charcoal-900">Rent</option>
        <option value="invest" className="text-charcoal-900">Invest</option>
        <option value="shortlet" className="text-charcoal-900">Shortlet</option>
      </select>

      <motion.button
        onClick={handleSearch}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className="w-full shrink-0 rounded-full bg-teal-gradient px-6 py-2.5 text-sm font-semibold text-charcoal-950 transition hover:brightness-110 sm:w-auto"
      >
        Search
      </motion.button>
    </div>
  );
}
