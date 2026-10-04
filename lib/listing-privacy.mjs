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

/** Configurable named communities. The scan reads this file; the file is not scanned. */
export const COMMUNITY_BLOCKLIST = "data/community-blocklist.json";

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
  // Screenshots and logos arrive as PNG. A PadSplit room photo can also be a
  // PNG; those are the bedroom itself, so a bedroom PNG stays and the rest go.
  if (PNG_URL.test(url) && cat !== "bedroom" && !/\bbedrooms?\b|\bbed\s*rooms?\b/.test(`${description} ${category}`.toLowerCase())) return true;
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

/**
 * Photo category. 0 kitchen, 1 bedroom, 2 bath, 3 other interior.
 * A dining photo is not a kitchen. The gallery itself is galleryOrder:
 * the bed cover, then kitchen, then the other bedrooms, then bath, then commons.
 */
export function photoSlot(photo) {
  const label = typeof photo?.label === "string" ? photo.label : "";
  const category = typeof photo?.category === "string" ? photo.category : "";
  const description = typeof photo?.description === "string" ? photo.description : "";
  const text = `${label} ${category} ${description}`.toLowerCase();
  const bath = /\b(baths?|bathrooms?|shower|restroom)\b/.test(text) || category.toLowerCase() === "bathroom";
  if (/\bkitchen\b/.test(text) && !bath) return 0;
  if (/\bbedrooms?\b|\bbed\s*rooms?\b/.test(text) || category.toLowerCase() === "bedroom") return 1;
  if (bath) return 2;
  return 3;
}

export function orderPublicPhotos(photos) {
  return (photos || [])
    .map((photo, index) => ({ photo, index, slot: photoSlot(photo) }))
    .sort((a, b) => a.slot - b.slot || a.index - b.index)
    .map((row) => row.photo);
}

function bedroomUrls(areas, rooms) {
  const urls = [];
  const open = [];
  const taken = [];
  for (const room of rooms || []) {
    (room?.available ? open : taken).push(room);
  }
  const pushRoom = (room) => {
    const photos = Array.isArray(room?.photos) && room.photos.length ? room.photos : room?.image ? [room.image] : [];
    for (const url of photos) {
      if (url && !dropPhoto({ url, category: "bedroom" })) urls.push(url);
    }
  };
  for (const room of open) pushRoom(room);
  for (const room of taken) pushRoom(room);
  for (const photo of areas || []) {
    if (photo?.url && photoSlot(photo) === 1 && !dropPhoto(photo)) urls.push(photo.url);
  }
  return urls;
}

/**
 * Card and gallery order for every market. The first photo is a bedroom
 * where the bed is the cover (house.image when that URL is a bedroom photo,
 * otherwise the first bedroom). Then the kitchen, the other bedrooms, baths,
 * and the remaining commons. Dining stays with the commons.
 */
export function galleryOrder(house) {
  const areas = house?.commonAreas || [];
  const bedrooms = bedroomUrls(areas, house?.rooms);
  const kitchens = [];
  const baths = [];
  const other = [];
  for (const photo of areas) {
    if (!photo?.url || dropPhoto(photo)) continue;
    const slot = photoSlot(photo);
    if (slot === 0) kitchens.push(photo.url);
    else if (slot === 2) baths.push(photo.url);
    else if (slot === 3) other.push(photo.url);
  }
  const bedSet = new Set(bedrooms);
  const image = typeof house?.image === "string" ? house.image : "";
  const cover = image && bedSet.has(image) ? image : bedrooms[0] || "";
  const sequence = [cover, ...kitchens, ...bedrooms.filter((url) => url !== cover), ...baths, ...other];
  const seen = new Set();
  const out = [];
  for (const url of sequence) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
    if (out.length >= 24) break;
  }
  return out;
}

