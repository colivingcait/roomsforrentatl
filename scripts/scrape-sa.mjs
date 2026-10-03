/**
 * San Antonio host list → the same listing read as Atlanta
 * (__NEXT_DATA__ dehydratedState property rooms), written to
 * data/houses-sa.json and data/availability-sa.json.
 *
 * House ids come from the host search API, not the public page (that page
 * only shows a handful). About 4 seconds between requests. A failed house
 * keeps its last-known row instead of being blanked.
 */
import { readFileSync, writeFileSync, existsSync } from "fs";

const SEARCH = "https://api.padsplit.com/api/property_search/";
const SEARCH_CODE = "935a685108fc43c";
const CITY_SLUG = "san-antonio-tx";
const PAGE_SIZE = 50;
const PAUSE_MS = 4000;
const HOUSES_PATH = "data/houses-sa.json";
const AVAIL_PATH = "data/availability-sa.json";

/** City slugs that count as the San Antonio metro. The API field is city_slug. */
const SA_METRO = new Set([
  "san-antonio-tx",
  "live-oak-tx",
  "converse-tx",
  "universal-city-tx",
  "schertz-tx",
  "cibolo-tx",
  "selma-tx",
  "leon-valley-tx",
  "balcones-heights-tx",
  "alamo-heights-tx",
  "terrell-hills-tx",
  "castle-hills-tx",
  "helotes-tx",
  "shavano-park-tx",
  "hollywood-park-tx",
  "windcrest-tx",
  "kirby-tx",
  "china-grove-tx",
  "elmendorf-tx",
  "st-hedwig-tx",
  "grey-forest-tx",
  "fair-oaks-ranch-tx",
]);

const NICKNAMES = [
  "Alamo",
  "Mission",
  "Pecan",
  "Bluebonnet",
  "Mesquite",
  "Cypress",
  "Magnolia",
  "Salado",
  "Acequia",
  "Lantana",
  "Esperanza",
  "Fiesta",
  "Mercado",
  "Cactus",
  "Yucca",
  "Maverick",
  "Sycamore",
  "Noche",
  "Sol",
  "Palmetto",
];

const STREET_TYPE =
  /\b(st|street|ave|avenue|dr|drive|rd|road|ln|lane|blvd|boulevard|ct|court|cir|circle|pl|place|pkwy|parkway|trl|trail|ter|terrace|hwy|highway)\b/i;

/** Drop PadSplit category `other`, and common-space shots that read as outside. */
const EXTERIOR_DESC =
  /outside|\byard\b|patio|porch|\bstreet\b|facade|façade|\bmap\b|\blogo\b|marketing|exterior|frontage/i;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function nicknameFor(id) {
  let hash = 2166136261;
  const text = String(id);
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return NICKNAMES[(hash >>> 0) % NICKNAMES.length];
}

function snap(n) {
  if (typeof n !== "number" || !Number.isFinite(n)) return undefined;
  return Math.round(n * 100) / 100;
}

function placeOk(value) {
  const text = (value || "").trim();
  if (!text) return false;
  if (STREET_TYPE.test(text)) return false;
  if (/\d/.test(text)) return false;
  return true;
}

function publicPlace(neighborhood, city) {
  const hood = placeOk(neighborhood) ? neighborhood.trim() : "";
  const cityName = placeOk((city || "").replace(/,?\s*tx$/i, ""))
    ? (city || "").replace(/,?\s*tx$/i, "").trim()
    : "";
  return {
    neighborhood: hood,
    city: cityName || "San Antonio",
  };
}

function publicPhotoDescription(desc) {
  if (typeof desc !== "string") return null;
  const text = desc.trim();
  if (!text || text.length > 80) return null;
  if (/\d/.test(text) || STREET_TYPE.test(text)) return null;
  return text;
}

function publicRoomName(name) {
  if (typeof name !== "string") return null;
  const text = name.trim();
  if (!text || text.length > 80) return null;
  if (STREET_TYPE.test(text) || /\d{2,}/.test(text)) return null;
  return text;
}

function photoDropped(category, description) {
  const cat = (category || "").toLowerCase();
  if (cat === "other") return true;
  if (cat === "common_space" && EXTERIOR_DESC.test(description || "")) return true;
  if (/exterior|frontage|outside/.test(cat)) return true;
  return false;
}

async function fetchHostIds() {
  const ids = [];
  const seen = new Set();
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages && page <= 20) {
    if (page > 1) await sleep(PAUSE_MS);
    const url = new URL(SEARCH);
    url.searchParams.set("search_code", SEARCH_CODE);
    url.searchParams.set("city_slug", CITY_SLUG);
    url.searchParams.set("page_size", String(PAGE_SIZE));
    url.searchParams.set("page", String(page));
    const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0" } });
    if (!res.ok) throw new Error(`host search failed (${res.status})`);
    const data = await res.json();
    const reported = Number(data.total_pages);
    if (Number.isFinite(reported) && reported >= 1) totalPages = reported;
    for (const row of data.results || []) {
      const slug = row?.address?.city_slug || row?.address?.citySlug || "";
      if (!SA_METRO.has(slug)) continue;
      const id = row?.id != null ? String(row.id) : "";
      if (!/^\d+$/.test(id) || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
    if (!data.next || page >= totalPages) break;
    page += 1;
  }
  return ids;
}

function loadJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, "utf8"));
}

