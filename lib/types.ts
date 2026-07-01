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
  /** Curated resident review score (out of 5), e.g. 4.7. Shown on the property page. */
  rating?: number;
  /** Optional number of reviews to show next to the rating, e.g. 32. */
  reviewCount?: number;
  /** Matterport / 3D virtual tour URL, if the home has one. */
  tourUrl?: string;
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
  rating?: number | null;
  checkedAt?: string;
  stale?: boolean;
}

/** A long-term (monthly) private rental unit — managed manually, not PadSplit. */
export interface Unit {
  id: string;
  title: string;
  type: string; // e.g. "Studio" or "2 Bed · 1 Bath"
  beds: number;
  baths: number;
  city: string;
  neighborhood?: string;
  rent: number; // monthly
  deposit?: number | null;
  furnished?: boolean | null;
  utilitiesIncluded?: boolean | null;
  availableDate?: string | null; // ISO date
  leaseLength?: string | null;
  pets?: string | null;
  sqft?: number | null;
  description?: string; // longer write-up shown on the unit page
  furnishedNote?: string; // what's included vs. what the tenant brings
  features?: string[];
  applyUrl?: string | null; // TurboTenant link; absent if not ready yet
  comingSoon?: boolean; // show a simple "Coming soon" card, pinned last
  photos?: string[];
  tourUrl?: string | null;
}

/** A single room in a manually-managed (non-PadSplit) co-living house. */
export interface ColivingRoom {
  id: string; // e.g. "2"
  label: string; // e.g. "Room 2"
  bath: "private" | "semi-private"; // semi-private = shared with one other room only
  shareWith?: string | null; // for semi-private, the room it shares a bath with
  price?: number | null;
  availableDate?: string | null;
  applyUrl?: string | null; // that room's TurboTenant pre-screener link
  photos?: string[];
  leased?: boolean; // once a lease is signed, flip to hide/mark taken
  active?: boolean; // false = never show (e.g. rooms 1 & 11)
}

/**
 * A co-living house we manage ourselves — NOT on PadSplit. Rooms apply through
 * each room's TurboTenant pre-screener. No street address is ever stored here;
 * only the public neighborhood/city.
 */
export interface ColivingHouse {
  id: string;
  name: string;
  neighborhood: string;
  city: string;
  lat?: number | null;
  lng?: number | null;
  rentUnit: PriceUnit; // "week" or "month"
  utilitiesIncluded?: boolean;
  wifi?: boolean;
  furnished?: boolean;
  description?: string;
  notOnPadsplit?: boolean; // shows a "Not on PadSplit" tag on the card
  deposit?: number | null; // 0/null = no traditional cash deposit
  depositAlternative?: "rhino" | string | null; // e.g. "rhino" → shown as a deposit-free perk
  applicationFee?: number | null; // optional TT application fee
  published?: boolean; // false = fully hidden from the site AND the chatbot
  rooms: ColivingRoom[];
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
