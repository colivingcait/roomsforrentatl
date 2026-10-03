/**
 * Site-wide settings. Edit these in one place — phone number, domain, etc.
 * (Or override with environment variables in Vercel without touching code.)
 */
export const site = {
  name: "RoomsForRentATL",
  domain: "RoomsForRentATL.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://roomsforrentatl.com",
  tagline: "Furnished rooms for rent in Atlanta — next day move in.",
  description:
    "Browse available furnished rooms for rent across Atlanta. All-in pricing, utilities & WiFi included, next day move in. Book your room today.",
  // Your PadSplit referral. The code is appended to every "Book" link so you get
  // referral credit. PadSplit reads it from the `referralCode` query param (seen
  // on real PadSplit share links), alongside ref_source/ref_role attribution.
  referral: {
    // Root roomsforrentatl.com. /covilla switches to COVILLA_REFERRAL_CODE.
    code: "B2C2060F",
    param: "referralCode",
    // Extra attribution params on room "Book" links (not the search CTAs).
    extra: { ref_source: "site", ref_role: "host" } as Record<string, string>,
  },
  /** Calls only — do not offer this number for texting. */
  phone: "(678) 490-9917",
};

/** Main site (root routes). */
export const MAIN_REFERRAL_CODE = site.referral.code;
/** roomsforrentatl.com/covilla. */
export const COVILLA_REFERRAL_CODE = "0DC68BAB";

/**
 * Per-visitor referral override — lets two "versions" of the site run at
 * once, each crediting a different PadSplit host profile, chosen by which
 * short link (/lustra or /covilla) a visitor came in on. Set as a cookie by
 * that route, read back here on every "Book" link. Falls back to the
 * default `site.referral.code` above when no override cookie is set.
 */
export const REFERRAL_COOKIE = "ref_override";
export const REFERRAL_OVERRIDES: Record<string, string> = {
  lustra: MAIN_REFERRAL_CODE,
  covilla: COVILLA_REFERRAL_CODE,
};

/**
 * Referral code for a visitor. No cookie (root routes) uses the main code.
 * /covilla sets the ref_override cookie to "covilla" before redirecting home.
 * Pass cookieValue on the server; in the browser the cookie is read for you.
 */
export function referralCodeFor(cookieValue?: string | null): string {
  const key = cookieValue ?? readReferralCookie();
  if (key && REFERRAL_OVERRIDES[key]) return REFERRAL_OVERRIDES[key];
  return MAIN_REFERRAL_CODE;
}

function readReferralCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)ref_override=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/** Client-side only: rewrites a PadSplit booking URL's referral code to match the visitor's ref_override cookie, if any. Safe no-op on the server or for non-PadSplit URLs. */
export function applyReferralOverride(href: string): string {
  if (typeof document === "undefined") return href;
  const code = referralCodeFor();
  try {
    const u = new URL(href);
    if (!u.hostname.endsWith("padsplit.com")) return href;
    u.searchParams.set(site.referral.param, code);
    return u.toString();
  } catch {
    return href;
  }
}

/**
 * Builds the "Book" link for a room: the room's live PadSplit page with your
 * referral code attached so you get credit for the booking. If no referral
 * code is configured, it returns the plain PadSplit URL unchanged. Won't
 * overwrite a referral param that's already on the URL.
 */
/**
 * Direct PadSplit room-application link, e.g.
 * https://www.padsplit.com/room-details/35011/1?referralCode=...
 * Falls back to the house listing URL if we don't have a room number.
 */
export function roomBookingUrl(houseId: string, roomNumber: number | null, houseUrl: string): string {
  if (roomNumber == null) return bookingUrl(houseUrl);
  const { code, param, extra } = site.referral;
  const u = new URL(`https://www.padsplit.com/room-details/${houseId}/${roomNumber}`);
  if (code) {
    u.searchParams.set(param, code);
    for (const [k, v] of Object.entries(extra)) u.searchParams.set(k, v);
  }
  return u.toString();
}

/**
 * Deep link straight to a specific room on the house's PadSplit page, using the
 * stable per-room anchor PadSplit renders (id="room-number-{roomId}"). This
 * survives PadSplit's randomized room order. Falls back to the rooms section.
 */
export function roomAnchorUrl(houseUrl: string, roomId?: number | string | null): string {
  const base = bookingUrl(houseUrl);
  const hash = roomId != null ? `room-number-${roomId}` : "select-room-section";
  return `${base}#${hash}`;
}

/** Atlanta search the private-bath and double-occupancy CTAs start from. */
export const PADSPLIT_ATLANTA_SEARCH_BASE = "https://www.padsplit.com/rooms-for-rent/atlanta-ga";

const PADSPLIT_ATLANTA_BOUNDS = {
  latMax: "33.9698383740918",
  lngMax: "-84.10153814955288",
  latMin: "33.497148095320355",
  lngMin: "-84.56500806987017",
} as const;

