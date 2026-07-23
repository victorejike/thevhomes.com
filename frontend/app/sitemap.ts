import type { MetadataRoute } from "next";
import { api } from "@/lib/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: "https://thevhomes.com", changeFrequency: "daily", priority: 1 },
    { url: "https://thevhomes.com/properties", changeFrequency: "hourly", priority: 0.9 },
    { url: "https://thevhomes.com/agents", changeFrequency: "daily", priority: 0.6 },
    { url: "https://thevhomes.com/investments", changeFrequency: "weekly", priority: 0.6 },
  ];

  try {
    const { items } = await api.properties.list({ page_size: 50 });
    const propertyRoutes: MetadataRoute.Sitemap = items.map((property) => ({
      url: `https://thevhomes.com/properties/${property.slug}`,
      lastModified: property.created_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
    return [...staticRoutes, ...propertyRoutes];
  } catch {
    return staticRoutes;
  }
}
