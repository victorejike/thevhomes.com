"use client";

import { useMemo, useState, type ComponentType } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  Bath,
  BedDouble,
  Car,
  CheckCircle2,
  Maximize,
  MapPin,
  MessageCircle,
  Share2,
  ShieldCheck,
  Star,
  Waves,
} from "lucide-react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";
import type { LucideIcon } from "lucide-react";
import type { Property } from "@/lib/types";
import { formatPrice, propertyTypeLabel, purposeLabel } from "@/lib/format";
import { VerificationBadge } from "./badge";
import { useAuthStore, useSavedPropertiesStore } from "@/lib/store";
import { api } from "@/lib/api";
import { BookingModal } from "./booking-modal";

export function PropertyDetails({ property }: { property: Property }) {
  const images = property.images?.length
    ? property.images
    : [{ id: "fallback", url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200&q=80", is_primary: true }];

  const [activeImage, setActiveImage] = useState(0);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const { isSaved, toggleSaved } = useSavedPropertiesStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const mapCenter = useMemo(
    () => ({ lat: property.latitude, lng: property.longitude }),
    [property.latitude, property.longitude]
  );
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "",
  });

  const agentName = property.agent?.user?.name ?? "TheVHomes Agent";

  async function handleChatWithAgent() {
    if (!user) {
      router.push("/login");
      return;
    }
    if (!property.agent?.user_id) return;

    setChatLoading(true);
    try {
      const conversation = await api.conversations.start(property.agent.user_id, property.id);
      router.push(`/dashboard/messages?conversation=${conversation.id}`);
    } catch {
      router.push("/dashboard/messages");
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
      {/* Breadcrumb */}
      <p className="text-sm text-white/50">
        Properties / {property.city} / <span className="text-white/80">{property.title}</span>
      </p>

      {/* Gallery */}
      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-4">
        <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl lg:col-span-3">
          <Image
            src={images[activeImage].url}
            alt={property.title}
            fill
            priority
            className="object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute left-4 top-4 flex gap-2">
            <VerificationBadge status={property.verification_status} />
            <span className="rounded-full bg-charcoal-950/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">
              {purposeLabel(property.purpose)}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-4 gap-3 lg:grid-cols-1">
          {images.slice(0, 4).map((img, i) => (
            <motion.button
              key={img.id}
              onClick={() => setActiveImage(i)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${
                activeImage === i ? "border-teal-400" : "border-transparent"
              }`}
            >
              <Image src={img.url} alt="" fill className="object-cover" />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-[1fr_360px]">
        {/* Main content */}
        <div className="space-y-10">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-3xl font-semibold text-white sm:text-4xl">
                  {property.title}
                </h1>
                <p className="mt-2 flex items-center gap-1.5 text-white/60">
                  <MapPin size={16} /> {property.address}, {property.city}, {property.country}
                </p>
              </div>
              <div className="flex gap-2">
                <motion.button
                  onClick={() => toggleSaved(property.id)}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-teal-400/40"
                  aria-label="Save"
                >
                  <Star size={16} className={isSaved(property.id) ? "fill-teal-400 text-teal-400" : ""} />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.85 }}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 text-white transition hover:border-teal-400/40"
                  aria-label="Share"
                >
                  <Share2 size={16} />
                </motion.button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-6 rounded-2xl border border-white/10 bg-white/[0.02] p-5 transition hover:border-teal-400/30">
              {property.bedrooms > 0 && (
                <Stat icon={BedDouble} label="Bedrooms" value={property.bedrooms} />
              )}
              {property.bathrooms > 0 && (
                <Stat icon={Bath} label="Bathrooms" value={property.bathrooms} />
              )}
              <Stat icon={Maximize} label="Area" value={`${property.square_meters}m²`} />
              <Stat icon={ShieldCheck} label="Type" value={propertyTypeLabel(property.property_type)} />
            </div>
          </div>

          <div>
            <h2 className="font-display text-xl font-semibold text-white">Description</h2>
            <p className="mt-3 leading-relaxed text-white/70">{property.description}</p>
          </div>

          {property.amenities?.length > 0 && (
            <div>
              <h2 className="font-display text-xl font-semibold text-white">Amenities</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {property.amenities.map((amenity) => (
                  <div key={amenity} className="flex items-center gap-2 text-sm text-white/70">
                    <CheckCircle2 size={15} className="text-teal-400" />
                    {amenity}
                  </div>
                ))}
                {property.parking && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Car size={15} className="text-teal-400" /> Parking
                  </div>
                )}
                {property.swimming_pool && (
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Waves size={15} className="text-teal-400" /> Swimming Pool
                  </div>
                )}
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-xl font-semibold text-white">Location</h2>
            <div className="mt-4 h-72 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] text-sm text-white/40">
              {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? (
                isLoaded ? (
                  <GoogleMap
                    mapContainerClassName="h-full w-full"
                    center={mapCenter}
                    zoom={15}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                      fullscreenControl: false,
                      zoomControl: true,
                    }}
                  >
                    <MarkerF position={mapCenter} />
                  </GoogleMap>
                ) : (
                  <div className="flex h-full items-center justify-center px-4 text-center">
                    <p className="font-medium text-white/70">Loading map…</p>
                  </div>
                )
              ) : (
                <div className="flex h-full items-center justify-center px-4 text-center">
                  <div>
                    <p className="font-medium text-white">Map preview unavailable.</p>
                    <p className="mt-2 text-xs text-white/50">
                      Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to show the live location map.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          <div className="sticky top-28 space-y-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
            <div>
              <p className="font-display text-3xl font-semibold text-teal-300">
                {formatPrice(property.price, property.currency)}
                {property.purpose === "rent" && <span className="text-base text-white/50"> /year</span>}
                {property.purpose === "shortlet" && <span className="text-base text-white/50"> /night</span>}
              </p>
            </div>

            <motion.button
              onClick={() => setBookingOpen(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 shadow-glow transition hover:brightness-110"
            >
              Book a Viewing
            </motion.button>
            <motion.button
              onClick={handleChatWithAgent}
              disabled={chatLoading}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-white/15 py-3 text-sm font-semibold text-white transition hover:border-teal-400/40 disabled:opacity-50"
            >
              <MessageCircle size={16} /> {chatLoading ? "Connecting..." : "Chat with Agent"}
            </motion.button>

            <div className="border-t border-white/10 pt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Listed By
              </p>
              <div className="mt-3 flex items-center gap-3">
                <div className="relative h-12 w-12 overflow-hidden rounded-full bg-white/10">
                  {property.agent?.user?.avatar_url && (
                    <Image src={property.agent.user.avatar_url} alt={agentName} fill className="object-cover" />
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-1 text-sm font-medium text-white">
                    {agentName}
                    {property.agent?.verified && <ShieldCheck size={13} className="text-teal-400" />}
                  </p>
                  <p className="text-xs text-white/50">
                    {property.agent?.agency_name} · {property.agent?.experience_years ?? 0} yrs experience
                  </p>
                </div>
              </div>
              {property.agent && property.agent.reviews_count > 0 && (
                <div className="mt-3 flex items-center gap-1 text-xs text-white/60">
                  <Star size={13} className="fill-teal-400 text-teal-400" />
                  {property.agent.rating.toFixed(1)} ({property.agent.reviews_count} reviews)
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>

      {bookingOpen && (
        <BookingModal property={property} onClose={() => setBookingOpen(false)} />
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon size={18} className="text-teal-400" />
      <div>
        <p className="text-sm font-semibold text-white">{value}</p>
        <p className="text-xs text-white/50">{label}</p>
      </div>
    </div>
  );
}
