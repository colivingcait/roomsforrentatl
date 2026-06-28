import seed from "@/data/listings.json";
import type { Listing, SeedListing } from "./types";
import { fetchPadsplitLive } from "./padsplit";

const SEED_LISTINGS = (seed.listings as SeedListing[]) ?? [];

/**
 * Returns every listing with live PadSplit data merged in.
 *
 * Pages that call this set `export const revalidate = N`, so Next.js caches the
 * result and only re-runs the scrape every N seconds. That's the "scheduled
 * auto-pull": prices refresh on a cadence instead of on every request, and a
 * Vercel Cron hit to /api/cron/refresh can force a refresh on demand.
 */
export async function getListings(): Promise<Listing[]> {
  const results = await Promise.all(
    SEED_LISTINGS.map(async (s) => {
      const live = await fetchPadsplitLive(s.padsplitUrl);
      return mergeLive(s, live);
    })
  );

  // Available rooms first, then cheapest — the today/tomorrow movers see the
  // most relevant options without scrolling.
  return results.sort((a, b) => {
    if (a.availableNow !== b.availableNow) return a.availableNow ? -1 : 1;
    return effectivePrice(a) - effectivePrice(b);
  });
}

export async function getListing(slug: string): Promise<Listing | null> {
  const s = SEED_LISTINGS.find((l) => l.slug === slug);
  if (!s) return null;
  const live = await fetchPadsplitLive(s.padsplitUrl);
  return mergeLive(s, live);
}

export function getAllSlugs(): string[] {
  return SEED_LISTINGS.map((l) => l.slug);
}

function mergeLive(s: SeedListing, live: Listing["live"]): Listing {
  return {
    ...s,
    price: live.ok && live.price != null ? live.price : s.price,
    priceUnit: live.ok && live.priceUnit != null ? live.priceUnit : s.priceUnit,
    availableNow: live.ok && live.availableNow != null ? live.availableNow : s.availableNow,
    image: live.ok && live.image ? live.image : s.image,
    live,
  };
}

function effectivePrice(l: Listing): number {
  // Normalize everything to a weekly figure just for sorting.
  return l.priceUnit === "month" ? Math.round(l.price / 4.33) : l.price;
}
