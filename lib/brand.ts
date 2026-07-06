import { headers } from "next/headers";

/**
 * Two brands, one codebase. The same app serves both domains; we pick the
 * brand from the request host. Add the domain in Vercel and it just works.
 *   roomsforrentatl.com → "rooms" (co-living rooms, PadSplit + Willow)
 *   homesforrentatl.com → "homes" (whole apartments, long-term)
 */
export type BrandKey = "rooms" | "homes";

export interface Brand {
  key: BrandKey;
  /** First word of the wordmark: "Rooms" or "Homes". */
  word: string;
  name: string; // "RoomsForRentATL"
  domain: string; // "RoomsForRentATL.com"
  url: string;
  tagline: string;
  description: string;
}

export const BRANDS: Record<BrandKey, Brand> = {
  rooms: {
    key: "rooms",
    word: "Rooms",
    name: "RoomsForRentATL",
    domain: "RoomsForRentATL.com",
    url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://roomsforrentatl.com",
    tagline: "Furnished rooms for rent in Atlanta — next day move in.",
    description:
      "Browse available furnished rooms for rent across Atlanta. All-in pricing, utilities & WiFi included, quick move-in.",
  },
  homes: {
    key: "homes",
    word: "Homes",
    name: "HomesForRentATL",
    domain: "HomesForRentATL.com",
    url: "https://homesforrentatl.com",
    tagline: "Furnished private rentals in Atlanta.",
    description:
      "Browse furnished private rentals across Atlanta — a full unit that's all yours, monthly lease, utilities included, apply online.",
  },
};

/** Which brand a hostname maps to. */
export function brandFromHost(host?: string | null): BrandKey {
  return (host ?? "").toLowerCase().includes("homesforrent") ? "homes" : "rooms";
}

/**
 * The brand for the current request (server components / route handlers).
 * Reading the host opts pages into per-request rendering — required so the
 * same build serves the right brand on each domain. Do NOT wrap this in a
 * try/catch: that would swallow Next's dynamic signal and freeze the brand.
 */
export function getBrand(): Brand {
  const host = headers().get("host") ?? "";
  return BRANDS[brandFromHost(host)];
}
