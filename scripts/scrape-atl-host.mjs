/**
 * Host's Atlanta-metro houses, added beside the curated six.
 *
 * Confirmed source: rooms-for-rent/atlanta-ga?searchCode=935a685108fc43c
 * Ids come from
 *   GET /api/property_search/?search_code=935a685108fc43c&city_slug=atlanta-ga&page_size=50
 * paginated. That search center also returns Decatur and Stone Mountain.
 * A row is kept only when address.city_slug is an Atlanta-metro Georgia slug.
 * The referral code on that page link is ignored. Curated houses are never
 * rewritten. Meadow stays removed and is skipped if the search returns it.
 * About 4 seconds between requests. A failed house keeps its last-known row.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";
import { photoSlot, sanitizeLiveHouse } from "../lib/listing-privacy.mjs";
import { assertNoSecrets, mapRoom, readListing, snap, toPhoto } from "./scrape-sa.mjs";

const SEARCH = "https://api.padsplit.com/api/property_search/";
const SEARCH_CODE = "935a685108fc43c";
const PAGE_SIZE = 50;
const PAUSE_MS = 4000;
const HOUSES_PATH = "data/houses.json";
const AVAIL_PATH = "data/availability.json";

/** Hand-curated homes. Their names, copy, and availability stay on the old scrape. */
const CURATED = new Set(["35011", "8299", "11889", "30251", "152", "39708"]);
const RESERVED_NAMES = new Set(["Mora", "Candace", "Raven", "Meadow", "Chestnut", "Willow"]);

/** The confirmed host search. PadSplit treats this as a center, not a hard city filter. */
const CITY_SLUG = "atlanta-ga";

/** A result is kept only when its own city slug is in this set. */
const ATL_METRO_SET = new Set([
  CITY_SLUG,
  "decatur-ga",
  "stone-mountain-ga",
  "east-point-ga",
  "norcross-ga",
  "marietta-ga",
  "riverdale-ga",
  "avondale-estates-ga",
  "covington-ga",
  "college-park-ga",
  "kennesaw-ga",
  "canton-ga",
  "jonesboro-ga",
  "fairburn-ga",
  "fayetteville-ga",
  "newnan-ga",
  "snellville-ga",
  "smyrna-ga",
  "sandy-springs-ga",
  "roswell-ga",
  "alpharetta-ga",
  "dunwoody-ga",
  "brookhaven-ga",
  "tucker-ga",
  "clarkston-ga",
  "lithonia-ga",
  "conyers-ga",
  "lawrenceville-ga",
  "duluth-ga",
  "chamblee-ga",
  "doraville-ga",
  "union-city-ga",
  "morrow-ga",
  "stockbridge-ga",
  "woodstock-ga",
  "acworth-ga",
  "douglasville-ga",
  "buford-ga",
  "suwanee-ga",
  "stonecrest-ga",
  "south-fulton-ga",
]);

const NICKNAMES = [
  "Peach",
  "Dogwood",
  "Azalea",
  "Magnolia",
  "Hickory",
  "Redbud",
  "Laurel",
  "Juniper",
  "Maple",
  "Holly",
  "Clover",
  "Brook",
  "Ridge",
  "Grove",
  "Lantern",
  "Copper",
  "Amber",
  "Indigo",
  "Pecan",
  "Sweetgum",
  "Camellia",
  "Gardenia",
  "Wisteria",
  "Fern",
  "Cedar",
  "Pine",
  "Oak",
  "Ivy",
  "Dahlia",
];

const STREET_TYPE =
  /\b(st|street|ave|avenue|dr|drive|rd|road|ln|lane|blvd|boulevard|ct|court|cir|circle|pl|place|pkwy|parkway|trl|trail|ter|terrace|hwy|highway)\b/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

function nicknameMap(ids) {
  const used = new Set(RESERVED_NAMES);
  const out = new Map();
  for (const id of [...ids].sort()) {
    let hash = 2166136261;
    for (let i = 0; i < id.length; i++) {
      hash ^= id.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    hash >>>= 0;
    let name = NICKNAMES[hash % NICKNAMES.length];
    let step = 0;
    while (used.has(name) && step < NICKNAMES.length) {
      step += 1;
      name = NICKNAMES[(hash + step) % NICKNAMES.length];
    }
    used.add(name);
    out.set(id, name);
  }
  return out;
}

function placeOk(value) {
  const text = (value || "").trim();
  if (!text) return false;
  if (STREET_TYPE.test(text) || /\d/.test(text)) return false;
  return true;
}

/** City only. Neighborhoods and streets stay off the card. */
function submarket(city) {
  const name = (city || "").replace(/,?\s*ga$/i, "").trim();
  return placeOk(name) ? name : "Atlanta";
}

async function fetchPage(page) {
  const url = new URL(SEARCH);
  url.searchParams.set("search_code", SEARCH_CODE);
  url.searchParams.set("city_slug", CITY_SLUG);
  url.searchParams.set("page_size", String(PAGE_SIZE));
  url.searchParams.set("page", String(page));
  const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`host search ${CITY_SLUG} failed (${res.status})`);
  return res.json();
}

