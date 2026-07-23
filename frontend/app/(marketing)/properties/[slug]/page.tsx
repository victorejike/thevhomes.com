import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { PropertyDetails } from "@/components/property-details";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const property = await api.properties.get(slug);
    const image = property.images?.[0]?.url;
    return {
      title: property.title,
      description: property.description.slice(0, 155),
      openGraph: {
        title: property.title,
        description: property.description.slice(0, 155),
        images: image ? [{ url: image, width: 1200, height: 630 }] : undefined,
        type: "website",
      },
    };
  } catch {
    return { title: "Property Not Found" };
  }
}

export default async function PropertyDetailsPage({ params }: Props) {
  const { slug } = await params;

  let property;
  try {
    property = await api.properties.get(slug);
  } catch {
    notFound();
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: property.title,
    description: property.description,
    url: `https://thevhomes.com/properties/${property.slug}`,
    image: property.images?.map((img) => img.url),
    address: {
      "@type": "PostalAddress",
      streetAddress: property.address,
      addressLocality: property.city,
      addressCountry: property.country,
    },
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: property.currency,
      availability: property.available
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
    numberOfBedrooms: property.bedrooms,
    numberOfBathroomsTotal: property.bathrooms,
    floorSize: {
      "@type": "QuantitativeValue",
      value: property.square_meters,
      unitCode: "MTK",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PropertyDetails property={property} />
    </>
  );
}
