import type { Listing, PriceUnit } from "./types";

export function priceLabel(price: number, unit: PriceUnit): string {
  return `$${price.toLocaleString()}/${unit === "week" ? "wk" : "mo"}`;
}

/** Friendly move-in label relative to today, e.g. "Move in today" / "Jul 5". */
export function moveInLabel(listing: Listing): string {
  if (listing.availableNow) return "Move in today";
  if (!listing.moveInDate) return "Available soon";
  const d = new Date(listing.moveInDate + "T00:00:00");
  if (isNaN(d.getTime())) return "Available soon";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.round((d.getTime() - today.getTime()) / 86_400_000);
  if (days <= 0) return "Move in today";
  if (days === 1) return "Move in tomorrow";
  return `Available ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}
