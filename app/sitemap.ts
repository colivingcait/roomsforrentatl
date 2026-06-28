import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { getAllHouseIds } from "@/lib/houses";

export default function sitemap(): MetadataRoute.Sitemap {
  const houses = getAllHouseIds().map((id) => ({
    url: `${site.url}/house/${id}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    ...houses,
  ];
}
