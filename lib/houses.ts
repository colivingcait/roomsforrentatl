import housesData from "@/data/houses.json";
import availability from "@/data/availability.json";
import type { House, SeedHouse, LiveHouse, PriceUnit } from "./types";

const SEED = (housesData.houses as SeedHouse[]) ?? [];
const LIVE = (availability.houses as Record<string, LiveHouse>) ?? {};

/**
 * Merge each authored house with the live availability the daily job scraped.
 * Live numbers win when present; your seed branding (name, photo, amenities)
 * always wins for display.
 */
export function getHouses(): House[] {
  return SEED.map(merge).sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return (a.fromPrice ?? 1e9) - (b.fromPrice ?? 1e9);
  });
}

export function getHouse(id: string): House | null {
  const seed = SEED.find((h) => h.id === id);
  return seed ? merge(seed) : null;
}

export function getAllHouseIds(): string[] {
  return SEED.map((h) => h.id);
}

/** When the availability data was last refreshed (ISO), or null. */
export function lastUpdated(): string | null {
  return (availability as { updatedAt?: string }).updatedAt ?? null;
}

function merge(seed: SeedHouse): House {
  const live = LIVE[seed.id] ?? {};
  return {
    ...seed,
    // Prefer the scraped neighborhood/photo (the real listing) but keep the
    // authored values as fallback.
    neighborhood: live.neighborhood || seed.neighborhood,
    image: live.image || seed.image,
    roomsAvailable: live.roomsAvailable ?? 0,
    fromPrice: live.fromPrice ?? null,
    priceUnit: (live.priceUnit as PriceUnit) ?? "week",
    available: live.available ?? (live.roomsAvailable ?? 0) > 0,
    checkedAt: live.checkedAt ?? null,
    stale: live.stale ?? false,
  };
}
