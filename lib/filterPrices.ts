/**
 * Cheapest weekly rate on each metro PadSplit search, from the search API's
 * extras.min_price (the same number as the page's "starting at" line after
 * sorting price low to high). Cached for an hour. A failed fetch returns null
 * for that card so the homepage can hide the price instead of showing a stale one.
 * Address fields are never read or stored.
 */
import { getMarket } from "./market";

const SEARCH = "https://www.padsplit.com/api/property_search/";

function searchBounds(): Record<string, string> {
  const bounds = getMarket().padsplit.bounds;
  return {
    lat_max: bounds.latMax,
    lng_max: bounds.lngMax,
    lat_min: bounds.latMin,
    lng_min: bounds.lngMin,
  };
}

export type FilterStartingPrices = {
  instant: number | null;
  privateBath: number | null;
  roomForTwo: number | null;
  fewer: number | null;
  noFee: number | null;
  /** Unfiltered Atlanta search, price low to high. Used by the chat budget answer. */
  lowest: number | null;
};

const EMPTY: FilterStartingPrices = {
  instant: null,
  privateBath: null,
  roomForTwo: null,
  fewer: null,
  noFee: null,
  lowest: null,
};

function asWeekly(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

async function minPrice(filter: Record<string, string>): Promise<number | null> {
  const u = new URL(SEARCH);
  for (const [k, v] of Object.entries({ ...searchBounds(), sort_by: "price", page_size: "1", ...filter })) {
    u.searchParams.set(k, v);
  }
  try {
    const res = await fetch(u.toString(), {
      next: { revalidate: 3600 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { extras?: { min_price?: unknown } };
    return asWeekly(data.extras?.min_price);
  } catch {
    return null;
  }
}

export async function getFilterStartingPrices(): Promise<FilterStartingPrices> {
  try {
    const [instant, privateBath, roomForTwo, fewer, noFee, lowest] = await Promise.all([
      minPrice({ move_in_time: "instant_move_in" }),
      minPrice({ bathroom_type: "private_bathroom" }),
      minPrice({ room_features: "allow_multiple_occupants" }),
      minPrice({ rooms_count: "6" }),
      minPrice({ no_move_in_fee: "true" }),
      minPrice({}),
    ]);
    return { instant, privateBath, roomForTwo, fewer, noFee, lowest };
  } catch {
    return EMPTY;
  }
}
