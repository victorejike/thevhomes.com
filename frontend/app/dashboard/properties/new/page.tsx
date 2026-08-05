"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { CITIES } from "@/lib/mock-data";
import {
  AMENITY_OPTIONS,
  DETAIL_FIELD_LABELS,
  MAX_IMAGES,
  MIN_IMAGES,
  PROPERTY_TYPE_SPECS,
  PURPOSE_LABELS,
  specFor,
  type DetailField,
} from "@/lib/property-schema";

const STEPS = ["Basic Info", "Location", "Details", "Amenities", "Media", "Review"] as const;

const NIGERIAN_STATES = [
  "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
  "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT", "Gombe", "Imo",
  "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos", "Nasarawa",
  "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto", "Taraba",
  "Yobe", "Zamfara",
];

const emptyForm = {
  // Basic
  title: "",
  description: "",
  property_type: "duplex",
  purpose: "buy",
  price: "",
  negotiable: false,
  // Location
  country: "Nigeria",
  state: "",
  city: CITIES[0],
  area: "",
  address: "",
  latitude: "",
  longitude: "",
  // Details
  bedrooms: "",
  bathrooms: "",
  toilets: "",
  parking_spaces: "",
  land_size: "",
  building_size: "",
  square_meters: "",
  year_built: "",
  furnished: false,
  available: true,
  // Amenities
  amenities: [] as string[],
  extra_amenities: "",
  parking: false,
  security: false,
  swimming_pool: false,
  // Media
  image_urls: "",
  cover_image_url: "",
  youtube_url: "",
  // Commercials
  is_paid_viewing: false,
  viewing_fee: "",
};

