/**
 * Room-search replies. The chat's job is a PadSplit search with the visitor's
 * referral, not a pitch for our few featured rooms. A featured room is added
 * only when it actually matches the ask, and it never leads.
 */
import { availableRooms, getHouses } from "./houses";
import { listingPlace, priceLabel, shortRoomName } from "./format";
import { atlantaSearchUrl, citySearchUrl } from "./site";
import type { FilterStartingPrices } from "./filterPrices";

export type SearchRoomCard = {
  id: string;
  name: string;
  houseName: string;
  location: string;
  price: string | null;
  url: string;
};

export type SearchAnswer = {
  reply: string;
  rooms: SearchRoomCard[];
  chips: string[];
};

type Need = "privateBath" | "roomForTwo" | "fewer" | "instant" | "noFee" | "budget" | "area" | "pickArea";

type Area = { slug: string; label: string; wide: boolean };

const AREAS: { slug: string; label: string; pattern: RegExp; wide?: boolean }[] = [
  { slug: "decatur", label: "Decatur", pattern: /\bdecatur\b/i },
  { slug: "stone-mountain", label: "Stone Mountain", pattern: /\bstone\s+mountain\b/i },
  { slug: "snellville", label: "Snellville", pattern: /\bsnellville\b/i },
  { slug: "marietta", label: "Marietta", pattern: /\bmarietta\b/i },
  { slug: "east-point", label: "East Point", pattern: /\beast\s+point\b/i },
  { slug: "norcross", label: "Norcross", pattern: /\bnorcross\b/i },
  { slug: "college-park", label: "College Park", pattern: /\bcollege\s+park\b/i },
  { slug: "avondale-estates", label: "Avondale Estates", pattern: /\bavondale(?:\s+estates)?\b/i },
  { slug: "kennesaw", label: "Kennesaw", pattern: /\bkennesaw\b/i },
  // These slugs drop the referral. The Atlanta-wide search keeps it.
  { slug: "atlanta", label: "South Atlanta", pattern: /\bsouth\s+atlanta\b/i, wide: true },
  { slug: "atlanta", label: "Buckhead", pattern: /\bbuckhead\b/i, wide: true },
  { slug: "atlanta", label: "Midtown", pattern: /\bmidtown\b/i, wide: true },
  { slug: "atlanta", label: "Atlanta", pattern: /\batlanta\b/i },
];

const AREA_CHIPS = ["Decatur", "Stone Mountain", "South Atlanta", "Snellville", "Atlanta"];

type Featured = {
  id: string;
  roomId: number;
  name: string;
  houseName: string;
  location: string;
  city: string;
  weeklyRate: number | null;
  bath: "private" | "shared";
  noMoveInFee: boolean;
  totalRooms: number | null;
  url: string;
};

function featuredRooms(): Featured[] {
  const out: Featured[] = [];
  for (const h of getHouses()) {
    if (!h.available) continue;
    for (const r of availableRooms(h)) {
      out.push({
        id: `${h.id}-${r.id}`,
        roomId: r.id,
        name: shortRoomName(r),
        houseName: h.name,
        location: listingPlace(h),
        city: h.city ?? "",
        weeklyRate: r.weeklyRate,
        bath: r.bathroomType === "private" ? "private" : "shared",
        noMoveInFee: r.noMoveInFee === true,
        totalRooms: h.totalRooms ?? null,
        url: `/house/${h.id}/room/${r.id}`,
      });
    }
  }
  return out;
}

function matchArea(text: string): Area | null {
  for (const area of AREAS) {
    if (area.pattern.test(text)) return { slug: area.slug, label: area.label, wide: area.wide === true };
  }
  return null;
}

function budgetCap(text: string): number | null {
  const m =
    text.match(/\b(?:under|below|less than|up to|max(?:imum)?|budget(?: of)?)\s*\$?\s*(\d{2,4})\b/i) ||
    text.match(/\$\s*(\d{2,4})\b/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 50 || n > 2000) return null;
  return n;
}

