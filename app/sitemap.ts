import type { MetadataRoute } from "next";
import { getBrand } from "@/lib/brand";
import { getAllHouseIds } from "@/lib/houses";
import { getAllColivingHouseIds } from "@/lib/coliving";
import { getUnits } from "@/lib/units";

// Brand-aware: each domain lists only its own pages.
export default function sitemap(): MetadataRoute.Sitemap {
  const brand = getBrand();
  const base = brand.url;

  if (brand.key === "homes") {
    const units = getUnits()
      .filter((u) => !u.comingSoon)
      .map((u) => ({
        url: `${base}/rental/${u.id}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    return [
      { url: base, changeFrequency: "daily", priority: 1 },
      { url: `${base}/rentals`, changeFrequency: "daily", priority: 0.9 },
      ...units,
    ];
  }

  const houses = getAllHouseIds().map((id) => ({
    url: `${base}/house/${id}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
  const coliving = getAllColivingHouseIds().map((id) => ({
    url: `${base}/coliving/${id}`,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));
  return [{ url: base, changeFrequency: "daily", priority: 1 }, ...houses, ...coliving];
}
