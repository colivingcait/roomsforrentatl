/**
 * Featured rooms for a market that has no host list yet.
 * The first rooms on the metro PadSplit search, cheapest first, cached for an
 * hour like the filter-tile prices. Street fields are never read or stored.
 * An explicit featuredSources list replaces this entirely.
 */
import { getMarket } from "./market";
import { bookingUrl } from "./site";
import { isStreetishPlace } from "./format";

const SEARCH = "https://www.padsplit.com/api/property_search/";

/** Show 4 when we can. Fewer than 3 hides the section. Never more than 5. */
const TARGET = 4;
const MIN = 3;
const MAX = 5;
const SCAN = 12;

const EXTERIOR =
  /exterior|frontage|\bfront\b|street|outside|neighborhood|patio|backyard|\byard\b|garage|parking|driveway/i;

export type AutoFeaturedRoom = {
  id: string;
  label: string;
  place: string;
  price: number;
  photo: string;
  href: string;
};

type Picture = {
  category?: unknown;
  description?: unknown;
  location?: unknown;
};

function asWeekly(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

function pictureText(pic: Picture): string {
  const category = typeof pic.category === "string" ? pic.category : "";
  const description = typeof pic.description === "string" ? pic.description : "";
  return `${category} ${description}`;
}

function interiorPhoto(pictures: unknown): string | null {
  if (!Array.isArray(pictures)) return null;
  const interiors = pictures.filter((pic): pic is Picture => {
    if (!pic || typeof pic !== "object") return false;
    const photo = pic as Picture;
    const url = typeof photo.location === "string" ? photo.location : "";
    if (!/^https:\/\//.test(url)) return false;
    const text = pictureText(photo);
    if (EXTERIOR.test(text)) return false;
    return /bedroom|bed\s*room|bath|kitchen|living|dining|common_space|hallway|laundry|interior/i.test(text);
  });
  const bedroom = interiors.find((pic) => /bed/i.test(pictureText(pic)));
  const chosen = bedroom ?? interiors[0];
  return chosen && typeof chosen.location === "string" ? chosen.location : null;
}

/** Neighborhood when it is not a street, otherwise the city. */
function publicPlace(address: unknown): string | null {
  if (!address || typeof address !== "object") return null;
  const record = address as Record<string, unknown>;
  const neighborhood = typeof record.neighborhood === "string" ? record.neighborhood.trim() : "";
  const city = (typeof record.city === "string" ? record.city : "").replace(/,?\s*(tx|ga)$/i, "").trim();
  if (neighborhood && !isStreetishPlace(neighborhood)) {
    if (city && !isStreetishPlace(city) && !neighborhood.toLowerCase().includes(city.toLowerCase())) {
      return `${neighborhood}, ${city}`;
    }
    return neighborhood;
  }
  if (city && !isStreetishPlace(city)) return city;
  return null;
}

export async function getAutoFeaturedRooms(): Promise<AutoFeaturedRoom[]> {
  const market = getMarket();
  if (market.featuredSources.length > 0) return [];

  const bounds = market.padsplit.bounds;
  const u = new URL(SEARCH);
  for (const [k, v] of Object.entries({
    lat_max: bounds.latMax,
    lng_max: bounds.lngMax,
    lat_min: bounds.latMin,
    lng_min: bounds.lngMin,
    sort_by: "price",
    page_size: String(SCAN),
  })) {
    u.searchParams.set(k, v);
  }

  try {
    const res = await fetch(u.toString(), {
      next: { revalidate: 3600 },
      headers: { accept: "application/json" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: unknown };
    if (!Array.isArray(data.results)) return [];

    const rooms: AutoFeaturedRoom[] = [];
    for (const row of data.results) {
      if (rooms.length >= TARGET) break;
      if (!row || typeof row !== "object") continue;
      const item = row as Record<string, unknown>;
      const id = item.id != null ? String(item.id) : "";
      const price = asWeekly(item.room_min_price);
      const place = publicPlace(item.address);
      const photo = interiorPhoto(item.ordered_pictures);
      if (!/^\d+$/.test(id) || price == null || !place || !photo) continue;
      rooms.push({
        id,
        label: "Furnished room",
        place,
        price,
        photo,
        href: bookingUrl(`https://www.padsplit.com/rooms-for-rent/listing/${id}`),
      });
    }

    if (rooms.length < MIN) return [];
    return rooms.slice(0, MAX);
  } catch {
    return [];
  }
}