async function fetchHostIds() {
  const ids = [];
  const seen = new Set();
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 20) {
    if (page > 1) await sleep(PAUSE_MS);
    const data = await fetchPage(page);
    const reported = Number(data.total_pages);
    if (Number.isFinite(reported) && reported >= 1) totalPages = reported;
    for (const row of data.results || []) {
      const citySlug = row?.address?.city_slug || row?.address?.citySlug || "";
      if (!ATL_METRO_SET.has(citySlug)) continue;
      const id = row?.id != null ? String(row.id) : "";
      if (!/^\d+$/.test(id) || seen.has(id) || CURATED.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    if (!data.next || page >= totalPages) break;
    page += 1;
  }
  return ids;
}

function previousHostIds(housesFile) {
  return (housesFile.houses || []).filter((h) => h.host === true && !CURATED.has(String(h.id))).map((h) => String(h.id));
}

/**
 * Refresh host houses inside the Atlanta data files.
 * Curated house objects and their availability rows are left as they were.
 */
export async function scrapeAtlantaHost({ chromium, UA, CHALLENGE, ART }) {
  const prevHouses = loadJson(HOUSES_PATH, { houses: [] });
  const prevAvail = loadJson(AVAIL_PATH, { houses: {} });
  const prevById = new Map((prevHouses.houses || []).map((h) => [String(h.id), h]));
  const curated = (prevHouses.houses || []).filter((h) => CURATED.has(String(h.id)) && h.host !== true);

  let ids;
  try {
    ids = await fetchHostIds();
  } catch (err) {
    console.log(`✗ Atlanta host search: ${err}`);
    console.log("Keeping the last-known host houses.");
    return previousHostIds(prevHouses).length ? 0 : 2;
  }
  if (!ids.length) {
    console.log("✗ Atlanta host search returned no metro houses. Keeping last-known host houses.");
    return previousHostIds(prevHouses).length ? 0 : 2;
  }
  console.log(`Atlanta host list: ${ids.join(", ")}`);
  const names = nicknameMap(ids);

  const launchArgs = ["--no-sandbox", "--disable-blink-features=AutomationControlled"];
  let browser;
  try {
    browser = await chromium.launch({ args: launchArgs });
  } catch {
    browser = await chromium.launch({ channel: "chrome", args: launchArgs });
  }
  const ctx = await browser.newContext({
    userAgent: UA,
    locale: "en-US",
    timezoneId: "America/New_York",
    viewport: { width: 1280, height: 1800 },
  });

  const seeds = [];
  const live = {};
  let droppedTotal = 0;
  let okCount = 0;
  const updatedAt = new Date().toISOString();

  for (let i = 0; i < ids.length; i++) {
    if (i > 0) await sleep(PAUSE_MS);
    const id = ids[i];
    const padsplitUrl = `https://www.padsplit.com/rooms-for-rent/listing/${id}`;
    const page = await ctx.newPage();
    try {
      let status = null;
      let text = "";
      for (let attempt = 1; attempt <= 3; attempt++) {
        const resp = await page.goto(padsplitUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
        status = resp ? resp.status() : null;
        await page
          .waitForFunction(
            () => {
              const d = window.__NEXT_DATA__;
              if (!d) return false;
              const s = JSON.stringify(d);
              return s.includes("dehydratedState") && (s.includes("roomNumber") || s.includes("property-listing-info"));
            },
            { timeout: 15000 }
          )
          .catch(() => {});
        await page.waitForTimeout(800);
        text = await page.evaluate(() => document.body?.innerText || "");
        if (CHALLENGE.test(text) || (status && status >= 400)) break;
        const ready = await page.evaluate(() => {
          const queries = window.__NEXT_DATA__?.props?.pageProps?.dehydratedState?.queries;
          return Array.isArray(queries) && queries.some((q) => JSON.stringify(q?.queryKey || "").includes("property-listing-info"));
        });
        if (ready) break;
        if (attempt < 3) await page.waitForTimeout(1500);
      }
      if (CHALLENGE.test(text) || (status && status >= 400)) {
        throw new Error(`blocked or error (status ${status})`);
      }
      const listing = await readListing(page);
      if (!listing) throw new Error("listing payload missing");
      if (listing.public.citySlug && !ATL_METRO_SET.has(listing.public.citySlug)) {
        throw new Error(`city ${listing.public.citySlug} is outside the Atlanta metro`);
      }

      let dropped = 0;
      const commonAreas = [];
      const seen = new Set();
      const pushCommon = (raw) => {
        const mapped = toPhoto(raw);
        if (!mapped) return;
        if (mapped.dropped) {
          dropped += 1;
          return;
        }
        if (seen.has(mapped.photo.url)) return;
        seen.add(mapped.photo.url);
        const cat = (raw.category || "").toLowerCase();
        if (cat === "bedroom" || /bed/.test(cat)) return;
        commonAreas.push(mapped.photo);
      };
      for (const pic of listing.public.pictures) pushCommon(pic);
      for (const pic of listing.public.bathroomsPics) pushCommon(pic);

      const rooms = [];
      for (const raw of listing.public.rooms) {
        const mapped = mapRoom(raw);
        dropped += mapped.dropped;
        rooms.push(mapped.room);
      }
      droppedTotal += dropped;

      const city = submarket(listing.public.city);
      const available = rooms.filter((r) => r.status === 1);
      const fromPrice = available.reduce(
        (min, r) => (r.weeklyRate != null && r.weeklyRate < min ? r.weeklyRate : min),
        Infinity
      );
      const lead =
        commonAreas.find((p) => photoSlot(p) === 0)?.url ||
        rooms.find((r) => r.image)?.image ||
        commonAreas.find((p) => photoSlot(p) === 3)?.url ||
        commonAreas[0]?.url ||
        "";

      const seed = {
        id,
        host: true,
        padsplitUrl,
        name: names.get(id),
        neighborhood: "",
        city,
        image: lead,
        lat: snap(listing.public.lat),
        lng: snap(listing.public.lng),
        amenities: ["Fully furnished", "All utilities + WiFi included", "Washer & dryer"],
        totalRooms: typeof listing.public.bedrooms === "number" ? listing.public.bedrooms : undefined,
        totalBaths: listing.public.bathrooms != null ? Number(listing.public.bathrooms) : undefined,
      };
      const row = {
        rooms,
        commonAreas,
        carousel: [],
        roomsAvailable: available.length,
        fromPrice: Number.isFinite(fromPrice) ? fromPrice : null,
        priceUnit: "week",
        neighborhood: "",
        city,
        image: lead,
        available: available.length > 0,
        checkedAt: updatedAt,
        url: padsplitUrl,
        exteriorPhotosDropped: dropped,
      };
      const { house } = sanitizeLiveHouse(row, "");
      if (house.image) seed.image = house.image;
      house.exteriorPhotosDropped = dropped;
      assertNoSecrets({ seed, row: house }, listing.secrets);
      seeds.push(seed);
      live[id] = house;
      okCount += 1;
      const photoCount = commonAreas.length + rooms.reduce((n, r) => n + (r.photos?.length || 0), 0);
      console.log(
        `✓ ${id} ${seed.name} (${city}): from ${Number.isFinite(fromPrice) ? fromPrice : "booked"}, ${photoCount} photos, dropped ${dropped} exterior`
      );
    } catch (err) {
      const carriedHouse = prevById.get(id);
      const carriedLive = prevAvail.houses?.[id];
      if (carriedHouse?.host === true && carriedLive && !CURATED.has(id)) {
        seeds.push(carriedHouse);
        live[id] = { ...carriedLive, stale: true, lastError: String(err), checkedAt: updatedAt };
        console.log(`✗ ${id}: ${err} — kept last-known`);
      } else {
        console.log(`✗ ${id}: ${err} — no last-known row`);
      }
    } finally {
      await page.close();
    }
  }

  await browser.close();

  if (okCount === 0) {
    console.log("No Atlanta host listing rendered. Leaving curated houses untouched.");
    return previousHostIds(prevHouses).length ? 0 : 2;
  }

  const houseFile = {
    ...prevHouses,
    houses: [...curated, ...seeds],
  };
  const availHouses = { ...(prevAvail.houses || {}) };
  for (const id of previousHostIds(prevHouses)) {
    if (!live[id]) delete availHouses[id];
  }
  Object.assign(availHouses, live);
  const availFile = {
    ...prevAvail,
    updatedAt: prevAvail.updatedAt || updatedAt,
    houses: availHouses,
  };
  writeFileSync(HOUSES_PATH, JSON.stringify(houseFile, null, 2) + "\n");
  writeFileSync(AVAIL_PATH, JSON.stringify(availFile, null, 2) + "\n");
  if (ART) writeFileSync(`${ART}/atl-host-ids.json`, JSON.stringify({ ids, droppedTotal, updatedAt }, null, 2) + "\n");
  console.log(`\n==== ${okCount}/${ids.length} Atlanta host houses, ${droppedTotal} exterior photos dropped ====`);
  return 0;
}