/**
 * Read one listing's dehydrated property payload and return only public fields.
 * Address, title, description, and raw coordinates stay in `secrets` so the
 * caller can confirm they never land in the saved file.
 */
async function readListing(page) {
  return page.evaluate(() => {
    const data = window.__NEXT_DATA__;
    const queries = data?.props?.pageProps?.dehydratedState?.queries;
    if (!Array.isArray(queries)) return null;
    const hit = queries.find((q) => {
      const key = JSON.stringify(q?.queryKey || "");
      return key.includes("property-listing-info");
    });
    const prop = hit?.state?.data;
    if (!prop || typeof prop !== "object") return null;
    const addr = prop.address || {};
    const rooms = Array.isArray(prop.rooms) ? prop.rooms : [];
    const pictures = Array.isArray(prop.pictures) ? prop.pictures : [];
    const baths = Array.isArray(prop.bathroomList) ? prop.bathroomList : [];
    return {
      secrets: {
        street1: addr.street1 || "",
        street2: addr.street2 || "",
        zip: addr.zip || "",
        title: prop.name || "",
        description: prop.description || "",
        lat: prop.lat ?? null,
        lng: prop.lng ?? null,
      },
      public: {
        neighborhood: addr.neighborhood || "",
        city: addr.city || "",
        citySlug: addr.citySlug || addr.city_slug || "",
        lat: prop.lat ?? null,
        lng: prop.lng ?? null,
        bedrooms: prop.bedrooms ?? null,
        bathrooms: prop.bathrooms ?? null,
        pictures: pictures.map((p) => ({
          url: p.location || "",
          category: p.category || "common_space",
          description: p.description || "",
          width: p.imageWidth ?? null,
          height: p.imageHeight ?? null,
          primary: !!p.primary,
        })),
        bathroomsPics: baths.flatMap((b) =>
          (b.pictures || []).map((p) => ({
            url: p.location || "",
            category: "bathroom",
            description: p.description || "Bathroom",
            width: p.imageWidth ?? null,
            height: p.imageHeight ?? null,
          }))
        ),
        rooms: rooms.map((r, i) => ({
          id: r.id,
          index: i,
          roomNumber: r.roomNumber ?? null,
          name: r.name || "",
          status: r.status ?? null,
          detailedStatus: r.detailedStatus ?? null,
          totalWeeklyRate: r.totalWeeklyRate ?? null,
          basePrice: r.basePrice ?? null,
          totalPromoAmount: r.totalPromoAmount ?? null,
          priceDropPercentage: r.activePromo?.priceDropPercentage ?? null,
          durationInWeeks: r.activePromo?.durationInWeeks ?? null,
          moveInFee: r.moveInFee ?? null,
          recommendedPrice: r.recommendedPrice ?? null,
          startMoveInDate: r.startMoveInDate ?? null,
          amenities: r.amenities || {},
          pictures: (r.pictures || []).map((p) => ({
            url: p.location || "",
            category: p.category || "bedroom",
            description: p.description || "",
            width: p.imageWidth ?? null,
            height: p.imageHeight ?? null,
            primary: !!p.primary,
          })),
        })),
      },
    };
  });
}

