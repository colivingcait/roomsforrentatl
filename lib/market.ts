/**
 * One codebase, two room sites. Each deployment sets NEXT_PUBLIC_MARKET.
 * Unset, or anything other than "dfw", keeps Atlanta. A Dallas–Fort Worth
 * build swaps ./markets/atl for ./markets/dfw in next.config.js, so the
 * Atlanta copy is what this module loads unless that swap runs.
 *
 * Renters on one market must never see the other market's name, homes,
 * phone, or links.
 */

export type MarketId = "atl" | "dfw";

export interface MarketCity {
  slug: string;
  name: string;
}

export interface Market {
  id: MarketId;
  /** Wordmark suffix, e.g. "ATL". */
  mark: string;
  name: string;
  domain: string;
  url: string;
  /** Metro name used in copy, e.g. "Atlanta". */
  metro: string;
  /** null hides every phone number and call button. */
  phone: string | null;
  tagline: string;
  /** Brand meta description. */
  description: string;
  seoTitle: string;
  socialTitle: string;
  keywords: string[];
  heroKicker: string;
  /** Interior hero photos. Null keeps a flat brand field. */
  heroPhoto: { mobile: string; desktop: string } | null;
  seoHeading: string;
  seoBody: string;
  footerLine: string;
  /**
   * PadSplit listing URLs (`/rooms-for-rent/listing/{id}`). Empty hides
   * featured homes. Order matches data/houses.json when homes are listed.
   */
  featuredSources: string[];
  /** On-page FAQ. Atlanta keeps FAQ inside the chat only. */
  showPageFaq: boolean;
  /** City shortcuts under the filters. */
  showCityList: boolean;
  referral: {
    code: string;
    /** Cookie key → code. Empty disables /covilla. */
    overrides: Record<string, string>;
  };
  padsplit: {
    /** Path segment, e.g. "atlanta-ga" or "dallas-tx". */
    searchPath: string;
    state: "ga" | "tx";
    bounds: { latMax: string; lngMax: string; latMin: string; lngMin: string };
  };
  /** Slugs that keep referralCode on /rooms-for-rent/<slug>-<state>. */
  cities: MarketCity[];
}

import { ACTIVE_MARKET } from "./markets/atl";

export function getMarket(): Market {
  return ACTIVE_MARKET;
}

export function marketId(): MarketId {
  return getMarket().id;
}

/** Paths a Dallas–Fort Worth deployment must not serve. */
export const ATL_ONLY_PATH =
  /^\/(coliving|rental|rentals|covilla|willow|mora|candace|raven|meadow|chestnut)(\/|$)/i;
