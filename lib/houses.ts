import housesData from "@/data/houses.json";
import availability from "@/data/availability.json";
import type { House, SeedHouse, LiveHouse, Room, Photo, PriceUnit } from "./types";
import { getMarket } from "./market";
import {
  dropPhoto,
  publicImage,
  publicNeighborhood,
  publicPhoto,
  publicRoom,
  roundCoord,
} from "./listing-privacy.mjs";

const SEED = (housesData.houses as SeedHouse[]) ?? [];
const LIVE = (availability.houses as unknown as Record<string, LiveHouse>) ?? {};

function featuredIdSet(): Set<string> {
  const ids = new Set<string>();
  for (const url of getMarket().featuredSources) {
    const match = /\/listing\/(\d+)/.exec(url);
    if (match) ids.add(match[1]);
  }
  return ids;
}

/** Seeds this market lists, in houses.json order. */
function featuredSeeds(): SeedHouse[] {
  const ids = featuredIdSet();
  return SEED.filter((house) => ids.has(house.id));
}

export function getHouses(): House[] {
  return featuredSeeds().map(merge).sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1; // pinned first
    if (a.available !== b.available) return a.available ? -1 : 1;
    return (a.fromPrice ?? 1e9) - (b.fromPrice ?? 1e9);
  });
}

export function getHouse(id: string): House | null {
  const seed = featuredSeeds().find((h) => h.id === id);
  return seed ? merge(seed) : null;
}

export function getRoom(houseId: string, roomId: string): { house: House; room: Room } | null {
  const house = getHouse(houseId);
  if (!house) return null;
  const room = house.rooms.find((r) => String(r.id) === String(roomId));
  return room ? { house, room } : null;
}

export function getAllHouseIds(): string[] {
  return featuredSeeds().map((h) => h.id);
}

/** [houseId, roomId] pairs for static generation of room pages. */
export function getAllRoomParams(): { id: string; roomId: string }[] {
  const out: { id: string; roomId: string }[] = [];
  for (const seed of featuredSeeds()) {
    const rooms = (LIVE[seed.id]?.rooms ?? []).filter((r) => r.status === 1);
    for (const r of rooms) out.push({ id: seed.id, roomId: String(r.id) });
  }
  return out;
}

export function lastUpdated(): string | null {
  return (availability as { updatedAt?: string }).updatedAt ?? null;
}

/** Available rooms only: private-bath rooms surfaced first, then cheapest first. */
export function availableRooms(house: House): Room[] {
  return house.rooms
    .filter((r) => r.available)
    .sort((a, b) => {
      const ap = a.bathroomType === "private" ? 0 : 1;
      const bp = b.bathroomType === "private" ? 0 : 1;
      if (ap !== bp) return ap - bp; // private bath first
      return (a.weeklyRate ?? 1e9) - (b.weeklyRate ?? 1e9);
    });
}

/**
 * Photos for the card/hero gallery, in this order:
 *   1. the biggest kitchen photo
 *   2. the first 6 room photos
 *   3. bathrooms
 *   4. other indoor common areas (dining, living, laundry, …)
 *   5. any remaining room photos
 */
export function orderedPhotos(house: House): string[] {
  const roomPics = availableRooms(house).flatMap((r) =>
    (r.photos?.length ? r.photos : r.image ? [r.image] : []).filter(
      (url) => !dropPhoto({ url, category: "bedroom" })
    )
  );

  const commons = house.commonAreas.filter((c) => !dropPhoto(c));
  const matches = (c: Photo, re: RegExp) => re.test(`${c.label ?? ""} ${c.category}`);
  const area = (c: Photo) => (c.width ?? 0) * (c.height ?? 0);
  const heroOk =
    house.heroPhoto && !dropPhoto({ url: house.heroPhoto, category: "interior" })
      ? house.heroPhoto
      : undefined;

  // Lead photo: a safe manual override wins; otherwise biggest kitchen, then a
  // living area, then PadSplit's primary, then a room photo.
  const kitchens = commons.filter((c) => matches(c, /kitchen/i)).sort((a, b) => area(b) - area(a));
  const leadUrl =
    heroOk ||
    kitchens[0]?.url ||
    commons.find((c) => matches(c, /living|den|family/i))?.url ||
    commons.find((c) => matches(c, /dining/i))?.url ||
    commons.find((c) => c.primary)?.url ||
    roomPics[0] ||
    commons.find((c) => !matches(c, /bath|shower|restroom/i))?.url ||
    commons[0]?.url;

  const baths = commons.filter((c) => c.url !== leadUrl && matches(c, /bath|shower|restroom/i)).map((c) => c.url);
  const others = commons
    .filter((c) => c.url !== leadUrl && !matches(c, /bath|shower|restroom|kitchen/i))
    .map((c) => c.url);

  const sequence = [
    leadUrl,
    ...roomPics.slice(0, 6),
    ...baths,
    ...others,
    ...roomPics.slice(6),
  ];

  const seen = new Set<string>();
  const out: string[] = [];
  for (const u of sequence) {
    if (u && !seen.has(u)) {
      seen.add(u);
      out.push(u);
    }
  }
  const fallback =
    house.image && !dropPhoto({ url: house.image, category: "interior" }) ? house.image : "";
  return out.length ? out.slice(0, 20) : fallback ? [fallback] : [];
}

function keptPhotos(photos: Photo[] | undefined): Photo[] {
  const out: Photo[] = [];
  for (const photo of photos ?? []) {
    const kept = publicPhoto(photo);
    if (kept) out.push(kept);
  }
  return out;
}

function merge(seed: SeedHouse): House {
  const live = LIVE[seed.id] ?? {};
  const dropped = new Set<string>();
  for (const photo of live.commonAreas ?? []) {
    if (photo.url && !publicPhoto(photo)) dropped.add(photo.url);
  }
  for (const photo of live.carousel ?? []) {
    if (photo.url && !publicPhoto(photo)) dropped.add(photo.url);
  }
  const rooms: Room[] = (live.rooms ?? []).map((r) => publicRoom(r as unknown as Record<string, unknown>, dropped));
  const avail = rooms.filter((r) => r.available);
  const fromPrice =
    avail.length > 0
      ? Math.min(...avail.map((r) => r.weeklyRate ?? Infinity).filter((n) => Number.isFinite(n)))
      : live.fromPrice ?? null;

  const hero =
    seed.heroPhoto && !dropped.has(seed.heroPhoto) && !dropPhoto({ url: seed.heroPhoto, category: "interior" })
      ? seed.heroPhoto
      : undefined;
  return {
    ...seed,
    neighborhood: publicNeighborhood(live.neighborhood, seed.neighborhood),
    image: publicImage(live.image, dropped) || seed.image,
    heroPhoto: hero,
    lat: roundCoord(seed.lat),
    lng: roundCoord(seed.lng),
    rooms,
    commonAreas: keptPhotos(live.commonAreas),
    carousel: keptPhotos(live.carousel),
    roomsAvailable: avail.length || live.roomsAvailable || 0,
    fromPrice: Number.isFinite(fromPrice as number) ? (fromPrice as number) : null,
    priceUnit: (live.priceUnit as PriceUnit) ?? "week",
    available: (avail.length || live.roomsAvailable || 0) > 0,
    // Live star rating scraped from PadSplit wins; seed value is the fallback.
    // (reviewCount, if curated, flows through from the seed spread above.)
    rating: live.rating ?? seed.rating,
    checkedAt: live.checkedAt ?? null,
    stale: live.stale ?? false,
  };
}
