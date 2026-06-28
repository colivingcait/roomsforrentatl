import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllSlugs } from "@/lib/listings";

export default function sitemap(): MetadataRoute.Sitemap {
  const rooms = getAllSlugs().map((slug) => ({
    url: `${site.url}/room/${slug}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
  return [
    { url: site.url, changeFrequency: "hourly", priority: 1 },
    ...rooms,
  ];
}
