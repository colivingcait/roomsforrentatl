import { getHouses } from "@/lib/houses";
import { getColivingHouses, availableColivingRooms, colivingFromPrice } from "@/lib/coliving";
import { priceLabel } from "@/lib/format";

type NearHome = {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  lat: number;
  lng: number;
  fromPrice: string | null;
  roomsAvailable: number;
  rating: number | null;
  reviewCount: number | null;
  url: string;
};

/** PadSplit homes + Willow, normalized to one shape for distance ranking. */
function allNearHomes(): NearHome[] {
  const padsplit: NearHome[] = getHouses()
    .filter((h) => h.available && typeof h.lat === "number" && typeof h.lng === "number")
    .map((h) => ({
      id: h.id,
      name: h.name,
      neighborhood: h.neighborhood,
      city: h.city,
      lat: h.lat as number,
      lng: h.lng as number,
      fromPrice: h.fromPrice != null ? priceLabel(h.fromPrice, h.priceUnit) : null,
      roomsAvailable: h.roomsAvailable,
      rating: h.rating ?? null,
      reviewCount: h.reviewCount ?? null,
      url: `/house/${h.id}#rooms`,
    }));

  const coliving: NearHome[] = getColivingHouses()
    .filter((h) => typeof h.lat === "number" && typeof h.lng === "number")
    .map((h) => {
      const rooms = availableColivingRooms(h);
      const from = colivingFromPrice(h);
      return {
        id: h.id,
        name: h.name,
        neighborhood: h.neighborhood,
        city: h.city,
        lat: h.lat as number,
        lng: h.lng as number,
        fromPrice: from != null ? priceLabel(from, h.rentUnit) : null,
        roomsAvailable: rooms.length,
        rating: null,
        reviewCount: null,
        url: `/coliving/${h.id}`,
      };
    });

  return [...padsplit, ...coliving];
}

// Geocoding + distance run server-side. We only ever return a home's public
// neighborhood and an APPROXIMATE distance/drive time — never the exact address.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function haversineMiles(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3958.8; // miles
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const lat1 = toRad(aLat);
  const lat2 = toRad(bLat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

// Everything we list is in Georgia, so keep lookups in-state: append ", GA" when
// the input doesn't already name the state, and reject anything that geocodes
// outside Georgia's bounding box (e.g. a same-named place in another state).
const GA_BOX = { minLat: 30.3, maxLat: 35.05, minLng: -85.65, maxLng: -80.75 };
const inGeorgia = (g: { lat: number; lng: number }) =>
  g.lat >= GA_BOX.minLat &&
  g.lat <= GA_BOX.maxLat &&
  g.lng >= GA_BOX.minLng &&
  g.lng <= GA_BOX.maxLng;
const withGeorgia = (address: string) =>
  /\b(ga|georgia)\b/i.test(address) ? address : `${address}, GA`;

type Geo = { lat: number; lng: number; label: string };

async function fetchJson(url: string, timeoutMs = 6000): Promise<unknown | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "RoomsForRentATL/1.0 (https://roomsforrentatl.com)",
        Accept: "application/json",
      },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// Primary: the US Census geocoder — free, no API key, server-friendly, US addresses.
async function geocodeCensus(address: string): Promise<Geo | null> {
  const url =
    "https://geocoding.geo.census.gov/geocoder/locations/onelineaddress?" +
    new URLSearchParams({
      address,
      benchmark: "Public_AR_Current",
      format: "json",
    }).toString();
  const data = (await fetchJson(url)) as
    | { result?: { addressMatches?: { coordinates?: { x: number; y: number }; matchedAddress?: string }[] } }
    | null;
  const m = data?.result?.addressMatches?.[0];
  if (m?.coordinates && typeof m.coordinates.y === "number" && typeof m.coordinates.x === "number") {
    return { lat: m.coordinates.y, lng: m.coordinates.x, label: m.matchedAddress ?? address };
  }
  return null;
}

// Fallback: OpenStreetMap Nominatim, biased to metro Atlanta (handles place names too).
async function geocodeNominatim(address: string): Promise<Geo | null> {
  const url =
    "https://nominatim.openstreetmap.org/search?" +
    new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
      countrycodes: "us",
      viewbox: "-85.65,35.05,-80.75,30.3", // Georgia statewide
    }).toString();
  const arr = (await fetchJson(url)) as { lat?: string; lon?: string; display_name?: string }[] | null;
  const m = Array.isArray(arr) ? arr[0] : null;
  if (m?.lat && m?.lon) {
    const lat = parseFloat(m.lat);
    const lng = parseFloat(m.lon);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      return { lat, lng, label: m.display_name ?? address };
    }
  }
  return null;
}

export async function POST(req: Request) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const address = String((payload as { address?: unknown }).address ?? "")
    .trim()
    .slice(0, 200);
  if (address.length < 3) {
    return Response.json({ error: "Please enter an address." }, { status: 400 });
  }

  // Geocode (Georgia-only): try the Census geocoder first, then Nominatim, and
  // discard any match that lands outside Georgia.
  const q = withGeorgia(address);
  let geo = (await geocodeCensus(q)) ?? (await geocodeNominatim(q));
  if (geo && !inGeorgia(geo)) geo = null;
  if (!geo) {
    return Response.json(
      { error: "We couldn't find that Georgia address. Try adding the city (e.g. “…, Decatur, GA”)." },
      { status: 422 }
    );
  }
  const { lat, lng, label } = geo;

  const homes = allNearHomes();
  if (!homes.length) {
    return Response.json({ error: "No homes are open right now." }, { status: 404 });
  }

  const ranked = homes
    .map((h) => {
      const miles = haversineMiles(lat as number, lng as number, h.lat, h.lng);
      const mins = (miles * 1.35) / 28 * 60; // rough road miles ÷ ~28mph city speed
      return { h, miles, mins };
    })
    .sort((a, b) => a.miles - b.miles);

  // Georgia is a big state — a same-named street can match a town far outside
  // metro Atlanta (e.g. "Alma, GA" instead of the Atlanta one), producing a
  // nonsense multi-hour "nearest home." If even the closest home is
  // implausibly far, treat it as not found rather than showing junk.
  const METRO_MAX_MILES = 60;
  if (!ranked.length || ranked[0].miles > METRO_MAX_MILES) {
    return Response.json(
      {
        error:
          "That address doesn't look like it's in the Atlanta area. Try adding the neighborhood or city (e.g. \"…, Decatur, GA\").",
      },
      { status: 422 }
    );
  }

  const nearest = ranked.slice(0, 2).map(({ h, miles, mins }) => {
    const low = round5(mins);
    return {
      id: h.id,
      name: h.name,
      neighborhood: h.neighborhood,
      city: h.city,
      miles: Math.max(1, Math.round(miles)),
      carLow: low,
      carHigh: low + 5,
      fromPrice: h.fromPrice,
      roomsAvailable: h.roomsAvailable,
      rating: h.rating,
      reviewCount: h.reviewCount,
      url: h.url,
    };
  });

  const matched = label ? label.split(",").slice(0, 2).join(",").trim() : address;
  return Response.json({ matched, nearest });
}
