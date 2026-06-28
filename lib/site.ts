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
  get phoneHref() {
    return "tel:" + this.phone.replace(/[^0-9+]/g, "");
  },
  get smsHref() {
    return "sms:" + this.phone.replace(/[^0-9+]/g, "");
  },
};
