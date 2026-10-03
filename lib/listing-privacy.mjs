/**
 * Public-listing rules shared by the site, the scraper, and CI.
 *
 * PadSplit's category "other" mixes exteriors, yards, laundry, transit shots,
 * and marketing graphics. common_space can be a patio. Until there is a vision
 * classifier, the safe rule is to drop every "other" photo, every PNG, and any
 * photo whose description or category names an outdoor place.
 *
 * Stored records are built field-by-field. Raw PadSplit objects are never spread,
 * so street1, zip, title, and description cannot ride along.
 */

export const FORBIDDEN_KEYS = new Set([
  "street1",
  "street2",
  "zip",
  "address",
  "description",
  "title",
]);

/** Street-type tokens that must never be a public place name. */
const STREET_TYPE =
  /\b(st|street|ave|avenue|dr|drive|rd|road|ln|lane|blvd|boulevard|ct|court|cir|circle|pl|place|pkwy|parkway|trl|trail|ter|terrace|hwy|highway|way)\b/i;

/**
 * Outdoor words. "front" does not match "front-load" (a washer, not a facade).
 * Word boundaries keep "yard" from matching inside another word.
 */
const EXTERIOR_WORDS =
  /\b(exterior|front(?![- ]?loads?)|yards?|backyard|patio|porch|driveway|street|curb|facade|façade|outside|aerial|maps?|logos?)\b/i;

const PNG_URL = /\.png(?:$|[?#])/i;

const STREET_SUFFIX =
  "(?:St|ST|Ave|AVE|Rd|RD|Dr|DR|Ct|CT|Ln|LN|Way|WAY|Blvd|BLVD|Cir|CIR|Pl|PL|Trl|TRL|Pkwy|PKWY|Street|Avenue|Road|Drive|Court|Lane|Boulevard|Circle|Place|Trail|Parkway)";

const HOUSE_NUMBER = new RegExp(
  `\\b\\d{2,6}\\s+[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){0,4}\\s+${STREET_SUFFIX}\\b`
);

/** "Meadow Lake Commons CT" / "Lake Commons CT" — a street name with no house number. */
const STREET_PLACE = new RegExp(
  `\\b[A-Z][a-z]+(?:\\s+[A-Z][a-z]+){0,4}\\s+${STREET_SUFFIX}\\b`
);

/** A ZIP in an address, not a bare 5-digit house id like "35011". */
const ZIP_IN_ADDRESS = /\b(?:[A-Z]{2}\s+\d{5}(?:-\d{4})?|\d{5}-\d{4})\b/;

const COORD_KEY = /^(lat|lng|latitude|longitude)$/i;

export const STREET_BLOCKLIST = "data/.street1-blocklist";

export function isStreetishPlace(value) {
  if (value == null) return false;
  const text = String(value).trim();
  if (!text) return false;
  if (STREET_TYPE.test(text)) return true;
  if (/\d/.test(text)) return true;
  return false;
}

export function roundCoord(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) return value;
  return Math.round(value * 100) / 100;
}

export function coordTooPrecise(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    const fraction = String(value).split(".")[1];
    return !!fraction && fraction.length > 2;
  }
  if (typeof value === "string" && /^-?\d+\.\d{3,}$/.test(value.trim())) return true;
  return false;
}

function photoBits(photo) {
  const url = String(photo?.url || photo?.location || "");
  const category = String(photo?.category || "");
  const description = typeof photo?.description === "string" ? photo.description : "";
  return { url, category, description };
}

/** True when a photo must not appear in any gallery, OG image, or page payload. */
export function dropPhoto(photo) {
  const { url, category, description } = photoBits(photo);
  const cat = category.toLowerCase();
  if (cat === "other") return true;
  if (PNG_URL.test(url)) return true;
  if (/\b(logo|marketing)\b/i.test(`${description} ${category}`)) return true;
  if (/\b(exterior|frontage|outdoor|patio|porch|backyard|driveway)\b/i.test(cat)) return true;
  if (EXTERIOR_WORDS.test(description)) return true;
  if (EXTERIOR_WORDS.test(category)) return true;
  return false;
}

/** A short public label. Never the raw PadSplit description. */
export function safeLabel(photo) {
  const { category, description } = photoBits(photo);
  const text = `${description} ${category}`.toLowerCase();
  const map = [
    [/kitchen/, "Kitchen"],
    [/bath|shower|restroom/, "Bathroom"],
    [/dining/, "Dining room"],
    [/living|family\s*room/, "Living room"],
    [/\bden\b/, "Den"],
    [/laundry|washer|dryer/, "Laundry"],
    [/bed\s*room|bedroom/, "Bedroom"],
  ];
  for (const [re, label] of map) if (re.test(text)) return label;
  return "Common area";
}

