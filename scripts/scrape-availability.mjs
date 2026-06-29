/**
 * Daily availability updater for RoomsForRentATL.
 *
 * Visits each house's PadSplit page in a real (headless) Chromium, reads the
 * house-level summary PadSplit exposes — "N rooms available", "Rooms from
 * $X/week", the lead photo, neighborhood — and writes data/availability.json.
 *
 * Runs on a GitHub Actions schedule (.github/workflows/refresh-availability.yml)
 * which commits the result, triggering a Vercel redeploy with fresh numbers.
 * PadSplit blocks plain bots, so we drive a real browser with a normal UA. On
 * any failure for a house we leave its previous data untouched (never wipe the
 * site because one scrape hiccuped). Rendered HTML + screenshots are saved to
 * ./artifacts for debugging.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";

const ART = "artifacts";
mkdirSync(ART, { recursive: true });

const houses = JSON.parse(readFileSync("data/houses.json", "utf8")).houses;

// Preserve last-known data so a failed scrape doesn't blank a house.
const prev = existsSync("data/availability.json")
  ? JSON.parse(readFileSync("data/availability.json", "utf8"))
  : { houses: {} };

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const CHALLENGE = /just a moment|verify you are human|captcha|access denied|attention required/i;

/** Parse PadSplit's house-level availability from the rendered page text/html. */
function parseHouse(text, html) {
  const out = {};

  // "4 rooms available" — the subject house's own count. (Nearby homes say
  // "1 room left" instead, so this phrasing won't pick those up.)
  const avail = text.match(/(\d+)\s+rooms?\s+available/i);
  if (avail) out.roomsAvailable = parseInt(avail[1], 10);
  else if (/no rooms? available|fully booked|currently unavailable/i.test(text)) out.roomsAvailable = 0;

  // "Rooms from $169 /week" — the lowest available room price in the house.
  const from = text.match(/Rooms from\s*\$\s*(\d+)\s*\/\s*(week|month|wk|mo)/i);
  if (from) {
    out.fromPrice = parseInt(from[1], 10);
    out.priceUnit = /mo|month/i.test(from[2]) ? "month" : "week";
  }

  const nb = text.match(/Neighborhood:\s*([A-Za-z][A-Za-z .'-]{1,30})/);
  if (nb) out.neighborhood = nb[1].trim();

  const city = text.match(/\b([A-Z][a-zA-Z]+),\s*GA\b/);
  if (city) out.city = `${city[1]}, GA`;

  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og) out.image = og[1];

  out.utilitiesIncluded = /all utilities (and fees )?included/i.test(text);
  return out;
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
    const resp = await page.goto(house.padsplitUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    const status = resp ? resp.status() : null;
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);

    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText || "");
    const title = (await page.title()).replace(/\s*\|\s*PadSplit\s*$/i, "").trim();

    writeFileSync(`${ART}/house-${id}.html`, html);
    await page.screenshot({ path: `${ART}/house-${id}.png`, fullPage: true }).catch(() => {});

    if (CHALLENGE.test(text) || (status && status >= 400)) {
      throw new Error(`blocked or error (status ${status})`);
    }

    // TEMP investigation: discover PadSplit's per-room data shape so we can build
    // the bathroom-type/price breakdown. Logs candidate room arrays for one house.
    if (id === "35011") {
      const probe = await page.evaluate(() => {
        const result = { hasNextData: false, candidates: [] };
        let data;
        try {
          data = window.__NEXT_DATA__;
        } catch {}
        if (!data) {
          const el = document.getElementById("__NEXT_DATA__");
          if (el) try { data = JSON.parse(el.textContent || "{}"); } catch {}
        }
        result.hasNextData = !!data;
        const seen = [];
        const visit = (node, depth) => {
          if (!node || typeof node !== "object" || depth > 14 || seen.length > 6) return;
          if (Array.isArray(node)) {
            if (node.length >= 1 && node.length <= 40 && node.every((x) => x && typeof x === "object")) {
              const keys = Object.keys(node[0]);
              const looksRoom =
                keys.some((k) => /bath/i.test(k)) ||
                (keys.some((k) => /price|rent|rate|cost/i.test(k)) &&
                  keys.some((k) => /status|avail|room|move/i.test(k)));
              if (looksRoom) seen.push({ size: node.length, keys, sample: node.slice(0, 2) });
            }
            for (const x of node) visit(x, depth + 1);
          } else {
            for (const k of Object.keys(node)) visit(node[k], depth + 1);
          }
        };
        if (data) visit(data, 0);
        result.candidates = seen;
        return result;
      });
      console.log(`\n[PROBE 35011] hasNextData=${probe.hasNextData} candidates=${probe.candidates.length}`);
      console.log(JSON.stringify(probe.candidates, null, 1).slice(0, 5000));
      console.log("[PROBE 35011 END]\n");
    }

    const parsed = parseHouse(text, html);
    result.houses[id] = {
      title,
      ...parsed,
      available: (parsed.roomsAvailable ?? 0) > 0,
      checkedAt: result.updatedAt,
      url: house.padsplitUrl,
    };
    okCount++;
    console.log(
      `✓ ${id}: ${parsed.roomsAvailable ?? "?"} rooms, from $${parsed.fromPrice ?? "?"}/${parsed.priceUnit ?? "wk"} — ${title}`
    );
  } catch (err) {
    // Keep whatever we knew before; just note we couldn't refresh it.
    const carried = prev.houses?.[id];
    result.houses[id] = carried
      ? { ...carried, stale: true, lastError: String(err), checkedAt: result.updatedAt }
      : { url: house.padsplitUrl, available: false, error: String(err), checkedAt: result.updatedAt };
    console.log(`✗ ${id}: ${err}`);
  } finally {
    await page.close();
  }
}

await browser.close();

// Stable, pretty output so daily diffs are readable.
writeFileSync("data/availability.json", JSON.stringify(result, null, 2) + "\n");
console.log(`\n==== ${okCount}/${houses.length} houses refreshed ====`);

if (okCount === 0) process.exit(2);
