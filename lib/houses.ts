import housesData from "@/data/houses.json";
import availability from "@/data/availability.json";
import type { House, SeedHouse, LiveHouse, Room, Photo, PriceUnit } from "./types";

const SEED = (housesData.houses as SeedHouse[]) ?? [];
const LIVE = (availability.houses as unknown as Record<string, LiveHouse>) ?? {};

export function getHouses(): House[] {
  return SEED.map(merge).sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1; // pinned first
    if (a.available !== b.available) return a.available ? -1 : 1;
    return (a.fromPrice ?? 1e9) - (b.fromPrice ?? 1e9);
  });
}

export function getHouse(id: string): House | null {
  const seed = SEED.find((h) => h.id === id);
  return seed ? merge(seed) : null;
}

export function getRoom(houseId: string, roomId: string): { house: House; room: Room } | null {
  const house = getHouse(houseId);
  if (!house) return null;
  const room = house.rooms.find((r) => String(r.id) === String(roomId));
  return room ? { house, room } : null;
}

export function getAllHouseIds(): string[] {
  return SEED.map((h) => h.id);
}

/** [houseId, roomId] pairs for static generation of room pages. */
export function getAllRoomParams(): { id: string; roomId: string }[] {
  const out: { id: string; roomId: string }[] = [];
  for (const seed of SEED) {
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
 *   4. other common areas (dining, living, patio, laundry, …)
 *   5. any remaining room photos
 */
export function orderedPhotos(house: House): string[] {
  const roomPics = availableRooms(house).flatMap((r) =>
    r.photos?.length ? r.photos : r.image ? [r.image] : []
  );

  const matches = (c: Photo, re: RegExp) => re.test(`${c.description ?? ""} ${c.category}`);
  const area = (c: Photo) => (c.width ?? 0) * (c.height ?? 0);
  // Street/exterior/outdoor shots should never be the lead photo.
  const isExterior = (c: Photo) =>
    c.category === "other" || matches(c, /exterior|street|front\b|neighborhood|outside|patio|backyard|\byard\b/i);

  // Lead photo: a manual override wins; otherwise biggest kitchen, then a living
  // area, then PadSplit's primary, then a room photo — never a street shot.
  const kitchens = house.commonAreas.filter((c) => matches(c, /kitchen/i)).sort((a, b) => area(b) - area(a));
  const leadUrl =
    house.heroPhoto ||
    kitchens[0]?.url ||
    house.commonAreas.find((c) => matches(c, /living|den|family/i))?.url ||
    house.commonAreas.find((c) => matches(c, /dining/i))?.url ||
    house.commonAreas.find((c) => c.primary && !isExterior(c))?.url ||
    roomPics[0] ||
    house.commonAreas.find((c) => !isExterior(c) && !matches(c, /bath|shower|restroom/i))?.url ||
    house.commonAreas[0]?.url;

  const baths = house.commonAreas
    .filter((c) => c.url !== leadUrl && matches(c, /bath|shower|restroom/i))
    .map((c) => c.url);
  const others = house.commonAreas
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
  return out.length ? out.slice(0, 20) : [house.image];
}

function merge(seed: SeedHouse): House {
  const live = LIVE[seed.id] ?? {};
  const rooms: Room[] = (live.rooms ?? []).map((r) => ({ ...r, available: r.status === 1 }));
  const avail = rooms.filter((r) => r.available);
  const fromPrice =
    avail.length > 0
      ? Math.min(...avail.map((r) => r.weeklyRate ?? Infinity).filter((n) => Number.isFinite(n)))
      : live.fromPrice ?? null;

  return {
    ...seed,
    neighborhood: live.neighborhood || seed.neighborhood,
    image: live.image || seed.image,
    rooms,
    commonAreas: live.commonAreas ?? [],
    carousel: live.carousel ?? [],
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
