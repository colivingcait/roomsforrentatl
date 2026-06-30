import { getHouses } from "@/lib/houses";
import { priceLabel } from "@/lib/format";

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
      viewbox: "-84.9,34.2,-83.8,33.4",
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

  // Geocode: try the Census geocoder first, then fall back to Nominatim.
  const geo = (await geocodeCensus(address)) ?? (await geocodeNominatim(address));
  if (!geo) {
    return Response.json(
      { error: "We couldn't find that address. Try adding the city and state." },
      { status: 422 }
    );
  }
  const { lat, lng, label } = geo;

  const homes = getHouses().filter(
    (h) => h.available && typeof h.lat === "number" && typeof h.lng === "number"
  );
  if (!homes.length) {
    return Response.json({ error: "No homes are open right now." }, { status: 404 });
  }

  const ranked = homes
    .map((h) => {
      const miles = haversineMiles(lat as number, lng as number, h.lat as number, h.lng as number);
      const mins = (miles * 1.35) / 28 * 60; // rough road miles ÷ ~28mph city speed
      return { h, miles, mins };
    })
    .sort((a, b) => a.miles - b.miles);

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
      fromPrice: h.fromPrice != null ? priceLabel(h.fromPrice, h.priceUnit) : null,
      roomsAvailable: h.roomsAvailable,
      rating: h.rating ?? null,
      reviewCount: h.reviewCount ?? null,
      url: `/house/${h.id}#rooms`,
    };
  });

  const matched = label ? label.split(",").slice(0, 2).join(",").trim() : address;
  return Response.json({ matched, nearest });
}
