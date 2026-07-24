"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { CITIES } from "@/lib/mock-data";

const PROPERTY_TYPES = ["apartment", "villa", "duplex", "land", "office", "hotel", "shortlet"];
const PURPOSES = ["buy", "rent", "invest", "shortlet"];

export default function NewListingPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    description: "",
    price: "",
    city: CITIES[0],
    address: "",
    latitude: "",
    longitude: "",
    property_type: "apartment",
    purpose: "buy",
    bedrooms: "",
    bathrooms: "",
    square_meters: "",
    furnished: false,
    parking: false,
    security: false,
    swimming_pool: false,
    amenities: "",
    image_urls: "",
    cover_image_url: "",
    is_paid_viewing: false,
    viewing_fee: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const property = await api.properties.create({
        title: form.title,
        description: form.description,
        price: Number(form.price),
        city: form.city,
        address: form.address,
        latitude: Number(form.latitude) || 0,
        longitude: Number(form.longitude) || 0,
        property_type: form.property_type,
        purpose: form.purpose,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        square_meters: Number(form.square_meters) || 0,
        furnished: form.furnished,
        parking: form.parking,
        security: form.security,
        swimming_pool: form.swimming_pool,
        amenities: form.amenities
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        image_urls: form.image_urls
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        cover_image_url: form.cover_image_url,
        is_paid_viewing: form.is_paid_viewing,
        viewing_fee: Number(form.viewing_fee) || 0,
      });
      router.push(`/dashboard/properties/${property.id}/tour`);
    } catch (err) {
      setStatus("error");
      setErrorMessage(err instanceof ApiError ? err.message : "Failed to create listing.");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-white">List a New Property</h1>
      <p className="mt-1 text-white/50">
        Fill in the details below. After creating the listing, you&apos;ll capture a required 3D
        tour, then submit it for admin review before it goes live.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Title">
          <input
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Description">
          <textarea
            required
            rows={4}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            className={`${inputClass} resize-none`}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (NGN)">
            <input
              required
              type="number"
              value={form.price}
              onChange={(e) => update("price", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="City">
            <select value={form.city} onChange={(e) => update("city", e.target.value)} className={inputClass}>
              {CITIES.map((c) => (
                <option key={c} value={c} className="text-charcoal-900">
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Address">
          <input
            required
            value={form.address}
            onChange={(e) => update("address", e.target.value)}
            className={inputClass}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude">
            <input
              required
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => update("latitude", e.target.value)}
              placeholder="9.0765"
              className={inputClass}
            />
          </Field>
          <Field label="Longitude">
            <input
              required
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => update("longitude", e.target.value)}
              placeholder="7.3986"
              className={inputClass}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Property Type">
            <select
              value={form.property_type}
              onChange={(e) => update("property_type", e.target.value)}
              className={inputClass}
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t} value={t} className="text-charcoal-900">
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Purpose">
            <select value={form.purpose} onChange={(e) => update("purpose", e.target.value)} className={inputClass}>
              {PURPOSES.map((p) => (
                <option key={p} value={p} className="text-charcoal-900">
                  {p}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Field label="Bedrooms">
            <input
              type="number"
              value={form.bedrooms}
              onChange={(e) => update("bedrooms", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Bathrooms">
            <input
              type="number"
              value={form.bathrooms}
              onChange={(e) => update("bathrooms", e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Sq. Meters">
            <input
              type="number"
              value={form.square_meters}
              onChange={(e) => update("square_meters", e.target.value)}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="flex flex-wrap gap-4">
          {(["furnished", "parking", "security", "swimming_pool"] as const).map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm capitalize text-white/70">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => update(key, e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/10 accent-teal-400"
              />
              {key.replace("_", " ")}
            </label>
          ))}
        </div>

        <Field label="Amenities (comma separated, required)">
          <input
            required
            value={form.amenities}
            onChange={(e) => update("amenities", e.target.value)}
            placeholder="Gym, Pool, 24/7 Power, Smart Home"
            className={inputClass}
          />
        </Field>

        <Field label="Image URLs (comma separated, at least one required)">
          <input
            required
            value={form.image_urls}
            onChange={(e) => update("image_urls", e.target.value)}
            placeholder="https://... , https://..."
            className={inputClass}
          />
        </Field>

        <Field label="Cover Photo URL (optional — defaults to first image above)">
          <input
            value={form.cover_image_url}
            onChange={(e) => update("cover_image_url", e.target.value)}
            placeholder="https://..."
            className={inputClass}
          />
        </Field>

        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
          <label className="flex items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={form.is_paid_viewing}
              onChange={(e) => update("is_paid_viewing", e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/10 accent-teal-400"
            />
            This is a paid Professional Property Viewing service
          </label>
          {form.is_paid_viewing && (
            <div className="mt-3">
              <Field label="Viewing Fee (NGN)">
                <input
                  type="number"
                  value={form.viewing_fee}
                  onChange={(e) => update("viewing_fee", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          )}
        </div>

        {status === "error" && <p className="text-sm text-red-400">{errorMessage}</p>}

        <motion.button
          type="submit"
          disabled={status === "loading"}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="w-full rounded-full bg-teal-gradient py-3 text-sm font-semibold text-charcoal-950 disabled:opacity-50"
        >
          {status === "loading" ? "Creating..." : "Create Listing & Continue to 3D Tour"}
        </motion.button>
      </form>
    </div>
  );
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-white/50">{label}</label>
      {children}
    </div>
  );
}
