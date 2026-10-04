import type { Brand, BrandKey } from "./brand";

/** Stand-in so a non-Atlanta build never bundles the homes domain. */
export const BRANDS: Partial<Record<BrandKey, Brand>> = {};

export function brandFromHost(_host?: string | null): BrandKey {
  return "rooms";
}
