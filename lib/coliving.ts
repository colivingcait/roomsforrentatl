import data from "@/data/coliving.json";
import type { ColivingHouse, ColivingRoom } from "./types";

const HOUSES = (data.houses as ColivingHouse[]) ?? [];

/** Only published houses, with inactive rooms (e.g. 1 & 11) filtered out. */
export function getColivingHouses(): ColivingHouse[] {
  return HOUSES.filter((h) => h.published).map((h) => ({
    ...h,
    rooms: h.rooms.filter((r) => r.active !== false),
  }));
}

export function getColivingHouse(id: string): ColivingHouse | null {
  const h = HOUSES.find((x) => x.id === id && x.published);
  if (!h) return null;
  return { ...h, rooms: h.rooms.filter((r) => r.active !== false) };
}

export function getAllColivingHouseIds(): string[] {
  return HOUSES.filter((h) => h.published).map((h) => h.id);
}

/** Rooms that are shown as available (active and not yet leased). */
export function availableColivingRooms(h: ColivingHouse): ColivingRoom[] {
  return h.rooms.filter((r) => r.active !== false && !r.leased);
}

/** The lowest listed price among available rooms, or null if none priced yet. */
export function colivingFromPrice(h: ColivingHouse): number | null {
  const prices = availableColivingRooms(h)
    .map((r) => r.price)
    .filter((p): p is number => typeof p === "number");
  return prices.length ? Math.min(...prices) : null;
}

/** A friendly one-liner describing the deposit situation, or null if unset. */
export function depositLine(h: ColivingHouse): string | null {
  if (h.depositAlternative) {
    return "No large security deposit — we offer flexible, deposit-free options instead of a big lump sum.";
  }
  if (typeof h.deposit === "number" && h.deposit > 0) {
    return `Security deposit: $${h.deposit.toLocaleString()}.`;
  }
  if (h.deposit === 0 || h.deposit === null) {
    return "No security deposit required.";
  }
  return null;
}
