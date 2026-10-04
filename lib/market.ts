/**
 * One codebase, one market per build. Dallas–Fort Worth production sets
 * NEXT_PUBLIC_MARKET=dfw. San Antonio production sets NEXT_PUBLIC_MARKET=sa.
 * Unset is always Atlanta, including previews of any branch.
 * next.config.js swaps ./markets/atl for the active market, so the Atlanta
 * copy is what this module loads unless that swap runs.
 *
 * Renters on one market must never see another market's name, homes,
 * phone, or links.
 */

export type MarketId = "atl" | "dfw" | "sa";

export interface MarketArea {
  slug: string;
  label: string;
  /** Source for `new RegExp(pattern, "i")`. */
  pattern: string;
  /** Metro-wide search instead of a city path. */
  wide?: boolean;
  /** Featured-room city match. Defaults to the label. */
  cityIncludes?: string;
  cityExcludes?: string;
}

export interface MarketOg {
  alt: string;
  letter: string;
  word: string;
  line1: string;
  line2: string;
  sub: string;
  chips: string[];
}

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
  /** Atlanta-only label for a few west-side neighborhoods. */
  westLabel?: string;
  /** null hides every phone number and call button. */
  phone: string | null;
  /**
   * "sources" — featuredSources ids in the houses file.
   * "file" — every house in the houses file (rewritten by the scrape).
   * "search" — no local homes; the homepage uses the cheapest search cards.
   */
  listingSource: "sources" | "file" | "search";
  tagline: string;
  /** Brand meta description. */
  description: string;
  seoTitle: string;
  socialTitle: string;
  keywords: string[];
  heroKicker: string;
  /** Interior hero photos. Null keeps a flat brand field. */
  heroPhoto: { mobile: string; desktop: string } | null;
  /** Local interior card photos keyed by house id. Other markets use scraped photos. */
  cardPhotos?: Record<string, { src: string; alt: string }>;
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
  areas: MarketArea[];
  areaChips: string[];
  /**
   * When true, /rooms-for-rent/<searchPath> without metro bounds is labeled
   * as that city. Atlanta leaves this false so atlanta-ga stays the metro search.
   */
  metroLinkIsCity: boolean;
  /** Atlanta short links. Absent on other markets, so those paths 404. */
  shortHouses?: Record<string, string>;
  og: MarketOg;
  homesSeoTitle?: string;
  homesKeywords?: string[];
  homesOg?: MarketOg;
  homesSister?: { label: string; name: string; url: string };
  homesRentalsTitle?: string;
  homesRentalsDescription?: string;
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
