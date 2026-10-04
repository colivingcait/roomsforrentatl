import type { Market } from "../market";
import { canonicalSiteUrl } from "../site-url";

export const SA_MARKET: Market = {
  id: "sa",
  mark: "SA",
  name: "RoomsForRentSA",
  domain: "RoomsForRentSA.com",
  url: canonicalSiteUrl(process.env.NEXT_PUBLIC_SITE_URL, "https://www.roomsforrentsa.com"),
  metro: "San Antonio",
  phone: null,
  listingSource: "file",
  tagline: "Furnished rooms for rent in San Antonio. Move in as soon as tomorrow.",
  description:
    "Furnished rooms for rent in San Antonio — weekly, no lease, next-day move-in. All-in pricing with utilities and Wi-Fi included. Book through PadSplit.",
  seoTitle: "RoomsForRentSA — Furnished Rooms for Rent in San Antonio, Next-Day Move In",
  socialTitle: "Apply Today, Move in Tomorrow",
  keywords: [
    "rooms for rent San Antonio",
    "furnished rooms San Antonio",
    "furnished room for rent San Antonio weekly",
    "next day move in San Antonio",
    "weekly rooms San Antonio",
    "PadSplit San Antonio",
    "no lease room rental San Antonio",
    "room for rent Live Oak",
    "room for rent Converse",
    "co-living San Antonio",
  ],
  heroKicker: "Furnished rooms across San Antonio",
  heroPhoto: null,
  seoHeading: "Furnished rooms for rent in San Antonio, TX",
  seoBody:
    "Looking for an affordable room to rent in San Antonio? Furnished private bedrooms in shared homes across San Antonio, Live Oak, and Converse are booked through PadSplit, with no long lease and weekly or biweekly pay. Utilities, parking, and Wi-Fi are included in the weekly rate. Once you're approved, you can move in as soon as the next day.",
  footerLine: "Furnished rooms for rent in San Antonio. Move in as soon as tomorrow.",
  featuredSources: [],
  showPageFaq: true,
  showCityList: false,
  referral: {
    code: "0DC68BAB",
    overrides: {},
  },
  padsplit: {
    searchPath: "san-antonio-tx",
    state: "tx",
    bounds: {
      latMax: "29.75",
      lngMax: "-98.05",
      latMin: "29.15",
      lngMin: "-98.85",
    },
  },
  cities: [
    { slug: "san-antonio", name: "San Antonio" },
    { slug: "live-oak", name: "Live Oak" },
    { slug: "converse", name: "Converse" },
  ],
  areas: [
    { slug: "san-antonio", label: "San Antonio", pattern: "\\bsan\\s+antonio\\b", wide: true },
    { slug: "live-oak", label: "Live Oak", pattern: "\\blive\\s+oak\\b" },
    { slug: "converse", label: "Converse", pattern: "\\bconverse\\b" },
  ],
  areaChips: ["San Antonio", "Live Oak", "Converse"],
  metroLinkIsCity: true,
  og: {
    alt: "Furnished rooms in San Antonio",
    letter: "R",
    word: "Rooms",
    line1: "Furnished rooms in San Antonio.",
    line2: "Next Day Move In",
    sub: "All-in weekly pricing · utilities and Wi-Fi included",
    chips: ["Fully furnished", "Utilities + Wi-Fi included", "Stay as long as you need"],
  },
};

export const ACTIVE_MARKET = SA_MARKET;
