export type PriceUnit = "week" | "month";

/**
 * A room as authored in data/listings.json. This is the source of truth for
 * branding, copy, and the PadSplit link. Price/availability fields here act as
 * a fallback that the live scraper overrides when it can reach PadSplit.
 */
export interface SeedListing {
  /** URL-safe id used in /room/[slug] */
  slug: string;
  /** The room's live page on PadSplit — used for the scheduled price pull and the "Book" redirect */
  padsplitUrl: string;
  name: string;
  neighborhood: string;
  city: string;
  /** Fallback price; live scrape overrides this */
  price: number;
  priceUnit: PriceUnit;
  /** Fallback availability; live scrape overrides this */
  availableNow: boolean;
  /** ISO date (YYYY-MM-DD) the room is available to move in */
  moveInDate?: string;
  bedType: string;
  bathroom: string;
  image: string;
  amenities: string[];
  highlight?: string;
}

/** Live values pulled from PadSplit by the scheduled scraper. */
export interface LiveData {
  price?: number;
  priceUnit?: PriceUnit;
  availableNow?: boolean;
  image?: string;
  /** ISO timestamp of when this was fetched */
  fetchedAt?: string;
  /** True if the live fetch succeeded; false means we're showing seed values */
  ok: boolean;
}

/** A listing as rendered on the site: seed data with any live overrides merged in. */
export interface Listing extends SeedListing {
  live: LiveData;
}
