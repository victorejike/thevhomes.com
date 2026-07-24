"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { BedDouble, Bath, Heart, Maximize, MapPin, View } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatPrice, propertyTypeLabel, purposeLabel } from "@/lib/format";
import { VerificationBadge, VerifiedPropertyBadge } from "./badge";
import { useSavedPropertiesStore } from "@/lib/store";

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80";
const SLIDE_INTERVAL_MS = 3000;

export function PropertyCard({ property, index = 0 }: { property: Property; index?: number }) {
  const images =
    property.images && property.images.length > 0
      ? property.images
      : [{ id: "fallback", url: FALLBACK_IMAGE, is_primary: true }];

  const [activeImage, setActiveImage] = useState(0);
  const [paused, setPaused] = useState(false);
  const { isSaved, toggleSaved } = useSavedPropertiesStore();
  const saved = isSaved(property.id);

  useEffect(() => {
    if (images.length <= 1 || paused) return;
    const interval = setInterval(() => {
      setActiveImage((prev) => (prev + 1) % images.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [images.length, paused]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      whileHover={{ y: -8, scale: 1.015 }}
      className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg transition hover:shadow-glow"
    >
      <Link href={`/properties/${property.slug}`} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <AnimatePresence mode="sync">
            <motion.div
              key={images[activeImage].id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <Image
                src={images[activeImage].url}
                alt={property.title}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover transition duration-700 group-hover:scale-110"
              />
            </motion.div>
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

          {images.length > 1 && (
            <div className="absolute bottom-14 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
              {images.map((img, i) => (
                <span
                  key={img.id}
                  className={`h-1.5 rounded-full transition-all ${
                    i === activeImage ? "w-4 bg-white" : "w-1.5 bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}

          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
            <VerificationBadge status={property.verification_status} />
            {property.listing_status === "verified" && <VerifiedPropertyBadge />}
            <span className="rounded-full bg-charcoal-950/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
              {purposeLabel(property.purpose)}
            </span>
            {property.tour?.status === "ready" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-charcoal-950/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
                <View size={12} /> 3D Tour
              </span>
            )}
          </div>

          <motion.button
            onClick={(e) => {
              e.preventDefault();
              toggleSaved(property.id);
            }}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.8 }}
            aria-label="Save property"
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-charcoal-950/60 text-white backdrop-blur transition hover:bg-charcoal-950/90"
          >
            <Heart size={15} className={saved ? "fill-teal-400 text-teal-400" : ""} />
          </motion.button>

          <div className="absolute bottom-3 left-3 z-10 rounded-full bg-charcoal-950/70 px-3 py-1 text-sm font-semibold text-teal-300 backdrop-blur">
            {formatPrice(property.price, property.currency)}
            {property.purpose === "rent" && <span className="text-white/60"> /yr</span>}
            {property.purpose === "shortlet" && <span className="text-white/60"> /night</span>}
          </div>
        </div>

        <div className="space-y-3 p-4">
          <div>
            <h3 className="line-clamp-1 font-display text-lg font-semibold text-white">
              {property.title}
            </h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/50">
              <MapPin size={13} />
              {property.city}, {property.country}
            </p>
          </div>

          <div className="flex items-center gap-4 text-sm text-white/70">
            {property.bedrooms > 0 && (
              <span className="flex items-center gap-1">
                <BedDouble size={15} /> {property.bedrooms}
              </span>
            )}
            {property.bathrooms > 0 && (
              <span className="flex items-center gap-1">
                <Bath size={15} /> {property.bathrooms}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Maximize size={15} /> {property.square_meters}m²
            </span>
            <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-xs text-white/60">
              {propertyTypeLabel(property.property_type)}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