function toPhoto(raw) {
  if (!raw?.url || !/^https:\/\//.test(raw.url)) return null;
  if (photoDropped(raw.category, raw.description)) return { dropped: true };
  return {
    dropped: false,
    photo: {
      url: raw.url,
      category: raw.category || "other",
      description: publicPhotoDescription(raw.description),
      primary: !!raw.primary,
      width: raw.width ?? null,
      height: raw.height ?? null,
    },
  };
}

function mapRoom(raw) {
  const a = raw.amenities || {};
  const photos = [];
  let dropped = 0;
  for (const pic of raw.pictures || []) {
    const mapped = toPhoto(pic);
    if (!mapped) continue;
    if (mapped.dropped) {
      dropped += 1;
      continue;
    }
    photos.push(mapped.photo);
  }
  const listRate = raw.totalWeeklyRate ?? raw.basePrice ?? null;
  const effective = raw.totalPromoAmount ?? listRate;
  const hasPromo =
    typeof raw.priceDropPercentage === "number" &&
    effective != null &&
    listRate != null &&
    effective < listRate;
  const primary = photos.find((p) => p.primary) || photos[0];
  return {
    dropped,
    room: {
      id: raw.id,
      padIndex: raw.index + 1,
      pagePosition: raw.index + 1,
      applyIndex: null,
      name: publicRoomName(raw.name),
      roomNumber: raw.roomNumber ?? null,
      weeklyRate: effective,
      originalWeeklyRate: hasPromo ? listRate : null,
      promo: hasPromo ? { percentOff: raw.priceDropPercentage, durationWeeks: raw.durationInWeeks ?? null } : null,
      noMoveInFee: raw.moveInFee === 0,
      recommendedPrice: raw.recommendedPrice ?? null,
      bathroomType: a.bathroomType ?? null,
      bedSize: a.bedSize ?? null,
      roomSize: a.roomSize ?? null,
      workspace: !!a.workspace,
      miniFridge: !!a.miniFridge,
      privateAccess: !!a.privateAccess,
      climateControl: a.climateControl ?? null,
      windows: a.windows ?? null,
      status: raw.status ?? null,
      detailedStatus: raw.detailedStatus ?? null,
      moveInDate: raw.startMoveInDate ?? null,
      image: primary?.url ?? null,
      photos: photos.map((p) => p.url).slice(0, 6),
    },
  };
}

function leaks(blob, needle) {
  const text = (needle || "").trim();
  if (text.length < 4) return false;
  const escaped = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (text.length >= 24) return blob.includes(text);
  return new RegExp(`(?:^|[^A-Za-z0-9])${escaped}(?:[^A-Za-z0-9]|$)`).test(blob);
}

function assertNoSecrets(saved, secrets) {
  const blob = JSON.stringify(saved);
  for (const needle of [secrets.street1, secrets.street2, secrets.zip, secrets.title, secrets.description]) {
    if (leaks(blob, needle)) {
      throw new Error(`refusing to save a private field (${String(needle).slice(0, 24)}…)`);
    }
  }
  if (typeof secrets.lat === "number" && blob.includes(String(secrets.lat)) && snap(secrets.lat) !== secrets.lat) {
    throw new Error("refusing to save a raw latitude");
  }
  if (typeof secrets.lng === "number" && blob.includes(String(secrets.lng)) && snap(secrets.lng) !== secrets.lng) {
    throw new Error("refusing to save a raw longitude");
  }
}

export async function scrapeSanAntonio({ chromium, UA, CHALLENGE, ART }) {
  const prevAvail = loadJson(AVAIL_PATH, { houses: {} });
  const prevHouses = loadJson(HOUSES_PATH, { houses: [] });
  const prevById = new Map((prevHouses.houses || []).map((h) => [String(h.id), h]));

  let ids;
  try {
    ids = await fetchHostIds();
  } catch (err) {
    console.log(`✗ host search: ${err}`);
    console.log("Keeping the last-known San Antonio files.");
    return prevHouses.houses?.length ? 0 : 2;
  }
  if (!ids.length) {
    console.log("✗ host search returned no San Antonio houses. Keeping last-known files.");
    return prevHouses.houses?.length ? 0 : 2;
  }
  console.log(`Host list: ${ids.join(", ")}`);

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
    timezoneId: "America/Chicago",
    viewport: { width: 1280, height: 1800 },
  });

  const houses = [];
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
      if (listing.public.citySlug && !SA_METRO.has(listing.public.citySlug)) {
        throw new Error(`city ${listing.public.citySlug} is outside the San Antonio metro`);
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

      const place = publicPlace(listing.public.neighborhood, listing.public.city);
      const available = rooms.filter((r) => r.status === 1);
      const fromPrice = available.reduce(
        (min, r) => (r.weeklyRate != null && r.weeklyRate < min ? r.weeklyRate : min),
        Infinity
      );
      const lead =
        commonAreas.find((p) => /kitchen|dining/i.test(`${p.description || ""} ${p.category}`))?.url ||
        rooms.find((r) => r.image)?.image ||
        commonAreas[0]?.url ||
        "";

      const seed = {
        id,
        padsplitUrl,
        name: nicknameFor(id),
        neighborhood: place.neighborhood,
        city: place.city,
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
        neighborhood: place.neighborhood,
        city: place.city,
        image: lead,
        available: available.length > 0,
        checkedAt: updatedAt,
        url: padsplitUrl,
        exteriorPhotosDropped: dropped,
      };
      assertNoSecrets({ seed, row }, listing.secrets);
      houses.push(seed);
      live[id] = row;
      okCount += 1;
      console.log(
        `✓ ${id} ${seed.name} (${place.neighborhood || place.city}): ${rooms.length} rooms, ${commonAreas.length + rooms.reduce((n, r) => n + r.photos.length, 0)} photos, dropped ${dropped} exterior`
      );
    } catch (err) {
      const carriedHouse = prevById.get(id);
      const carriedLive = prevAvail.houses?.[id];
      if (carriedHouse && carriedLive) {
        houses.push(carriedHouse);
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
    console.log("No San Antonio listing rendered. Leaving the files untouched.");
    return 2;
  }

  const houseFile = {
    _README:
      "San Antonio homes from the host PadSplit search. The scraper rewrites this file. Names are nicknames, not PadSplit titles. lat/lng are neighborhood centers rounded to 2 decimals.",
    houses,
  };
  const availFile = {
    updatedAt,
    exteriorPhotosDropped: droppedTotal,
    houses: live,
  };
  writeFileSync(HOUSES_PATH, JSON.stringify(houseFile, null, 2) + "\n");
  writeFileSync(AVAIL_PATH, JSON.stringify(availFile, null, 2) + "\n");
  console.log(`\n==== ${okCount}/${ids.length} San Antonio houses, ${droppedTotal} exterior photos dropped ====`);
  return 0;
}
