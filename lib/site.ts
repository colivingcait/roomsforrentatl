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
    code: process.env.NEXT_PUBLIC_PADSPLIT_REFERRAL ?? "B2C2060F",
    param: process.env.NEXT_PUBLIC_PADSPLIT_REFERRAL_PARAM ?? "referralCode",
    // Extra attribution params PadSplit includes on host share links.
    extra: { ref_source: "site", ref_role: "host" } as Record<string, string>,
  },
};

/**
 * Per-visitor referral override — lets two "versions" of the site run at
 * once, each crediting a different PadSplit host profile, chosen by which
 * short link (/lustra or /covilla) a visitor came in on. Set as a cookie by
 * that route, read back here on every "Book" link. Falls back to the
 * default `site.referral.code` above when no override cookie is set.
 */
export const REFERRAL_COOKIE = "ref_override";
export const REFERRAL_OVERRIDES: Record<string, string> = {
  lustra: "B2C2060F",
  covilla: "0DC68BAB",
};

/** Client-side only: rewrites a PadSplit booking URL's referral code to match the visitor's ref_override cookie, if any. Safe no-op on the server or for non-PadSplit URLs. */
export function applyReferralOverride(href: string): string {
  if (typeof document === "undefined") return href;
  const match = document.cookie.match(/(?:^|;\s*)ref_override=([^;]*)/);
  const key = match ? decodeURIComponent(match[1]) : null;
  const overrideCode = key ? REFERRAL_OVERRIDES[key] : null;
  if (!overrideCode) return href;
  try {
    const u = new URL(href);
    if (!u.hostname.endsWith("padsplit.com")) return href;
    u.searchParams.set(site.referral.param, overrideCode);
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
