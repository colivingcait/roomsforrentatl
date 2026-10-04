import { headers } from "next/headers";
import { getMarket } from "./market";

/**
 * Two brands, one codebase, on the Atlanta build. Other markets are rooms-only
 * and take their name from the active market module.
 */
export type BrandKey = "rooms" | "homes";

export interface Brand {
  key: BrandKey;
  /** First word of the wordmark: "Rooms" or "Homes". */
  word: string;
  name: string;
  domain: string;
  url: string;
  tagline: string;
  description: string;
}

function marketBrand(): Brand {
  const market = getMarket();
  return {
    key: "rooms",
    word: "Rooms",
    name: market.name,
    domain: market.domain,
    url: market.url,
    tagline: market.tagline,
    description: market.description,
  };
}

/**
 * The brand for the current request (server components / route handlers).
 * Reading the host opts pages into per-request rendering — required so the
 * same build serves the right brand on each domain. Do NOT wrap this in a
 * try/catch: that would swallow Next's dynamic signal and freeze the brand.
 */
export function getBrand(): Brand {
  if (process.env.NEXT_PUBLIC_MARKET === "sa" || process.env.NEXT_PUBLIC_MARKET === "dfw") {
    return marketBrand();
  }
  const { BRANDS, brandFromHost } = require("./brand-homes") as typeof import("./brand-homes");
  const host = headers().get("host") ?? "";
  return BRANDS[brandFromHost(host)];
}
