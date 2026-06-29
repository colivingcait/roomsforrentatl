/**
 * Daily availability + per-room updater for RoomsForRentATL.
 *
 * Visits each house's PadSplit page in a real (headless) Chromium and reads the
 * structured per-room data PadSplit embeds in __NEXT_DATA__ — each room's price,
 * bathroom type, bed size, features, move-in date, status, and photos. From that
 * we derive the rooms list, the available-rooms count, and the from-price, and
 * write data/availability.json.
 *
 * Runs on a GitHub Actions schedule (.github/workflows/refresh-availability.yml)
 * which commits the result so Vercel redeploys with fresh numbers. PadSplit
 * blocks plain bots, so we drive a real browser. On failure for a house we keep
 * its last-known data rather than blanking it. We deliberately DO NOT store the
 * street address — only the neighborhood.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const ART = "artifacts";
mkdirSync(ART, { recursive: true });
// re-run trigger: pick up newly-listed rooms (Chestnut Hill)

const houses = JSON.parse(readFileSync("data/houses.json", "utf8")).houses;
const prev = existsSync("data/availability.json")
  ? JSON.parse(readFileSync("data/availability.json", "utf8"))
  : { houses: {} };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CHALLENGE = /just a moment|verify you are human|captcha|access denied|attention required/i;

/** House-level bits from the rendered text/html (neighborhood + lead photo). */
function parseHouseMeta(text, html) {
  const out = {};
  const nb = text.match(/Neighborhood:\s*([A-Za-z][A-Za-z .'-]{1,30})/);
  if (nb) out.neighborhood = nb[1].trim();
  const city = text.match(/\b([A-Z][a-zA-Z]+),\s*GA\b/);
  if (city) out.city = `${city[1]}, GA`;
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) out.image = og[1];
  out.utilitiesIncluded = /all utilities (and fees )?included/i.test(text);
  return out;
}

/** Pull the per-room array out of PadSplit's __NEXT_DATA__ and map to our shape. */
async function extractRooms(page) {
  return page.evaluate(() => {
    let data;
    try {
      data = window.__NEXT_DATA__;
    } catch {}
    if (!data) {
      const el = document.getElementById("__NEXT_DATA__");
      if (el) try { data = JSON.parse(el.textContent || "{}"); } catch {}
    }
    if (!data) return [];

    let found = null;
    const visit = (node, depth) => {
      if (found || !node || typeof node !== "object" || depth > 16) return;
      if (Array.isArray(node)) {
        if (
          node.length &&
          node.every((x) => x && typeof x === "object") &&
          node[0].roomNumber !== undefined &&
          node[0].amenities
        ) {
          found = node;
          return;
        }
        for (const x of node) visit(x, depth + 1);
      } else {
        for (const k of Object.keys(node)) visit(node[k], depth + 1);
      }
    };
    visit(data, 0);
    if (!found) return [];

    return found.map((r, i) => {
      const a = r.amenities || {};
      const pic = (r.pictures || []).find((p) => p.primary) || (r.pictures || [])[0];
      return {
        id: r.id,
        // Raw array order; pagePosition (the real apply index) is computed below.
        padIndex: i + 1,
        pagePosition: i + 1,
        applyIndex: null,
        name: typeof r.name === "string" ? r.name : null,
        roomNumber: r.roomNumber ?? null,
        description: r.description ?? null,
        weeklyRate: r.totalWeeklyRate ?? r.basePrice ?? null,
        recommendedPrice: r.recommendedPrice ?? null,
        bathroomType: a.bathroomType ?? null, // "private" | "shared"
        bedSize: a.bedSize ?? null,
        roomSize: a.roomSize ?? null,
        workspace: !!a.workspace,
        miniFridge: !!a.miniFridge,
        privateAccess: !!a.privateAccess, // private entrance
        climateControl: a.climateControl ?? null,
        windows: a.windows ?? null,
        status: r.status ?? null,
        detailedStatus: r.detailedStatus ?? null,
        moveInDate: r.startMoveInDate ?? null,
        image: pic?.location ?? null,
        // photos for the room detail gallery (cap to keep JSON lean)
        photos: (r.pictures || []).map((p) => p.location).filter(Boolean).slice(0, 6),
      };
    });
  });
}

/**
 * Collect every categorized photo in __NEXT_DATA__ and split into common-area
 * photos (kitchen/living/exterior/etc.) and a curated carousel order. PadSplit
 * hosts these on its CDN, so we just keep the URLs — nothing is re-hosted.
 */
async function extractPhotos(page) {
  return page.evaluate(() => {
    let data;
    try {
      data = window.__NEXT_DATA__;
    } catch {}
    if (!data) {
      const el = document.getElementById("__NEXT_DATA__");
      if (el) try { data = JSON.parse(el.textContent || "{}"); } catch {}
    }
    if (!data) return { commonAreas: [], carousel: [] };

    const pics = [];
    const seen = new Set();
    const visit = (node, depth) => {
      if (!node || typeof node !== "object" || depth > 18) return;
      if (Array.isArray(node)) {
        for (const x of node) visit(x, depth + 1);
        return;
      }
      if (typeof node.location === "string" && /^https?:\/\//.test(node.location) && "category" in node) {
        if (!seen.has(node.location)) {
          seen.add(node.location);
          pics.push({
            url: node.location,
            category: (node.category || "other").toString(),
            description: node.description || null,
            primary: !!node.primary,
            width: node.imageWidth ?? null,
            height: node.imageHeight ?? null,
          });
        }
      }
      for (const k of Object.keys(node)) visit(node[k], depth + 1);
    };
    visit(data, 0);

    const isBedroom = (c) => /bed\s*room|bedroom/i.test(c);
    const commonAreas = pics.filter((p) => !isBedroom(p.category)).slice(0, 16);

    // Carousel: lead with exterior/common areas, then a couple bedrooms.
    const prio = ["exterior", "frontage", "front", "living", "common", "kitchen", "dining", "bathroom"];
    const rank = (c) => {
      const i = prio.findIndex((p) => c.toLowerCase().includes(p));
      return i === -1 ? prio.length + (isBedroom(c) ? 1 : 0) : i;
    };
    const carousel = [...pics].sort((a, b) => rank(a.category) - rank(b.category)).slice(0, 8);

    return { commonAreas, carousel };
  });
}

/**
 * Pull the listing's star rating out of __NEXT_DATA__ — the average resident
 * review score (0–5). PadSplit's per-photo `aiRating` (0–100) is ignored by the
 * 0–5 filter. Review COUNTS aren't reliably in this payload, so we skip them.
 */
async function extractRating(page) {
  return page.evaluate(() => {
    let data;
    try { data = window.__NEXT_DATA__; } catch {}
    if (!data) {
      const el = document.getElementById("__NEXT_DATA__");
      if (el) try { data = JSON.parse(el.textContent || "{}"); } catch {}
    }
    if (!data) return null;

    let rating = null;
    const visit = (node, depth) => {
      if (rating != null || !node || typeof node !== "object" || depth > 18) return;
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (/rating/i.test(k) && !/ai/i.test(k)) {
          const num = typeof v === "string" ? parseFloat(v) : v;
          if (Number.isFinite(num) && num > 0 && num <= 5) {
            rating = Math.round(num * 10) / 10;
            return;
          }
        }
        if (v && typeof v === "object") visit(v, depth + 1);
      }
    };
    visit(data, 0);
    return rating;
  });
}

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"] });
const ctx = await browser.newContext({
  userAgent: UA,
  locale: "en-US",
  timezoneId: "America/New_York",
  viewport: { width: 1280, height: 1800 },
});

const result = { updatedAt: new Date().toISOString(), houses: {} };
let okCount = 0;

for (const house of houses) {
  const id = house.id;
  const page = await ctx.newPage();
  try {
    // Some listings intermittently serve a generic shell with no listing data.
    // Retry until PadSplit's app actually hydrates __NEXT_DATA__ (or give up and
    // carry forward last-known data rather than wiping it with an empty render).
    let status = null;
    let title = "";
    let text = "";
    for (let attempt = 1; attempt <= 3; attempt++) {
      const resp = await page.goto(house.padsplitUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
      status = resp ? resp.status() : null;
      await page
        .waitForFunction(
          () => {
            const d = window.__NEXT_DATA__;
            if (!d) return false;
            const s = JSON.stringify(d);
            return s.includes("roomNumber") || s.includes("pspropertyId");
          },
          { timeout: 15000 }
        )
        .catch(() => {});
      await page.waitForTimeout(1200);
      text = await page.evaluate(() => document.body?.innerText || "");
      title = (await page.title()).replace(/\s*\|\s*PadSplit\s*$/i, "").trim();
      const rendered = title && title.toLowerCase() !== "padsplit";
      if (rendered || CHALLENGE.test(text) || (status && status >= 400)) break;
      if (attempt < 3) await page.waitForTimeout(1500);
    }

    const html = await page.content();
    writeFileSync(`${ART}/house-${id}.html`, html);
    await page.screenshot({ path: `${ART}/house-${id}.png`, fullPage: true }).catch(() => {});

    if (CHALLENGE.test(text) || (status && status >= 400)) {
      throw new Error(`blocked or error (status ${status})`);
    }
    if (!title || title.toLowerCase() === "padsplit") {
      throw new Error("listing did not render (generic shell)");
    }

    const meta = parseHouseMeta(text, html);
    const rooms = await extractRooms(page);
    const { commonAreas, carousel } = await extractPhotos(page);
    const rating = await extractRating(page);

    // PadSplit's /room-details/{house}/{N} uses N = the room's position in the
    // order rooms appear ON THE PAGE. Derive that from where each room's name
    // first shows up in the visible text, then number them 1..N in that order.
    const posOf = (r) => {
      const tokens = [
        r.name,
        (r.name || "").split(" - ").slice(0, 2).join(" - "),
        (r.name || "").split(" - ")[1],
        (r.name || "").split(" - ")[0],
      ].filter(Boolean);
      for (const t of tokens) {
        const i = text.indexOf(t);
        if (i >= 0) return i;
      }
      return Number.MAX_SAFE_INTEGER;
    };
    const ordered = [...rooms].sort((a, b) => posOf(a) - posOf(b));
    // If we couldn't locate any room name in the text, fall back to array order.
    const located = ordered.some((r) => posOf(r) !== Number.MAX_SAFE_INTEGER);
    ordered.forEach((r, i) => {
      r.pagePosition = located ? i + 1 : r.padIndex;
    });

    // A room counts as available when PadSplit marks status === 1 (vacant/listed).
    const available = rooms.filter((r) => r.status === 1);
    const fromPrice = available.reduce(
      (min, r) => (r.weeklyRate != null && r.weeklyRate < min ? r.weeklyRate : min),
      Infinity
    );

    result.houses[id] = {
      title,
      ...meta,
      rooms,
      commonAreas,
      carousel,
      roomsAvailable: available.length,
      fromPrice: Number.isFinite(fromPrice) ? fromPrice : null,
      priceUnit: "week",
      available: available.length > 0,
      rating,
      checkedAt: result.updatedAt,
      url: house.padsplitUrl,
    };
    okCount++;

    const byBath = available.reduce((m, r) => ((m[r.bathroomType || "?"] = (m[r.bathroomType || "?"] || 0) + 1), m), {});
    console.log(
      `✓ ${id}: ${rooms.length} rooms (${available.length} available ${JSON.stringify(byBath)}), from $${
        Number.isFinite(fromPrice) ? fromPrice : "?"
      }/wk — ${title}`
    );
  } catch (err) {
    const carried = prev.houses?.[id];
    result.houses[id] = carried
      ? { ...carried, stale: true, lastError: String(err), checkedAt: result.updatedAt }
      : { url: house.padsplitUrl, available: false, rooms: [], roomsAvailable: 0, error: String(err), checkedAt: result.updatedAt };
    console.log(`✗ ${id}: ${err}`);
  } finally {
    await page.close();
  }
}

await browser.close();
writeFileSync("data/availability.json", JSON.stringify(result, null, 2) + "\n");
console.log(`\n==== ${okCount}/${houses.length} houses refreshed ====`);
if (okCount === 0) process.exit(2);