/** Attribution kept on every search link. No `sign-up` param, so no modal. */
const PADSPLIT_SEARCH_ATTRIBUTION = {
  ref_device: "desktop",
  ref_role: "host",
  ref_source: "link",
} as const;

/**
 * City slugs that load and keep referralCode. The path is `/${slug}-ga`.
 * south-atlanta, buckhead, and midtown are intentionally absent: those
 * paths redirect to PadSplit's homepage and drop the referral.
 */
export const VERIFIED_PADSPLIT_CITY_SLUGS = [
  "decatur",
  "stone-mountain",
  "atlanta",
  "east-point",
  "norcross",
  "marietta",
  "riverdale",
  "avondale-estates",
  "covington",
  "college-park",
  "kennesaw",
  "canton",
  "jonesboro",
  "fairburn",
  "fayetteville",
  "newnan",
  "snellville",
] as const;

const VERIFIED_CITY_SLUGS = new Set<string>(VERIFIED_PADSPLIT_CITY_SLUGS);

/**
 * Base search URL + optional filter params + the visitor's referral code.
 * `code` defaults to the main site. Pass referralCodeFor(cookie) for /covilla.
 */
export function padsplitSearchUrl(
  base: string,
  filter: Record<string, string> = {},
  code: string = MAIN_REFERRAL_CODE
): string {
  const u = new URL(base);
  for (const [k, v] of Object.entries(filter)) u.searchParams.set(k, v);
  if (code) u.searchParams.set(site.referral.param, code);
  for (const [k, v] of Object.entries(PADSPLIT_SEARCH_ATTRIBUTION)) u.searchParams.set(k, v);
  return u.toString();
}

/** Atlanta-wide search, including the metro bounds. Use this when a city slug would drop the referral. */
export function atlantaSearchUrl(filter: Record<string, string> = {}, code?: string): string {
  return padsplitSearchUrl(PADSPLIT_ATLANTA_SEARCH_BASE, { ...PADSPLIT_ATLANTA_BOUNDS, ...filter }, code);
}

export function privateBathSearchUrl(code?: string): string {
  return atlantaSearchUrl({ bathroomType: "private_bathroom" }, code);
}

export function doubleOccupancySearchUrl(code?: string): string {
  return atlantaSearchUrl({ roomFeatures: "allow_multiple_occupants" }, code);
}

/** Homes with 5 or fewer housemates. PadSplit's roomsCount=6 is that search. */
export function fewerHousematesSearchUrl(code?: string): string {
  return atlantaSearchUrl({ roomsCount: "6" }, code);
}

/** Instant move-in. This filter works on /rooms-for-rent/atlanta-ga, not /search. */
export function instantBookingSearchUrl(code?: string): string {
  return atlantaSearchUrl({ moveInTime: "instant_move_in" }, code);
}

/** tel: link for site.phone. Calls only. */
export function phoneTelHref(): string {
  const digits = site.phone.replace(/\D/g, "");
  return `tel:+1${digits}`;
}

/**
 * City search. Verified slugs get /rooms-for-rent/<slug>-ga plus referral params.
 * Anything else, including south-atlanta / buckhead / midtown, uses the Atlanta-wide search.
 */
export function citySearchUrl(slug: string, filter: Record<string, string> = {}, code?: string): string {
  const city = slug.toLowerCase().trim();
  if (!VERIFIED_CITY_SLUGS.has(city)) return atlantaSearchUrl(filter, code);
  return padsplitSearchUrl(`https://www.padsplit.com/rooms-for-rent/${city}-ga`, filter, code);
}

/**
 * PadSplit's general site-wide search page (not tied to any one house) —
 * for people who don't like any of your specific rooms but might still book
 * something else on PadSplit. Sending them here (instead of losing them)
 * still credits your referral code.
 */
export function generalSearchUrl(): string {
  const { code, param } = site.referral;
  const u = new URL("https://www.padsplit.com/");
  u.searchParams.set("sign-up", "");
  if (code) u.searchParams.set(param, code);
  u.searchParams.set("ref_device", "desktop");
  u.searchParams.set("ref_role", "host");
  u.searchParams.set("ref_source", "link");
  return u.toString();
}

export function bookingUrl(padsplitUrl: string, roomId?: string | number): string {
  const { code, param, extra } = site.referral;
  try {
    const u = new URL(padsplitUrl);
    if (roomId != null) u.searchParams.set("roomId", String(roomId));
    if (code && !u.searchParams.has(param)) u.searchParams.set(param, code);
    for (const [k, v] of Object.entries(extra)) {
      if (code && !u.searchParams.has(k)) u.searchParams.set(k, v);
    }
    return u.toString();
  } catch {
    return padsplitUrl;
  }
}
