import type { House } from "./types";
import { availableRooms } from "./houses";
import { roomTitle, moveInLabel } from "./format";

const APPLICATION_FEE = 19;

/** One bookable room, flattened out of its house — the browse page's unit of listing. */
export interface RoomListing {
  key: string;
  houseId: string;
  roomId: number;
  name: string;
  houseName: string;
  area: string;
  rate: number | null;
  originalRate: number | null;
  bath: "private" | "shared";
  /** True if the house's transit note points to walking to a bus. */
  walkToBus: boolean;
  transitChip: string;
  movesInSoon: boolean;
  photo: string;
  /** Rate + the $19 application fee — "to get the keys" total. */
  total: number | null;
}

/** Every currently-bookable room across all houses, cheapest first. */
export function buildRoomListings(houses: House[]): RoomListing[] {
  const out: RoomListing[] = [];
  for (const h of houses) {
    if (!h.available) continue;
    const area = [h.neighborhood, h.city].filter(Boolean).join(", ");
    const walkToBus = /walk/i.test(h.transit ?? "");
    for (const r of availableRooms(h)) {
      out.push({
        key: `${h.id}-${r.id}`,
        houseId: h.id,
        roomId: r.id,
        name: roomTitle(r),
        houseName: h.name,
        area,
        rate: r.weeklyRate,
        originalRate: r.promo && r.originalWeeklyRate != null ? r.originalWeeklyRate : null,
        bath: r.bathroomType === "private" ? "private" : "shared",
        walkToBus,
        transitChip: walkToBus ? "Walk to bus" : "Drive or rideshare",
        movesInSoon: moveInLabel(r.moveInDate) === "Available now",
        photo: r.image || h.image,
        total: r.weeklyRate != null ? r.weeklyRate + APPLICATION_FEE : null,
      });
    }
  }
  return out.sort((a, b) => (a.rate ?? 1e9) - (b.rate ?? 1e9));
}

export { APPLICATION_FEE };
