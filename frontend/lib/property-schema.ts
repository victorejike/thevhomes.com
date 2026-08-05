import type { PropertyType } from "./types";

/**
 * Phase 4 property publishing schema.
 *
 * Each property type shows only the detail fields that actually apply to it —
 * a plot of land has no bedrooms, a warehouse has no toilets-per-bedroom, and
 * an event centre is sized by capacity rather than by bedroom count. The same
 * table drives both which inputs render and which of them are mandatory before
 * a listing can be submitted, so the form and the validator can never drift
 * apart.
 */

/** Every detail field the publishing form knows how to render. */
export type DetailField =
  | "bedrooms"
  | "bathrooms"
  | "toilets"
  | "parking_spaces"
  | "land_size"
  | "building_size"
  | "square_meters"
  | "year_built"
  | "furnished";

export const DETAIL_FIELD_LABELS: Record<DetailField, string> = {
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  toilets: "Toilets",
  parking_spaces: "Parking Spaces",
  land_size: "Land Size (sqm)",
  building_size: "Building Size (sqm)",
  square_meters: "Total Area (sqm)",
  year_built: "Year Built",
  furnished: "Furnished",
};

export interface PropertyTypeSpec {
  value: PropertyType;
  /** Agent-facing name, matching the categories used across the site. */
  label: string;
  /** Purposes this type can be listed under; the first is the default. */
  purposes: Array<"buy" | "rent" | "invest" | "shortlet">;
  /** Detail fields shown for this type, in display order. */
  fields: DetailField[];
  /** Subset of `fields` that must be filled before submission. */
  required: DetailField[];
}

const RESIDENTIAL: DetailField[] = [
  "bedrooms",
  "bathrooms",
  "toilets",
  "parking_spaces",
  "building_size",
  "land_size",
  "year_built",
  "furnished",
];

export const PROPERTY_TYPE_SPECS: PropertyTypeSpec[] = [
  {
    value: "duplex",
    label: "House for Sale",
    purposes: ["buy", "invest"],
    fields: RESIDENTIAL,
    required: ["bedrooms", "bathrooms", "toilets", "building_size"],
  },
  {
    value: "villa",
    label: "House for Rent",
    purposes: ["rent"],
    fields: RESIDENTIAL,
    required: ["bedrooms", "bathrooms", "toilets", "building_size"],
  },
  {
    value: "apartment",
    label: "Apartment",
    purposes: ["rent", "buy", "invest"],
    fields: [
      "bedrooms",
      "bathrooms",
      "toilets",
      "parking_spaces",
      "building_size",
      "year_built",
      "furnished",
    ],
    required: ["bedrooms", "bathrooms", "toilets", "building_size"],
  },
  {
    value: "shortlet",
    label: "Shortlet",
    purposes: ["shortlet"],
    fields: ["bedrooms", "bathrooms", "toilets", "parking_spaces", "building_size", "furnished"],
    required: ["bedrooms", "bathrooms", "toilets", "furnished"],
  },
  {
    value: "hotel",
    label: "Hotel",
    purposes: ["shortlet", "invest"],
    fields: ["bedrooms", "bathrooms", "parking_spaces", "building_size", "year_built", "furnished"],
    // "bedrooms" reads as room count for a hotel listing.
    required: ["bedrooms", "bathrooms"],
  },
  {
    value: "commercial",
    label: "Commercial Property",
    purposes: ["buy", "rent", "invest"],
    fields: ["building_size", "land_size", "parking_spaces", "toilets", "year_built"],
    required: ["building_size"],
  },
  {
    value: "land",
    label: "Land",
    purposes: ["buy", "invest"],
    fields: ["land_size"],
    required: ["land_size"],
  },
  {
    value: "office",
    label: "Office Space",
    purposes: ["rent", "buy", "invest"],
    fields: ["building_size", "parking_spaces", "toilets", "year_built", "furnished"],
    required: ["building_size"],
  },
  {
    value: "warehouse",
    label: "Warehouse",
    purposes: ["rent", "buy", "invest"],
    fields: ["building_size", "land_size", "parking_spaces", "year_built"],
    required: ["building_size"],
  },
  {
    value: "event_center",
    label: "Event Centre",
    purposes: ["rent", "buy", "invest"],
    fields: ["building_size", "parking_spaces", "toilets", "year_built"],
    required: ["building_size"],
  },
];

export function specFor(type: string): PropertyTypeSpec {
  return PROPERTY_TYPE_SPECS.find((s) => s.value === type) ?? PROPERTY_TYPE_SPECS[0];
}

export const PURPOSE_LABELS: Record<string, string> = {
  buy: "For Sale",
  rent: "For Rent",
  invest: "Investment",
  shortlet: "Shortlet",
};

/** Image count bounds enforced on the publishing form. */
export const MIN_IMAGES = 4;
export const MAX_IMAGES = 25;

/**
 * Amenities offered as checkboxes, grouped the way agents think about them.
 * Agents can still type extras; these just remove the guesswork.
 */
export const AMENITY_OPTIONS = [
  "24/7 Electricity",
  "Borehole / Water Supply",
  "Security / Gatehouse",
  "CCTV",
  "Swimming Pool",
  "Gym",
  "Elevator",
  "Air Conditioning",
  "Fitted Kitchen",
  "Balcony",
  "Garden",
  "Boys Quarters",
  "Estate Facility",
  "Parking Space",
  "Furnished",
  "WiFi",
];
