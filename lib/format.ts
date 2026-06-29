import type { House, Room, Photo, PriceUnit, BathroomType } from "./types";

/** A clean space label (Kitchen, Bathroom, Living room…) from PadSplit's photo data. */
export function photoLabel(p: Pick<Photo, "description" | "category">): string {
  const desc = (p.description || "").trim();
  const text = `${desc} ${p.category}`.toLowerCase();
  const map: [RegExp, string][] = [
    [/kitchen/, "Kitchen"],
    [/bath|shower|restroom/, "Bathroom"],
    [/dining/, "Dining room"],
    [/living|family\s*room/, "Living room"],
    [/\bden\b/, "Den"],
    [/laundry|washer|dryer/, "Laundry"],
    [/patio|deck/, "Patio"],
    [/backyard|\byard\b|garden/, "Backyard"],
    [/storage|closet|pantry/, "Storage"],
    [/garage/, "Garage"],
    [/bed\s*room/, "Bedroom"],
    [/exterior|front|street|outside|neighborhood/, "Exterior"],
  ];
  for (const [re, label] of map) if (re.test(text)) return label;
  // A short, clean PadSplit description (no "detected:" noise) — use it as-is.
  if (desc && !/detected:/i.test(desc) && desc.length <= 28) {
    return desc.charAt(0).toUpperCase() + desc.slice(1);
  }
  return "Common area";
}
import { availableRooms } from "./houses";

export function priceLabel(price: number, unit: PriceUnit = "week"): string {
  return `$${price.toLocaleString()}/${unit === "week" ? "wk" : "mo"}`;
}

export function fromPriceLabel(house: House): string {
  if (house.fromPrice == null) return "See pricing";
  return `from ${priceLabel(house.fromPrice, house.priceUnit)}`;
}

export function availabilityLabel(house: House): string {
  if (!house.available || house.roomsAvailable <= 0) return "Fully booked";
  const n = house.roomsAvailable;
  return `${n} room${n === 1 ? "" : "s"} available`;
}

/** Group available rooms by bathroom type with the cheapest price in each. */
export function bathroomBreakdown(house: House): { type: BathroomType; count: number; from: number | null }[] {
  const groups: Record<string, { count: number; from: number }> = {};
  for (const r of availableRooms(house)) {
    const key = r.bathroomType ?? "shared";
    const g = (groups[key] ??= { count: 0, from: Infinity });
    g.count++;
    if (r.weeklyRate != null && r.weeklyRate < g.from) g.from = r.weeklyRate;
  }
  const order: BathroomType[] = ["private", "shared"];
  return order
    .filter((t) => groups[t])
    .map((t) => ({ type: t, count: groups[t].count, from: Number.isFinite(groups[t].from) ? groups[t].from : null }));
}

/** Standout selling-point tags for a room (private bath/entrance, mini fridge). */
export function roomHighlights(room: Room): string[] {
  const tags: string[] = [];
  if (room.bathroomType === "private") tags.push("Private bathroom");
  if (room.privateAccess) tags.push("Private entrance");
  if (room.miniFridge) tags.push("Mini fridge");
  return tags;
}

export function prettyBath(type: BathroomType | null): string {
  if (type === "private") return "Private bath";
  if (type === "shared") return "Shared bath";
  return "Bath";
}

export function prettyBed(size: string | null): string | null {
  if (!size) return null;
  return `${size.charAt(0).toUpperCase()}${size.slice(1)} bed`;
}

/** Use PadSplit's exact room name so listings match across both sites. */
export function roomTitle(room: Room): string {
  if (room.name && room.name.trim()) return room.name.trim();
  if (room.roomNumber != null) return `Room ${room.roomNumber}`;
  return "Room";
}

/** Optional extra description (kept separate from the name to avoid repetition). */
export function roomTagline(room: Room): string | null {
  return room.description && room.description.trim() ? room.description.trim() : null;
}

export function moveInLabel(iso: string | null): string {
  // PadSplit rooms here are next-day move-in, so surface everything as
  // "Available now" unless a room is genuinely weeks out.
  if (!iso) return "Available now";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "Available now";
  const days = Math.round((startOfDay(d) - startOfDay(new Date())) / 86_400_000);
  if (days <= 7) return "Available now";
  return `Available ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function updatedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const days = Math.floor((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days} days ago`;
  return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