export function publicPhoto(photo) {
  if (!photo || dropPhoto(photo)) return null;
  const { url, category } = photoBits(photo);
  if (!url) return null;
  const out = {
    url,
    category: category || "common_space",
    label: photo.label || safeLabel(photo),
  };
  if (photo.primary) out.primary = true;
  if (typeof photo.width === "number") out.width = photo.width;
  if (typeof photo.height === "number") out.height = photo.height;
  return out;
}

function keptUrl(photo, dropped) {
  const url = typeof photo === "string" ? photo : photo?.url || photo?.location;
  if (!url) return null;
  if (dropped?.has(url)) return null;
  const record = typeof photo === "string" ? { url, category: "bedroom", description: "" } : photo;
  if (dropPhoto({ ...record, url })) return null;
  return url;
}

export function publicRoom(room, dropped) {
  const pictures = Array.isArray(room?.pictures)
    ? room.pictures
    : Array.isArray(room?.photos)
      ? room.photos
      : [];
  const photos = [];
  for (const picture of pictures) {
    const url = keptUrl(picture, dropped);
    if (!url || photos.includes(url)) continue;
    photos.push(url);
    if (photos.length >= 6) break;
  }
  let image = keptUrl(room?.image ? { url: room.image, category: "bedroom" } : null, dropped);
  if (!image) image = photos[0] ?? null;

  const name = typeof room?.name === "string" ? room.name.trim() : "";
  const promo =
    room?.promo && typeof room.promo === "object"
      ? {
          percentOff: room.promo.percentOff ?? null,
          durationWeeks: room.promo.durationWeeks ?? null,
        }
      : null;

  return {
    id: room?.id ?? null,
    padIndex: room?.padIndex ?? null,
    pagePosition: room?.pagePosition ?? null,
    applyIndex: room?.applyIndex ?? null,
    name: name && !leakReason(name) ? name : null,
    roomNumber: room?.roomNumber ?? null,
    weeklyRate: room?.weeklyRate ?? null,
    originalWeeklyRate: room?.originalWeeklyRate ?? null,
    promo,
    noMoveInFee: room?.noMoveInFee === true,
    recommendedPrice: room?.recommendedPrice ?? null,
    bathroomType: room?.bathroomType ?? null,
    bedSize: room?.bedSize ?? null,
    roomSize: room?.roomSize ?? null,
    workspace: !!room?.workspace,
    miniFridge: !!room?.miniFridge,
    privateAccess: !!room?.privateAccess,
    climateControl: room?.climateControl ?? null,
    windows: room?.windows ?? null,
    status: room?.status ?? null,
    detailedStatus:
      typeof room?.detailedStatus === "string" && !leakReason(room.detailedStatus)
        ? room.detailedStatus
        : null,
    moveInDate: room?.moveInDate ?? null,
    image,
    photos,
    available: room?.available === true || room?.status === 1,
  };
}

/**
 * Neighborhood written to availability.json. A street-like scrape is discarded
 * in favor of the hand-entered name in houses.json. Neither is written if both
 * look like a street.
 */
export function publicNeighborhood(live, seed) {
  const scraped = (live ?? "").trim();
  if (scraped && !isStreetishPlace(scraped)) return scraped;
  const hand = (seed ?? "").trim();
  if (hand && !isStreetishPlace(hand)) return hand;
  return "";
}

export function publicImage(url, dropped) {
  if (typeof url !== "string" || !url) return undefined;
  if (dropped?.has(url)) return undefined;
  if (dropPhoto({ url, category: "interior", description: "" })) return undefined;
  return url;
}

/**
 * Whitelist a scraped (or previously stored) house. Returns the public record
 * and every photo URL that was removed.
 */
