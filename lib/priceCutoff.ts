/**
 * Intro discounts (half off the first few weeks) make the cheapest PadSplit
 * cards a poor "from" price. Sort that search's listings by weekly price, drop
 * the cheapest 10% (round up, at least one), and price from what remains.
 * Featured rooms are the next listings after that same cutoff.
 * Address street fields are never read or stored.
 */
import { getMarket } from "./market";
import { isStreetishPlace } from "./format";
import { dropPhoto, leakReason } from "./listing-privacy.mjs";

const SEARCH = "https://www.padsplit.com/api/property_search/";
const PAGE_SIZE = 100;
const MAX_PAGES = 40;

export type RankedListing = {
  id: string;
  price: number;
  place: string | null;
  photo: string | null;
  /** Order returned by PadSplit, so equal prices stay stable. */
  order: number;
};

type Picture = {
  category?: unknown;
  description?: unknown;
  location?: unknown;
};

/** How many cheapest listings to ignore. */
export function listingsToDrop(total: number): number {
  if (!Number.isFinite(total) || total <= 0) return 0;
  return Math.max(1, Math.ceil(total * 0.1));
}

/** Listings that remain after the intro cutoff. `ranked` must be cheapest first. */
export function applyPriceCutoff<T>(ranked: readonly T[]): T[] {
  return ranked.slice(listingsToDrop(ranked.length));
}

function asWeekly(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

const INTERIOR = /bedroom|bed\s*room|bath|kitchen|living|dining|common_space|hallway|laundry|interior/i;

/**
 * One public photo URL. Drops uncategorized, PNG, marketing, and outdoor
 * pictures with the same rule as the Atlanta scraper. The picture's
 * description is not returned.
 */
function interiorPhoto(pictures: unknown): string | null {
  if (!Array.isArray(pictures)) return null;
  const interiors: { url: string; text: string }[] = [];
  for (const pic of pictures) {
    if (!pic || typeof pic !== "object") continue;
    const photo = pic as Picture;
    const url = typeof photo.location === "string" ? photo.location : "";
    const category = typeof photo.category === "string" ? photo.category : "";
    const description = typeof photo.description === "string" ? photo.description : "";
    if (!/^https:\/\//.test(url)) continue;
    if (dropPhoto({ url, location: url, category, description })) continue;
    const text = `${category} ${description}`;
    if (!INTERIOR.test(text)) continue;
    interiors.push({ url, text });
  }
  const bedroom = interiors.find((pic) => /bed/i.test(pic.text));
  return (bedroom ?? interiors[0])?.url ?? null;
}

function publicText(value: unknown): string {
  if (typeof value !== "string") return "";
  const text = value.replace(/,?\s*(tx|ga)$/i, "").trim();
  if (!text || isStreetishPlace(text) || leakReason(text)) return "";
  return text;
}

/**
 * Neighborhood when it is not a street, otherwise the city.
 * Only those two fields are read. street1, zip, lat, and lng are ignored.
 */
function publicPlace(address: unknown): string | null {
  if (!address || typeof address !== "object") return null;
  const record = address as Record<string, unknown>;
  const neighborhood = publicText(record.neighborhood);
  const city = publicText(record.city);
  if (neighborhood) {
    if (city && !neighborhood.toLowerCase().includes(city.toLowerCase())) return `${neighborhood}, ${city}`;
    return neighborhood;
  }
  return city || null;
}

function pageUrl(filter: Record<string, string>, page: number): string {
  const bounds = getMarket().padsplit.bounds;
  const u = new URL(SEARCH);
  const params: Record<string, string> = {
    lat_max: bounds.latMax,
    lng_max: bounds.lngMax,
    lat_min: bounds.latMin,
    lng_min: bounds.lngMin,
    sort_by: "price",
    page_size: String(PAGE_SIZE),
    page: String(page),
    ...filter,
  };
  for (const [key, value] of Object.entries(params)) u.searchParams.set(key, value);
  return u.toString();
}

type SearchPage = {
  next?: unknown;
  total_pages?: unknown;
  results?: unknown;
};

async function fetchPage(filter: Record<string, string>, page: number): Promise<SearchPage | null> {
  try {
    const res = await fetch(pageUrl(filter, page), {
      next: { revalidate: 3600 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as SearchPage;
  } catch {
    return null;
  }
}

/**
 * Whitelist for a search row. The returned record has no address object,
 * no photo description, and no coordinates. Listing lat/lng are not copied,
 * even rounded: a featured card does not need a point on a map.
 */
function toRanked(row: unknown, order: number): RankedListing | null {
  if (!row || typeof row !== "object") return null;
  const item = row as Record<string, unknown>;
  const id = item.id != null ? String(item.id) : "";
  const price = asWeekly(item.room_min_price);
  if (!/^\d+$/.test(id) || price == null) return null;
  return {
    id,
    price,
    place: publicPlace(item.address),
    photo: interiorPhoto(item.ordered_pictures),
    order,
  };
}

/**
 * Every priced listing in this metro search, cheapest weekly rate first.
 * Null when the fetch does not finish, so callers hide the price instead of
 * using a partial list.
 */
export async function rankedListings(filter: Record<string, string> = {}): Promise<RankedListing[] | null> {
  const collected: RankedListing[] = [];
  const seen = new Set<string>();
  let page = 1;
  let totalPages = 1;
  let complete = false;

  while (page <= totalPages && page <= MAX_PAGES) {
    const data = await fetchPage(filter, page);
    if (!data || !Array.isArray(data.results)) return null;
    const reported = Number(data.total_pages);
    if (Number.isFinite(reported) && reported >= 1) totalPages = reported;
    for (const row of data.results) {
      const listing = toRanked(row, collected.length);
      if (!listing || seen.has(listing.id)) continue;
      seen.add(listing.id);
      collected.push(listing);
    }
    if (!data.next || page >= totalPages) {
      complete = true;
      break;
    }
    page += 1;
  }

  if (!complete) return null;
  collected.sort((a, b) => a.price - b.price || a.order - b.order);
  return collected;
}

/** Cheapest weekly rate after the intro cutoff. */
export async function startingPrice(filter: Record<string, string> = {}): Promise<number | null> {
  const ranked = await rankedListings(filter);
  if (!ranked) return null;
  return applyPriceCutoff(ranked)[0]?.price ?? null;
}
