import type { Market } from "../market";

export const DFW_MARKET: Market = {
  id: "dfw",
  mark: "DFW",
  name: "RoomsForRentDFW",
  domain: "RoomsForRentDFW.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://roomsforrentdfw.com",
  metro: "Dallas–Fort Worth",
  browseDescription:
    "Furnished rooms for rent in Dallas–Fort Worth — weekly, no lease, next-day move-in. All-in pricing with utilities and Wi-Fi included. Book through PadSplit.",
  placeFallback: "Dallas–Fort Worth",
  westLabel: null,
  westHouseId: null,
  phone: null,
  tagline: "Furnished rooms for rent in Dallas–Fort Worth. Move in as soon as tomorrow.",
  description:
    "Furnished rooms for rent in Dallas–Fort Worth — weekly, no lease, next-day move-in. All-in pricing with utilities and Wi-Fi included. Book through PadSplit.",
  seoTitle: "RoomsForRentDFW — Furnished Rooms for Rent in Dallas–Fort Worth, Next-Day Move In",
  socialTitle: "Apply Today, Move in Tomorrow",
  keywords: [
    "rooms for rent Dallas",
    "rooms for rent Fort Worth",
    "furnished rooms Dallas",
    "furnished rooms Fort Worth",
    "weekly rooms Dallas",
    "PadSplit Dallas",
    "PadSplit Fort Worth",
    "no lease room rental Dallas",
    "room for rent Arlington",
    "room for rent Irving",
    "room for rent Garland",
    "room for rent Mesquite",
    "room for rent Grand Prairie",
  ],
  heroKicker: "Furnished rooms across Dallas–Fort Worth",
  heroPhoto: null,
  heroBackdropClass: null,
  cardPhotos: {},
  seoHeading: "Furnished rooms for rent in Dallas–Fort Worth, TX",
  seoBody:
    "Looking for an affordable room to rent in Dallas–Fort Worth? Furnished private bedrooms in shared homes across the Dallas–Fort Worth metro are booked through PadSplit, with no long lease and weekly or biweekly pay. Every furnished room on this site is booked through PadSplit, with utilities, parking and Wi-Fi included. Once you're approved, you can move in as soon as the next day.",
  footerLine: "Furnished rooms for rent in Dallas–Fort Worth. Move in as soon as tomorrow.",
  // Empty until a host list is added. The homepage then shows the cheapest
  // PadSplit rooms on the metro search. A non-empty list replaces that.
  featuredSources: [],
  showPageFaq: true,
  showCityList: true,
  referral: {
    code: "0DC68BAB",
    overrides: {},
  },
  padsplit: {
    searchPath: "dallas-tx",
    state: "tx",
    bounds: {
      latMax: "33.65",
      lngMax: "-96.18",
      latMin: "32.07",
      lngMin: "-97.82",
    },
  },
  cities: [
    { slug: "dallas", name: "Dallas" },
    { slug: "fort-worth", name: "Fort Worth" },
    { slug: "arlington", name: "Arlington" },
    { slug: "grand-prairie", name: "Grand Prairie" },
    { slug: "irving", name: "Irving" },
    { slug: "mesquite", name: "Mesquite" },
    { slug: "garland", name: "Garland" },
  ],
};

export const ACTIVE_MARKET = DFW_MARKET;
