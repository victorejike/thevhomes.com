import type { Metadata } from "next";
import type { Property } from "./types";

/**
 * SEO helpers for property detail pages.
 *
 * Both functions run server-side (from `generateMetadata` and the page body),
 * so every tag and the JSON-LD block are present in the initial HTML. Crawlers
 * and social-preview scrapers never execute our JS, so anything generated
 * client-side would be invisible to them.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? "https://thevhomes.com";

export function propertyURL(property: Property): string {
  return `${SITE_URL}/properties/${property.slug || property.id}`;
}

/** Auto-generated meta title: descriptive, keyworded, under ~60 characters. */
export function propertyMetaTitle(property: Property): string {
  const bits: string[] = [];
  if (property.bedrooms > 0) bits.push(`${property.bedrooms} Bedroom`);
  bits.push(readableType(property.property_type));
  bits.push(purposePhrase(property.purpose));
  bits.push(`in ${property.city}`);
  return `${bits.join(" ")} | TheVHomes`;
}

/** Auto-generated meta description, capped at the ~155 chars Google renders. */
export function propertyMetaDescription(property: Property): string {
  const base = property.description?.trim();
  if (base && base.length >= 60) return truncate(base, 155);

  const facts: string[] = [];
  if (property.bedrooms > 0) facts.push(`${property.bedrooms} bedrooms`);
  if (property.bathrooms > 0) facts.push(`${property.bathrooms} bathrooms`);
  if (property.square_meters > 0) facts.push(`${property.square_meters}sqm`);
  const detail = facts.length > 0 ? `${facts.join(", ")}. ` : "";

  return truncate(
    `${readableType(property.property_type)} ${purposePhrase(property.purpose).toLowerCase()} in ${property.city}, ${property.country}. ${detail}Verified listing on TheVHomes.`,
    155
  );
}

export function coverImage(property: Property): string {
  return property.cover_image_url || property.images?.[0]?.url || `${SITE_URL}/og-default.jpg`;
}

/**
 * Full metadata set for a property page: title, description, canonical URL,
 * Open Graph (Facebook, WhatsApp, LinkedIn) and Twitter Cards.
 */
export function buildPropertyMetadata(property: Property): Metadata {
  const url = propertyURL(property);
  const title = propertyMetaTitle(property);
  const description = propertyMetaDescription(property);
  const image = coverImage(property);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: "TheVHomes",
      url,
      title,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: property.title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

/**
 * Schema.org RealEstateListing structured data. Search engines use this to
 * render rich property cards — price, bedrooms, location — instead of a plain
 * text result.
 *
 * Undefined fields are dropped by JSON.stringify, so a listing missing (say)
 * coordinates simply omits `geo` rather than emitting an invalid empty node.
 */
export function buildPropertyJsonLd(property: Property): Record<string, unknown> {
  const url = propertyURL(property);

  return {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url,
    image: property.images?.length ? property.images.map((img) => img.url) : [coverImage(property)],
    datePosted: property.created_at,
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressCountry: property.country,
    },
    geo:
      property.latitude && property.longitude
        ? {
            "@type": "GeoCoordinates",
            latitude: property.latitude,
            longitude: property.longitude,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency || "NGN",
      availability: property.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    numberOfBedrooms: property.bedrooms || undefined,
    numberOfBathroomsTotal: property.bathrooms || undefined,
    floorSize: property.square_meters
      ? { "@type": "QuantitativeValue", value: property.square_meters, unitCode: "MTK" }
      : undefined,
    amenityFeature: property.amenities?.length
      ? property.amenities.map((name) => ({
          "@type": "LocationFeatureSpecification",
          name,
          value: true,
        }))
      : undefined,
    // Declaring the tour as a VideoObject makes it eligible for video rich
    // results, which point back at the property page rather than at YouTube.
    video: property.youtube_video_id
      ? {
          "@type": "VideoObject",
          name: `${property.title} — video tour`,
          description: propertyMetaDescription(property),
          thumbnailUrl: `https://i.ytimg.com/vi/${property.youtube_video_id}/hqdefault.jpg`,
          embedUrl: `https://www.youtube-nocookie.com/embed/${property.youtube_video_id}`,
          uploadDate: property.created_at,
        }
      : undefined,
  };
}

function readableType(type: string): string {
  const labels: Record<string, string> = {
    apartment: "Apartment",
    villa: "House",
    duplex: "House",
    land: "Land",
    office: "Office Space",
    hotel: "Hotel",
    shortlet: "Shortlet",
    commercial: "Commercial Property",
    warehouse: "Warehouse",
    event_center: "Event Centre",
  };
  return labels[type] ?? "Property";
}

function purposePhrase(purpose: string): string {
  const labels: Record<string, string> = {
    buy: "for Sale",
    rent: "for Rent",
    invest: "Investment",
    shortlet: "Shortlet",
  };
  return labels[purpose] ?? "for Sale";
}

function truncate(s: string, max: number): string {
  const clean = s.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1).trimEnd() + "…";
}
