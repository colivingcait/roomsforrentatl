import type { Brand, BrandKey } from "./brand";
import { canonicalSiteUrl } from "./site-url";

export const BRANDS: Record<BrandKey, Brand> = {
  rooms: {
    key: "rooms",
    word: "Rooms",
    name: "RoomsForRentATL",
    domain: "RoomsForRentATL.com",
    url: canonicalSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, "https://www.roomsforrentatl.com"),
    tagline: "Furnished rooms for rent in Atlanta — next day move in.",
    description:
      "Furnished rooms for rent in Atlanta — weekly, no lease, next-day move-in. All-in pricing with utilities & WiFi included. Book a PadSplit room today.",
  },
  homes: {
    key: "homes",
    word: "Homes",
    name: "HomesForRentATL",
    domain: "HomesForRentATL.com",
    url: "https://homesforrentatl.com",
    tagline: "Furnished private rentals in Atlanta.",
    description:
      "Furnished private rentals for rent in Atlanta — your own studio or apartment, monthly lease, utilities included. Apply online today.",
  },
};

/** Which brand a hostname maps to. */
export function brandFromHost(host?: string | null): BrandKey {
  return (host ?? "").toLowerCase().includes("homesforrent") ? "homes" : "rooms";
}
