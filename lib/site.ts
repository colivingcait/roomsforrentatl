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
  // The Call/Text line — routes to your assistant. Set NEXT_PUBLIC_PHONE in Vercel.
  phone: process.env.NEXT_PUBLIC_PHONE ?? "+1 (404) 555-0100",
  // Pre-filled text shown when someone taps "Text us".
  smsBody: "Hi! I'm interested in a room with RoomsForRentATL — can you help?",
  // Your PadSplit referral. The code is appended to every "Book" link so you get
  // referral credit. PadSplit reads it from the `referralCode` query param (seen
  // on real PadSplit share links), alongside ref_source/ref_role attribution.
  referral: {
    code: process.env.NEXT_PUBLIC_PADSPLIT_REFERRAL ?? "0DC68BAB",
    param: process.env.NEXT_PUBLIC_PADSPLIT_REFERRAL_PARAM ?? "referralCode",
    // Extra attribution params PadSplit includes on host share links.
    extra: { ref_source: "site", ref_role: "host" } as Record<string, string>,
  },
  get phoneHref() {
    return "tel:" + this.phone.replace(/[^0-9+]/g, "");
  },
  get smsHref() {
    // `?&body=` is the form that prefills on both iOS and Android.
    return `sms:${this.phone.replace(/[^0-9+]/g, "")}?&body=${encodeURIComponent(this.smsBody)}`;
  },
};

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
