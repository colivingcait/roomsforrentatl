/**
 * Site-wide settings. Edit these in one place — phone number, domain, etc.
 * (Or override with environment variables in Vercel without touching code.)
 */
export const site = {
  name: "RoomsForRentATL",
  domain: "RoomsForRentATL.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://roomsforrentatl.com",
  tagline: "Furnished rooms for rent in Atlanta — move in today.",
  description:
    "Browse available furnished rooms for rent across Atlanta. All-in pricing, utilities & WiFi included, quick move-in. Book your room today.",
  // Used for the "Call / Text" buttons. Update to your real booking line.
  phone: process.env.NEXT_PUBLIC_PHONE ?? "+1 (404) 555-0100",
  // Your PadSplit referral. The code is appended to every "Book" link so you
  // get referral credit. `param` is the query-string key PadSplit reads it from
  // — confirm it matches your real referral link (see README).
  referral: {
    code: process.env.NEXT_PUBLIC_PADSPLIT_REFERRAL ?? "",
    param: process.env.NEXT_PUBLIC_PADSPLIT_REFERRAL_PARAM ?? "referral_code",
  },
  get phoneHref() {
    return "tel:" + this.phone.replace(/[^0-9+]/g, "");
  },
  get smsHref() {
    return "sms:" + this.phone.replace(/[^0-9+]/g, "");
  },
};

/**
 * Builds the "Book" link for a room: the room's live PadSplit page with your
 * referral code attached so you get credit for the booking. If no referral
 * code is configured, it returns the plain PadSplit URL unchanged. Won't
 * overwrite a referral param that's already on the URL.
 */
export function bookingUrl(padsplitUrl: string): string {
  const { code, param } = site.referral;
  if (!code) return padsplitUrl;
  try {
    const u = new URL(padsplitUrl);
    if (!u.searchParams.has(param)) u.searchParams.set(param, code);
    return u.toString();
  } catch {
    return padsplitUrl;
  }
}
