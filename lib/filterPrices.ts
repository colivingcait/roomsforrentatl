/**
 * Cheapest weekly rate on each Atlanta PadSplit search, from the search API's
 * extras.min_price (the same number as the page's "starting at" line after
 * sorting price low to high). Cached for an hour. A failed fetch returns null
 * for that card so the homepage can hide the price instead of showing a stale one.
 * Address fields are never read or stored.
 */

const SEARCH = "https://www.padsplit.com/api/property_search/";

const BOUNDS = {
  lat_max: "33.9698383740918",
  lng_max: "-84.10153814955288",
  lat_min: "33.497148095320355",
  lng_min: "-84.56500806987017",
} as const;

export type FilterStartingPrices = {
  instant: number | null;
  privateBath: number | null;
  roomForTwo: number | null;
  fewer: number | null;
};

const EMPTY: FilterStartingPrices = {
  instant: null,
  privateBath: null,
  roomForTwo: null,
  fewer: null,
};

function asWeekly(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

async function minPrice(filter: Record<string, string>): Promise<number | null> {
  const u = new URL(SEARCH);
  for (const [k, v] of Object.entries({ ...BOUNDS, sort_by: "price", page_size: "1", ...filter })) {
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
    const [instant, privateBath, roomForTwo, fewer] = await Promise.all([
      minPrice({ move_in_time: "instant_move_in" }),
      minPrice({ bathroom_type: "private_bathroom" }),
      minPrice({ room_features: "allow_multiple_occupants" }),
      minPrice({ rooms_count: "6" }),
    ]);
    return { instant, privateBath, roomForTwo, fewer };
  } catch {
    return EMPTY;
  }
}
