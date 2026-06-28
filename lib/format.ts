import type { House, PriceUnit } from "./types";

export function priceLabel(price: number, unit: PriceUnit): string {
  return `$${price.toLocaleString()}/${unit === "week" ? "wk" : "mo"}`;
}

/** "from $169/wk" — the house's lowest available room price. */
export function fromPriceLabel(house: House): string {
  if (house.fromPrice == null) return "See pricing";
  return `from ${priceLabel(house.fromPrice, house.priceUnit)}`;
}

/** "4 rooms available" / "1 room available" / "Fully booked". */
export function availabilityLabel(house: House): string {
  if (!house.available || house.roomsAvailable <= 0) return "Fully booked";
  const n = house.roomsAvailable;
  return `${n} room${n === 1 ? "" : "s"} available`;
}

/** Friendly "Updated today / yesterday / on Jun 26" from an ISO timestamp. */
export function updatedLabel(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const today = new Date();
  const days = Math.floor((startOfDay(today) - startOfDay(d)) / 86_400_000);
  if (days <= 0) return "Updated today";
  if (days === 1) return "Updated yesterday";
  if (days < 7) return `Updated ${days} days ago`;
  return `Updated ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