export function sanitizeLiveHouse(raw, seedNeighborhood) {
  const dropped = new Set();
  const noteDrop = (photo) => {
    const url = photo?.url || photo?.location;
    if (url) dropped.add(url);
  };

  const commonAreas = [];
  for (const photo of raw?.commonAreas || []) {
    const kept = publicPhoto(photo);
    if (kept) commonAreas.push(kept);
    else noteDrop(photo);
  }
  const carousel = [];
  for (const photo of raw?.carousel || []) {
    const kept = publicPhoto(photo);
    if (kept) carousel.push(kept);
    else noteDrop(photo);
  }

  const rooms = (raw?.rooms || []).map((room) => publicRoom(room, dropped));
  for (const room of raw?.rooms || []) {
    const urls = [
      room?.image,
      ...(Array.isArray(room?.photos) ? room.photos : []),
      ...(Array.isArray(room?.pictures) ? room.pictures.map((p) => p?.url || p?.location) : []),
    ];
    const kept = new Set(
      (rooms.find((r) => r.id === room.id)?.photos || []).concat(
        rooms.find((r) => r.id === room.id)?.image || []
      )
    );
    for (const url of urls) if (url && !kept.has(url)) dropped.add(url);
  }

  const cappedAreas = commonAreas.slice(0, 16);
  const cappedCarousel = carousel.slice(0, 8);

  const neighborhood = publicNeighborhood(raw?.neighborhood, seedNeighborhood);
  const city = typeof raw?.city === "string" && !isStreetishPlace(raw.city) ? raw.city : undefined;
  const image = publicImage(raw?.image, dropped);
  const url = typeof raw?.url === "string" && !leakReason(raw.url) ? raw.url : undefined;

  const house = {
    rooms,
    commonAreas: cappedAreas,
    carousel: cappedCarousel,
    roomsAvailable: raw?.roomsAvailable ?? rooms.filter((r) => r.available).length,
    fromPrice: raw?.fromPrice ?? null,
    priceUnit: raw?.priceUnit === "month" ? "month" : "week",
    available: raw?.available === true || (raw?.roomsAvailable ?? 0) > 0,
    rating: raw?.rating ?? null,
    checkedAt: raw?.checkedAt ?? null,
  };
  if (neighborhood) house.neighborhood = neighborhood;
  if (city) house.city = city;
  if (image) house.image = image;
  if (url) house.url = url;
  if (raw?.utilitiesIncluded != null) house.utilitiesIncluded = !!raw.utilitiesIncluded;
  if (raw?.stale) house.stale = true;
  if (typeof raw?.lastError === "string" && raw.lastError && !leakReason(raw.lastError)) {
    house.lastError = raw.lastError.slice(0, 180);
  }
  return { house, removedUrls: [...dropped] };
}

export function leakReason(value) {
  if (typeof value !== "string" || !value) return null;
  if (HOUSE_NUMBER.test(value)) return "house number";
  if (STREET_PLACE.test(value)) return "street name";
  if (ZIP_IN_ADDRESS.test(value)) return "zip";
  return null;
}

/**
 * Walk a JSON value. Returns leak descriptions. Does not include the offending
 * text when the hit is only a forbidden key or a too-precise coordinate.
 */
export function leaksInData(value, path = "$") {
  const hits = [];
  const visit = (node, here) => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${here}[${i}]`));
      return;
    }
    if (!node || typeof node !== "object") {
      if (typeof node === "string") {
        const reason = leakReason(node);
        if (reason) hits.push(`${here}: ${reason}`);
      }
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      const next = `${here}.${key}`;
      if (FORBIDDEN_KEYS.has(key.toLowerCase())) hits.push(`${next}: forbidden key ${key}`);
      if (COORD_KEY.test(key) && coordTooPrecise(child)) hits.push(`${next}: lat/lng beyond 2 decimals`);
      visit(child, next);
    }
  };
  visit(value, path);
  return hits;
}

const FORBIDDEN_KEY_IN_TEXT = /"(street1|street2|zip|address)"\s*:/gi;
const PRECISE_COORD_IN_TEXT = /"(lat|lng|latitude|longitude)"\s*:\s*-?\d+\.\d{3,}/gi;

/**
 * Scan built HTML, RSC, and JSON text. Document titles and meta descriptions
 * are not PadSplit fields, so those keys are not treated as leaks here — they
 * are banned in committed data, which is what gets serialized into the page.
 */
export function leaksInText(text, blocklist = []) {
  const hits = [];
  if (FORBIDDEN_KEY_IN_TEXT.test(text)) hits.push("forbidden address key");
  FORBIDDEN_KEY_IN_TEXT.lastIndex = 0;
  if (PRECISE_COORD_IN_TEXT.test(text)) hits.push("lat/lng beyond 2 decimals");
  PRECISE_COORD_IN_TEXT.lastIndex = 0;
  const reason = leakReason(text);
  if (reason) hits.push(reason);
  for (const secret of blocklist) {
    const needle = secret.trim();
    if (needle.length >= 4 && text.includes(needle)) {
      hits.push("street1 blocklist");
      break;
    }
  }
  return hits;
}