function coverUrl(areas, rooms, preferred) {
  const bedrooms = bedroomUrls(areas, rooms);
  const jpegs = bedrooms.filter((url) => /\.jpe?g(?:$|[?#])/i.test(url));
  const pool = jpegs.length ? jpegs : bedrooms;
  if (preferred && bedrooms.includes(preferred)) return preferred;
  if (pool.length) return pool[0];
  const kitchen = (areas || []).find((photo) => photoSlot(photo) === 0);
  if (kitchen?.url) return kitchen.url;
  const next = (areas || []).find((photo) => photo?.url);
  return next?.url;
}

export function publicPhoto(photo) {
  if (!photo || dropPhoto(photo)) return null;
  const { url, category } = photoBits(photo);
  if (!url) return null;
  const computed = safeLabel(photo);
  const existing = typeof photo.label === "string" ? photo.label.trim() : "";
  const out = {
    url,
    category: category || "common_space",
    label: !existing || existing === "Common area" ? computed : existing,
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

  const orderedAreas = orderPublicPhotos(commonAreas);
  const cappedAreas = orderedAreas.slice(0, 16);
  const cappedCarousel = carousel.slice(0, 8);

  const neighborhood = publicNeighborhood(raw?.neighborhood, seedNeighborhood);
  // Scraped city is not stored. A one-word match turned "Stone Mountain, GA"
  // into "Mountain, GA", and the public area comes from houses.json.
  // Cover is a bedroom photo: the scored bed when it is still in the set,
  // otherwise the first bedroom. Kitchen leads only when the house has no bedroom.
  const image = publicImage(coverUrl(cappedAreas, rooms, raw?.image) || raw?.image, dropped);
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Whole-word match against the configurable community / subdivision list. */
export function communityLeak(value, names = []) {
  if (typeof value !== "string" || !value) return null;
  for (const name of names) {
    const needle = String(name).trim();
    if (needle.length < 3) continue;
    if (new RegExp(`\\b${escapeRegExp(needle)}\\b`, "i").test(value)) return "named community";
  }
  return null;
}

/**
 * Drone and outdoor filenames. DJI_* is a drone capture; exterior/aerial in
 * the file name is an outdoor shot. Applied to basenames and photo paths.
 */
export function unitFilenameLeak(value) {
  if (typeof value !== "string" || !value) return null;
  if (/dji_/i.test(value)) return "drone filename";
  const base = value.split(/[/\\?#]/).filter(Boolean).pop() || "";
  const pathLike = /[/\\]/.test(value) || /\.(jpe?g|png|webp|gif|heic)$/i.test(base);
  if (pathLike && /exterior|aerial/i.test(base)) return "exterior or aerial filename";
  return null;
}

/**
 * Walk a JSON value. Returns leak descriptions. Does not include the offending
 * text when the hit is only a forbidden key or a too-precise coordinate.
 */
export function leaksInData(value, path = "$", communities = []) {
  const hits = [];
  const visit = (node, here) => {
    if (Array.isArray(node)) {
      node.forEach((item, i) => visit(item, `${here}[${i}]`));
      return;
    }
    if (!node || typeof node !== "object") {
      if (typeof node === "string") {
        const reason = leakReason(node) || communityLeak(node, communities) || unitFilenameLeak(node);
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
export function leaksInText(text, blocklist = [], communities = []) {
  const hits = [];
  if (FORBIDDEN_KEY_IN_TEXT.test(text)) hits.push("forbidden address key");
  FORBIDDEN_KEY_IN_TEXT.lastIndex = 0;
  if (PRECISE_COORD_IN_TEXT.test(text)) hits.push("lat/lng beyond 2 decimals");
  PRECISE_COORD_IN_TEXT.lastIndex = 0;
  const reason = leakReason(text);
  if (reason) hits.push(reason);
  if (communityLeak(text, communities)) hits.push("named community");
  if (/dji_/i.test(text)) hits.push("drone filename");
  if (/\/units\/[^"'\\\s<>]*(?:exterior|aerial)/i.test(text)) hits.push("exterior or aerial filename");
  for (const secret of blocklist) {
    const needle = secret.trim();
    if (needle.length >= 4 && text.includes(needle)) {
      hits.push("street1 blocklist");
      break;
    }
  }
  return hits;
}