function isPolicyQuestion(text: string): boolean {
  return /\b(credit|approved|approval|application fee|deposit|pets?|animals|service animal|smoking|guests?|house rules|included in (?:the )?rent|move-?in cost|cost to move|how much does it cost|how much is the rent|what(?:'s| is) included|phone|call you|lease|minimum stay|screening|pay stub|eviction|felony|security deposit)\b/i.test(
    text
  );
}

function classify(text: string): { need: Need; area: Area | null; cap: number | null } | null {
  const raw = text.trim();
  if (!raw) return null;
  if (/^location$/i.test(raw)) return { need: "pickArea", area: null, cap: null };

  const lower = raw.toLowerCase();
  const privateBath = /\bprivate\s+bath(?:room)?s?\b/.test(lower);
  const noFee = /\b(?:no|without a|skip the(?: one-time| host)?|zero) move-?in fee\b/.test(lower);
  const roomForTwo = /\b(?:room for two|rooms for two|double occupancy|two people|for two people|my partner)\b/.test(
    lower
  );
  const fewer = /\b(?:fewer housemates|5 or fewer|five or fewer|fewer roommates)\b/.test(lower);
  const instant = /\b(?:book instantly|instant book(?:ing)?|instant move-?in|book today|move in today)\b/.test(lower);
  const budget =
    /\b(?:lowest price|cheapest|cheap rooms?|under \$?\d+|budget)\b/.test(lower) ||
    /\bwhat(?:'s| is) available(?: now)?\b/.test(lower) ||
    /\bshow me (?:the )?rooms\b/.test(lower);

  if (!privateBath && !noFee && !roomForTwo && !fewer && !instant && !budget) {
    if (isPolicyQuestion(lower)) return null;
    const area = matchArea(raw);
    if (!area) return null;
    return { need: "area", area, cap: null };
  }

  return { need: privateBath ? "privateBath" : noFee ? "noFee" : roomForTwo ? "roomForTwo" : fewer ? "fewer" : instant ? "instant" : "budget", area: matchArea(raw), cap: budget ? budgetCap(raw) : null };
}

function filterFor(need: Need): Record<string, string> {
  switch (need) {
    case "privateBath":
      return { bathroomType: "private_bathroom" };
    case "roomForTwo":
      return { roomFeatures: "allow_multiple_occupants" };
    case "fewer":
      return { roomsCount: "6" };
    case "instant":
      return { moveInTime: "instant_move_in" };
    case "noFee":
      return { noMoveInFee: "true" };
    default:
      return {};
  }
}

function placePhrase(area: Area | null): string {
  if (!area || area.wide) return "across Atlanta";
  return `in ${area.label}`;
}

function lead(need: Need, area: Area | null): string {
  const place = placePhrase(area);
  switch (need) {
    case "privateBath":
      return `Here are private-bath rooms ${place}`;
    case "roomForTwo":
      return `Here are rooms for two ${place}`;
    case "fewer":
      return `Here are homes with 5 or fewer housemates ${place}`;
    case "instant":
      return `Here are instant-book rooms ${place}`;
    case "noFee":
      return `Here are rooms with no move-in fee ${place}`;
    case "budget":
      return `Here are the lowest-priced rooms ${place}`;
    case "area":
      return area && !area.wide ? `Here are rooms in ${area.label}` : "Here are rooms across Atlanta";
    default:
      return `Here are rooms ${place}`;
  }
}

function livePrice(need: Need, area: Area | null, prices: FilterStartingPrices): number | null {
  // A narrower city search doesn't share the Atlanta-wide starting price.
  // /rooms-for-rent/atlanta-ga does — it's the same search the tiles use.
  if (area && !area.wide && area.slug !== "atlanta") return null;
  switch (need) {
    case "privateBath":
      return prices.privateBath;
    case "roomForTwo":
      return prices.roomForTwo;
    case "fewer":
      return prices.fewer;
    case "instant":
      return prices.instant;
    case "noFee":
      return prices.noFee;
    case "budget":
    case "area":
      return prices.lowest;
    default:
      return null;
  }
}

function withPrice(sentence: string, price: number | null): string {
  if (price != null && Number.isFinite(price) && price > 0) {
    return `${sentence}, from $${Math.round(price)}/wk.`;
  }
  return `${sentence}.`;
}

function inArea(room: Featured, area: Area): boolean {
  const city = room.city.toLowerCase();
  if (area.label === "South Atlanta") return city.includes("south atlanta");
  if (area.label === "Atlanta") return /\batlanta\b/.test(city) && !city.includes("south atlanta");
  if (area.wide) return true;
  return city.includes(area.label.toLowerCase());
}

function matchingFeatured(need: Need, area: Area | null, cap: number | null): Featured[] {
  return featuredRooms().filter((room) => {
    if (area && !inArea(room, area)) return false;
    if (cap != null && (room.weeklyRate == null || room.weeklyRate > cap)) return false;
    if (need === "privateBath") return room.bath === "private";
    if (need === "noFee") return room.noMoveInFee;
    if (need === "fewer") return room.totalRooms != null && room.totalRooms <= 5;
    if (need === "area") return true;
    if (need === "budget" && cap != null) return room.weeklyRate != null && room.weeklyRate <= cap;
    return false;
  });
}

function toCard(room: Featured): SearchRoomCard {
  return {
    id: room.id,
    name: room.name,
    houseName: room.houseName,
    location: room.location,
    price: room.weeklyRate != null ? priceLabel(room.weeklyRate) : null,
    url: room.url,
  };
}

function mention(rooms: Featured[]): string {
  return rooms
    .slice(0, 2)
    .map((room) => {
      const price = room.weeklyRate != null ? `, from $${room.weeklyRate}/wk` : "";
      return `${room.houseName} in ${room.location}${price}`;
    })
    .join("; ");
}

/** A search reply for this message, or null when the model should answer (policies, etc.). */
export function answerRoomSearch(
  text: string,
  code: string,
  prices: FilterStartingPrices
): SearchAnswer | null {
  const found = classify(text);
  if (!found) return null;

  if (found.need === "pickArea") {
    return {
      reply: "Which area works for you?",
      rooms: [],
      chips: AREA_CHIPS,
    };
  }

  const filter = filterFor(found.need);
  const url =
    found.area && !found.area.wide
      ? citySearchUrl(found.area.slug, filter, code)
      : atlantaSearchUrl(filter, code);
  const sentence = withPrice(lead(found.need, found.area), livePrice(found.need, found.area, prices));
  const matches = matchingFeatured(found.need, found.area, found.cap);

  if (found.need === "privateBath" && matches.length) {
    return {
      reply: `${sentence}\n${url}\n\nAlso available with us:`,
      rooms: matches.map(toCard),
      chips: [],
    };
  }

  const extra =
    found.need !== "privateBath" && matches.length ? `\n\nAlso available with us: ${mention(matches)}.` : "";

  return { reply: `${sentence}\n${url}${extra}`, rooms: [], chips: [] };
}
