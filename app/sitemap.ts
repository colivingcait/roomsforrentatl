import type { MetadataRoute } from "next";
import { getBrand } from "@/lib/brand";
import { getMarket } from "@/lib/market";
import { getAllHouseIds } from "@/lib/houses";
import { getAllColivingHouseIds } from "@/lib/coliving";

// Brand-aware: each domain lists only its own pages.
// /rentals and /rental/* are unpublished and are not listed.
export default function sitemap(): MetadataRoute.Sitemap {
  const brand = getBrand();
  const base = brand.url;

  if (getMarket().id === "dfw") {
    return [{ url: base, changeFrequency: "daily" as const, priority: 1 }];
  }

  if (getMarket().id === "sa") {
    const houses = getAllHouseIds().map((id) => ({
      url: `${base}/house/${id}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
    return [{ url: base, changeFrequency: "daily" as const, priority: 1 }, ...houses];
  }

  if (brand.key === "homes") {
    return [];
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
