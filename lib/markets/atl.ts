import type { Market } from "../market";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://roomsforrentatl.com";

export const ATL_MARKET: Market = {
  id: "atl",
  mark: "ATL",
  name: "RoomsForRentATL",
  domain: "RoomsForRentATL.com",
  url: SITE_URL,
  metro: "Atlanta",
  browseDescription:
    "Browse available furnished rooms for rent across Atlanta. All-in pricing, utilities & WiFi included, next day move in. Book your room today.",
  placeFallback: "Atlanta",
  westLabel: "West Atlanta",
  westHouseId: "39708",
  phone: "(678) 490-9917",
  tagline: "Furnished rooms for rent in Atlanta — next day move in.",
  description:
    "Furnished rooms for rent in Atlanta — weekly, no lease, next-day move-in. All-in pricing with utilities & WiFi included. Book a PadSplit room today.",
  seoTitle: "RoomsForRentATL — Furnished Rooms for Rent in Atlanta, Next-Day Move In",
  socialTitle: "Apply Today, Move in Tomorrow",
  keywords: [
    "rooms for rent Atlanta",
    "furnished rooms Atlanta",
    "furnished room for rent Atlanta weekly",
    "next day move in Atlanta",
    "weekly rooms Atlanta",
    "PadSplit Atlanta",
    "PadSplit rooms Atlanta",
    "no lease room rental Atlanta",
    "co-living Atlanta",
    "shared house Atlanta",
    "flexible lease room Atlanta",
    "affordable room for rent Atlanta",
    "private bedroom for rent Atlanta",
    "weekly rent room Atlanta",
    "room for rent Decatur",
    "room for rent Stone Mountain",
    "room for rent Snellville",
  ],
  heroKicker: "Furnished rooms across Atlanta",
  heroPhoto: {
    mobile: "/photos/candace-room-1-wide.jpg",
    desktop: "/photos/mora-room-1-lg.jpg",
  },
  heroBackdropClass:
    "absolute inset-0 bg-[url('/photos/candace-room-1-wide.jpg')] bg-[length:100%_auto] bg-[center_top] bg-no-repeat md:bg-[url('/photos/mora-room-1-lg.jpg')] md:bg-cover md:bg-[center_72%]",
  cardPhotos: {
    "35011": {
      src: "/photos/mora-room-2.jpg",
      alt: "Furnished bedroom with a bed and shelving, kitchen through the door, at The Mora House",
    },
    "8299": {
      src: "/photos/candace-room-3.jpg",
      alt: "Furnished bedroom with a bed, desk, and window at The Candace House",
    },
  },
  seoHeading: "Furnished rooms for rent in Atlanta, GA",
  seoBody:
    "Looking for an affordable room to rent in Atlanta? We have furnished private bedrooms in shared homes across the entire Atlanta metro area with no long lease and weekly or biweekly pay. Every furnished room on this site is booked through PadSplit, with utilities, parking and Wi-Fi included. Once you're approved, you can move in as soon as the next day.",
  footerLine: "Furnished rooms for rent in Atlanta. Move in as soon as tomorrow.",
  featuredSources: [
    "https://www.padsplit.com/rooms-for-rent/listing/35011",
    "https://www.padsplit.com/rooms-for-rent/listing/8299",
    "https://www.padsplit.com/rooms-for-rent/listing/11889",
    "https://www.padsplit.com/rooms-for-rent/listing/30251",
    "https://www.padsplit.com/rooms-for-rent/listing/152",
    "https://www.padsplit.com/rooms-for-rent/listing/39708",
  ],
  showPageFaq: false,
  showCityList: false,
  referral: {
    code: "B2C2060F",
    overrides: {
      covilla: "0DC68BAB",
    },
  },
  padsplit: {
    searchPath: "atlanta-ga",
    state: "ga",
    bounds: {
      latMax: "33.9698383740918",
      lngMax: "-84.10153814955288",
      latMin: "33.497148095320355",
      lngMin: "-84.56500806987017",
    },
  },
  cities: [
    { slug: "decatur", name: "Decatur" },
    { slug: "stone-mountain", name: "Stone Mountain" },
    { slug: "atlanta", name: "Atlanta" },
    { slug: "east-point", name: "East Point" },
    { slug: "norcross", name: "Norcross" },
    { slug: "marietta", name: "Marietta" },
    { slug: "riverdale", name: "Riverdale" },
    { slug: "avondale-estates", name: "Avondale Estates" },
    { slug: "covington", name: "Covington" },
    { slug: "college-park", name: "College Park" },
    { slug: "kennesaw", name: "Kennesaw" },
    { slug: "canton", name: "Canton" },
    { slug: "jonesboro", name: "Jonesboro" },
    { slug: "fairburn", name: "Fairburn" },
    { slug: "fayetteville", name: "Fayetteville" },
    { slug: "newnan", name: "Newnan" },
    { slug: "snellville", name: "Snellville" },
  ],
};

export const ACTIVE_MARKET = ATL_MARKET;