type Form = typeof emptyForm;

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(emptyForm);
  const [showErrors, setShowErrors] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const spec = specFor(form.property_type);

  function update<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  /** Switching type resets the purpose if the old one no longer applies. */
  function updatePropertyType(value: string) {
    const next = specFor(value);
    setForm((f) => ({
      ...f,
      property_type: value,
      purpose: next.purposes.includes(f.purpose as never) ? f.purpose : next.purposes[0],
    }));
  }

  function toggleAmenity(name: string) {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(name)
        ? f.amenities.filter((a) => a !== name)
        : [...f.amenities, name],
    }));
  }

  const images = useMemo(
    () =>
      form.image_urls
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean),
    [form.image_urls]
  );

  const allAmenities = useMemo(
    () => [
      ...form.amenities,
      ...form.extra_amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ],
    [form.amenities, form.extra_amenities]
  );

  /**
   * Per-step validation. Every message is written to tell the agent exactly
   * what to do, not just that something is wrong — the listing cannot be
   * submitted until all of these clear.
   */
  const stepErrors = useMemo<string[][]>(() => {
    const basic: string[] = [];
    if (form.title.trim().length < 10)
      basic.push("Give the listing a descriptive title of at least 10 characters.");
    if (form.description.trim().length < 50)
      basic.push("Write a description of at least 50 characters so buyers know what they're viewing.");
    if (!(Number(form.price) > 0)) basic.push("Enter the asking price in Naira.");

    const location: string[] = [];
    if (!form.state) location.push("Select the state the property is in.");
    if (!form.city.trim()) location.push("Select or enter the city.");
    if (!form.area.trim()) location.push("Enter the area or neighbourhood (e.g. Maitama, Lekki Phase 1).");
    if (form.address.trim().length < 5) location.push("Enter the street address.");
    if (!Number(form.latitude) || !Number(form.longitude))
      location.push("Enter both latitude and longitude so the property appears on the map.");

    const details: string[] = [];
    for (const field of spec.required) {
      if (field === "furnished") continue; // boolean — always has a value
      if (!(Number(form[field] as string) > 0))
        details.push(`${DETAIL_FIELD_LABELS[field]} is required for a ${spec.label.toLowerCase()}.`);
    }

    const amenities: string[] = [];
    if (allAmenities.length === 0) amenities.push("Select at least one amenity.");

    const media: string[] = [];
    if (images.length < MIN_IMAGES)
      media.push(`Add at least ${MIN_IMAGES} photos — you currently have ${images.length}.`);
    if (images.length > MAX_IMAGES) media.push(`Remove some photos — the maximum is ${MAX_IMAGES}.`);
    if (new Set(images.map((u) => u.toLowerCase())).size !== images.length)
      media.push("The same photo appears more than once. Every image must be unique.");
    if (!form.cover_image_url.trim() && images.length === 0)
      media.push("Choose a cover photo.");
    if (form.cover_image_url.trim() && !images.includes(form.cover_image_url.trim()))
      media.push("The cover photo must be one of the images above.");
    if (form.youtube_url.trim() && !extractYouTubeID(form.youtube_url))
      media.push(
        "That doesn't look like a YouTube link. Upload your video tour to YouTube, then paste the link (e.g. https://youtu.be/xxxxxxxxxxx)."
      );
    if (form.is_paid_viewing && !(Number(form.viewing_fee) > 0))
      media.push("Enter the viewing fee for paid Professional Property Viewing.");

    return [basic, location, details, amenities, media, []];
  }, [form, spec, images, allAmenities]);

  const blockingErrors = stepErrors.flat();
  const currentErrors = stepErrors[step] ?? [];

  function goNext() {
    if (currentErrors.length > 0) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  function goBack() {
    setShowErrors(false);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (blockingErrors.length > 0) {
      setShowErrors(true);
      return;
    }
    setStatus("loading");
    try {
      const property = await api.properties.create({
        title: form.title.trim(),
        description: form.description.trim(),
        price: Number(form.price),
        negotiable: form.negotiable,
        country: form.country,
        state: form.state,
        city: form.city.trim(),
        area: form.area.trim(),
        address: form.address.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        property_type: form.property_type,
        purpose: form.purpose,
        bedrooms: Number(form.bedrooms) || 0,
        bathrooms: Number(form.bathrooms) || 0,
        toilets: Number(form.toilets) || 0,
        parking_spaces: Number(form.parking_spaces) || 0,
        land_size: Number(form.land_size) || 0,
        building_size: Number(form.building_size) || 0,
        square_meters: Number(form.square_meters) || Number(form.building_size) || 0,
        year_built: Number(form.year_built) || 0,
        furnished: form.furnished,
        available: form.available,
        parking: form.parking || Number(form.parking_spaces) > 0,
        security: form.security,
        swimming_pool: form.swimming_pool,
        amenities: allAmenities,
        image_urls: images,
        cover_image_url: form.cover_image_url.trim() || images[0],
        youtube_url: form.youtube_url.trim(),
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
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl font-semibold text-white">List a New Property</h1>
      <p className="mt-1 text-white/50">
        Complete every section below. After creating the listing, you&apos;ll capture a required 3D
        tour, then submit it for admin review before it goes live.
      </p>

      {/* Step indicator */}
      <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-3">
        {STEPS.map((label, i) => {
          const done = i < step && (stepErrors[i] ?? []).length === 0;
          const active = i === step;
          return (
            <li key={label} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => i <= step && setStep(i)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "border-teal-400/50 bg-teal-400/10 text-teal-300"
                    : done
                      ? "border-white/10 bg-white/[0.02] text-white/60 hover:text-white"
                      : "border-white/10 text-white/30"
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/10 text-[10px]">
                  {done ? <Check size={10} /> : i + 1}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={12} className="text-white/20" />}
            </li>
          );
        })}
      </ol>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        {step === 0 && (
          <>
            <Field label="Property Type" hint="Only the fields relevant to this type will be shown.">
              <select
                value={form.property_type}
                onChange={(e) => updatePropertyType(e.target.value)}
                className={inputClass}
              >
                {PROPERTY_TYPE_SPECS.map((t) => (
                  <option key={t.value} value={t.value} className="text-charcoal-900">
                    {t.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Listing Purpose">
              <select
                value={form.purpose}
                onChange={(e) => update("purpose", e.target.value)}
                className={inputClass}
              >
                {spec.purposes.map((p) => (
                  <option key={p} value={p} className="text-charcoal-900">
                    {PURPOSE_LABELS[p]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Title">
              <input
                value={form.title}
                onChange={(e) => update("title", e.target.value)}
                placeholder="4 Bedroom Terraced Duplex with BQ, Guzape"
                className={inputClass}
              />
            </Field>

            <Field label="Description" hint={`${form.description.trim().length} / 50 characters minimum`}>
              <textarea
                rows={6}
                value={form.description}
                onChange={(e) => update("description", e.target.value)}
                placeholder="Describe the property, the finishing, the estate, and what makes it stand out."
                className={`${inputClass} resize-none`}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Price (NGN)">
                <input
                  type="number"
                  min={0}
                  value={form.price}
                  onChange={(e) => update("price", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <div className="flex items-end pb-2.5">
                <Checkbox
                  label="Price is negotiable"
                  checked={form.negotiable}
                  onChange={(v) => update("negotiable", v)}
                />
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Country">
                <input
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="State">
                <select
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className={inputClass}
                >
                  <option value="" className="text-charcoal-900">
                    Select a state
                  </option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s} className="text-charcoal-900">
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="City">
                <input
                  list="thevhomes-cities"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                  className={inputClass}
                />
                <datalist id="thevhomes-cities">
                  {CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </Field>
              <Field label="Area / Neighbourhood">
                <input
                  value={form.area}
                  onChange={(e) => update("area", e.target.value)}
                  placeholder="Maitama, Lekki Phase 1, GRA…"
                  className={inputClass}
                />
              </Field>
            </div>

            <Field label="Street Address">
              <input
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                className={inputClass}
              />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Latitude">
                <input
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
                  type="number"
                  step="any"
                  value={form.longitude}
                  onChange={(e) => update("longitude", e.target.value)}
                  placeholder="7.3986"
                  className={inputClass}
                />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-white/50">
              Showing the details that apply to a{" "}
              <span className="text-teal-300">{spec.label.toLowerCase()}</span>.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {spec.fields
                .filter((f) => f !== "furnished")
                .map((field) => (
                  <Field
                    key={field}
                    label={DETAIL_FIELD_LABELS[field]}
                    hint={spec.required.includes(field) ? "Required" : undefined}
                  >
                    <input
                      type="number"
                      min={0}
                      value={form[field] as string}
                      onChange={(e) => update(field as keyof Form, e.target.value as never)}
                      className={inputClass}
                    />
                  </Field>
                ))}
            </div>

            <div className="flex flex-wrap gap-5 pt-2">
              {spec.fields.includes("furnished") && (
                <Checkbox
                  label="Furnished"
                  checked={form.furnished}
                  onChange={(v) => update("furnished", v)}
                />
              )}
              <Checkbox
                label="Available now"
                checked={form.available}
                onChange={(v) => update("available", v)}
              />
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <Field label="Amenities" hint="Select everything this property offers.">
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {AMENITY_OPTIONS.map((a) => {
                  const checked = form.amenities.includes(a);
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                        checked
                          ? "border-teal-400/50 bg-teal-400/10 text-teal-300"
                          : "border-white/10 bg-white/[0.02] text-white/60 hover:border-white/20"
                      }`}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Other amenities (comma separated)">
              <input
                value={form.extra_amenities}
                onChange={(e) => update("extra_amenities", e.target.value)}
                placeholder="Home cinema, Solar inverter…"
                className={inputClass}
              />
            </Field>

            <div className="flex flex-wrap gap-5 pt-1">
              <Checkbox label="Secure estate" checked={form.security} onChange={(v) => update("security", v)} />
              <Checkbox
                label="Swimming pool"
                checked={form.swimming_pool}
                onChange={(v) => update("swimming_pool", v)}
              />
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <Field
              label="Photo URLs"
              hint={`One per line. ${MIN_IMAGES}–${MAX_IMAGES} photos, no duplicates. You have ${images.length}.`}
            >
              <textarea
                rows={6}
                value={form.image_urls}
                onChange={(e) => update("image_urls", e.target.value)}
                placeholder={"https://…/living-room.jpg\nhttps://…/kitchen.jpg"}
                className={`${inputClass} resize-none font-mono text-xs`}
              />
            </Field>

            {images.length > 0 && (
              <Field label="Cover Photo" hint="This is the image shown in search results.">
                <select
                  value={form.cover_image_url || images[0]}
                  onChange={(e) => update("cover_image_url", e.target.value)}
                  className={inputClass}
                >
                  {images.map((url, i) => (
                    <option key={url + i} value={url} className="text-charcoal-900">
                      Photo {i + 1} — {url.slice(0, 60)}
                    </option>
                  ))}
                </select>
              </Field>
            )}

            <Field
              label="YouTube Video Tour (optional)"
              hint="Upload your video to YouTube first, then paste the link here. Visitors watch it embedded on the property page — they are never sent to YouTube."
            >
              <input
                value={form.youtube_url}
                onChange={(e) => update("youtube_url", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=…"
                className={inputClass}
              />
            </Field>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <Checkbox
                label="This is a paid Professional Property Viewing service"
                checked={form.is_paid_viewing}
                onChange={(v) => update("is_paid_viewing", v)}
              />
              {form.is_paid_viewing && (
                <div className="mt-3">
                  <Field label="Viewing Fee (NGN)">
                    <input
                      type="number"
                      min={0}
                      value={form.viewing_fee}
                      onChange={(e) => update("viewing_fee", e.target.value)}
                      className={inputClass}
                    />
                  </Field>
                </div>
              )}
            </div>
          </>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
              <h2 className="font-display text-lg font-semibold text-white">{form.title}</h2>
              <p className="mt-1 text-sm text-teal-300">
                {spec.label} · {PURPOSE_LABELS[form.purpose]} · ₦
                {Number(form.price).toLocaleString()}
                {form.negotiable && " (negotiable)"}
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                <Summary label="Location" value={`${form.area}, ${form.city}, ${form.state}`} />
                {spec.fields
                  .filter((f) => f !== "furnished" && Number(form[f] as string) > 0)
                  .map((f) => (
                    <Summary
                      key={f}
                      label={DETAIL_FIELD_LABELS[f]}
                      value={String(form[f as keyof Form])}
                    />
                  ))}
                <Summary label="Amenities" value={`${allAmenities.length} selected`} />
                <Summary label="Photos" value={`${images.length} uploaded`} />
                <Summary
                  label="Video Tour"
                  value={form.youtube_url.trim() ? "YouTube linked" : "Not added"}
                />
              </dl>
            </div>

            {blockingErrors.length > 0 ? (
              <ErrorList
                title="Resolve these before submitting"
                errors={blockingErrors}
              />
            ) : (
              <p className="flex items-center gap-2 text-sm text-teal-300">
                <Check size={15} /> Everything required is complete.
              </p>
            )}

            {status === "error" && <p className="text-sm text-red-400">{errorMessage}</p>}
          </div>
        )}

        {showErrors && currentErrors.length > 0 && step < 5 && (
          <ErrorList title="Complete this section to continue" errors={currentErrors} />
        )}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 0}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-4 py-2.5 text-sm text-white/70 transition hover:border-white/20 disabled:opacity-30"
          >
            <ChevronLeft size={15} /> Back
          </button>

          {step < STEPS.length - 1 ? (
            <motion.button
              type="button"
              onClick={goNext}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-teal-gradient px-6 py-2.5 text-sm font-semibold text-charcoal-950 shadow-glow"
            >
              Continue <ChevronRight size={15} />
            </motion.button>
          ) : (
            <motion.button
              type="submit"
              disabled={status === "loading" || blockingErrors.length > 0}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="rounded-full bg-teal-gradient px-6 py-2.5 text-sm font-semibold text-charcoal-950 shadow-glow disabled:opacity-40"
            >
              {status === "loading" ? "Creating…" : "Create Listing & Continue to 3D Tour"}
            </motion.button>
          )}
        </div>
      </form>
    </div>
  );
}

/** Mirrors backend utils.ExtractYouTubeID so agents get instant feedback. */
function extractYouTubeID(raw: string): string | null {
  const value = raw.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(value)) return value;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.replace(/^\/|\/$/g, "");
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
    }
    if (["youtube.com", "m.youtube.com", "youtube-nocookie.com", "music.youtube.com"].includes(host)) {
      const v = url.searchParams.get("v");
      if (v) return /^[A-Za-z0-9_-]{11}$/.test(v) ? v : null;
      const [prefix, id] = url.pathname.replace(/^\/|\/$/g, "").split("/");
      if (["embed", "shorts", "live", "v"].includes(prefix) && /^[A-Za-z0-9_-]{11}$/.test(id ?? ""))
        return id;
    }
    return null;
  } catch {
    return null;
  }
}

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-teal-400";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-white/50">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-white/30">{hint}</p>}
    </div>
  );
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-white/70">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-white/20 bg-white/10 accent-teal-400"
      />
      {label}
    </label>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-white/30">{label}</dt>
      <dd className="mt-0.5 text-white/80">{value}</dd>
    </div>
  );
}

function ErrorList({ title, errors }: { title: string; errors: string[] }) {
  return (
    <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-red-300">
        <AlertCircle size={15} /> {title}
      </p>
      <ul className="mt-2 space-y-1 text-xs text-red-200/80">
        {errors.map((e) => (
          <li key={e}>• {e}</li>
        ))}
      </ul>
    </div>
  );
}
