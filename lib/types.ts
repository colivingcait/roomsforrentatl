export type PriceUnit = "week" | "month";

/**
 * A house as you author it in data/houses.json — the editable source of truth
 * for branding (name, blurb, amenities, photo) and the PadSplit link the daily
 * job crawls.
 */
export interface SeedHouse {
  id: string;
  padsplitUrl: string;
  name: string;
  neighborhood: string;
  city: string;
  image: string;
  blurb?: string;
  amenities: string[];
  /** Approximate neighborhood center (NOT the street address) for the map. */
  lat?: number;
  lng?: number;
}

/** Live values written by the daily scraper into data/availability.json. */
export interface LiveHouse {
  title?: string;
  roomsAvailable?: number;
  fromPrice?: number;
  priceUnit?: PriceUnit;
  neighborhood?: string;
  city?: string;
  image?: string;
  utilitiesIncluded?: boolean;
  available?: boolean;
  checkedAt?: string;
  stale?: boolean;
}

/** A house as rendered on the site: your seed data + live availability merged. */
export interface House extends SeedHouse {
  roomsAvailable: number;
  fromPrice: number | null;
  priceUnit: PriceUnit;
  available: boolean;
  checkedAt: string | null;
  stale: boolean;
}
