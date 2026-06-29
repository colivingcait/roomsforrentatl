export type PriceUnit = "week" | "month";
export type BathroomType = "private" | "shared";

export interface Photo {
  url: string;
  category: string;
  description: string | null;
  primary?: boolean;
  width?: number | null;
  height?: number | null;
}

/** A single room within a house, scraped from PadSplit's per-room data. */
export interface Room {
  id: number;
  /** 1-based position in PadSplit's room order — used in the apply deep-link. */
  padIndex: number | null;
  /** The room's position on the PadSplit page — the N in /room-details/{house}/{N}. */
  pagePosition?: number | null;
  /** PadSplit's own /room-details index for this room (matched from the page). */
  applyIndex?: number | null;
  name: string | null;
  roomNumber: number | null;
  description: string | null;
  weeklyRate: number | null;
  recommendedPrice: number | null;
  bathroomType: BathroomType | null;
  bedSize: string | null;
  roomSize: string | null;
  workspace: boolean;
  miniFridge: boolean;
  privateAccess: boolean;
  climateControl: string | null;
  windows: number | null;
  status: number | null;
  detailedStatus: string | null;
  moveInDate: string | null;
  image: string | null;
  photos: string[];
  /** Derived: PadSplit status === 1 means vacant/listed. */
  available: boolean;
}

/**
 * A house as authored in data/houses.json — editable branding + the PadSplit
 * link the daily job crawls.
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
  /** Optional merchandising tag shown on the card, e.g. "New!" or "Highly Rated!". */
  badge?: string;
  /** Pin this house to the top of the list regardless of price. */
  pinned?: boolean;
  /** Force a specific photo URL as the first gallery image (overrides auto-pick). */
  heroPhoto?: string;
  /** Transit note for the chat assistant, e.g. "5–10 min walk to the bus". */
  transit?: string;
}

/** Live values written by the daily scraper into data/availability.json. */
export interface LiveHouse {
  title?: string;
  rooms?: Room[];
  commonAreas?: Photo[];
  carousel?: Photo[];
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
  rooms: Room[];
  commonAreas: Photo[];
  carousel: Photo[];
  roomsAvailable: number;
  fromPrice: number | null;
  priceUnit: PriceUnit;
  available: boolean;
  checkedAt: string | null;
  stale: boolean;
}
