import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import { PropertyDetails } from "@/components/property-details";
import { buildPropertyJsonLd, buildPropertyMetadata } from "@/lib/seo";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const property = await api.properties.get(slug);
    return buildPropertyMetadata(property);
  } catch {
    return { title: "Property Not Found | TheVHomes" };
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildPropertyJsonLd(property)) }}
      />
      <PropertyDetails property={property} />
    </>
  );
}
