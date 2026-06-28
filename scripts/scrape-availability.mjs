/**
 * Daily availability scraper for RoomsForRentATL.
 *
 * Visits each house's PadSplit page in a real (headless) browser, reads which
 * rooms are available, and writes data/availability.json. Designed to run on a
 * GitHub Actions schedule (see .github/workflows/refresh-availability.yml),
 * which then commits the result so Vercel redeploys with fresh availability.
 *
 * PadSplit blocks plain bot requests, so we drive a real Chromium with a normal
 * user-agent/locale. This run ALSO behaves as a probe: it logs diagnostics and
 * saves the rendered HTML + a screenshot per house to ./artifacts so we can
 * confirm we got through and tune the room/availability parsing to PadSplit's
 * real markup.
 */
import { chromium } from "playwright";
import { readFileSync, writeFileSync, mkdirSync } from "fs";

const ART = "artifacts";
mkdirSync(ART, { recursive: true });

const houses = JSON.parse(readFileSync("data/houses.json", "utf8")).houses;

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const CHALLENGE = /just a moment|verify you are human|captcha|access denied|attention required|enable javascript and cookies/i;

function summarize(text, html) {
  const lower = text.toLowerCase();
  return {
    chars: text.length,
    challenged: CHALLENGE.test(text) || CHALLENGE.test(html.slice(0, 5000)),
    mentionsAvailable: (lower.match(/available/g) || []).length,
    mentionsBook: (lower.match(/\bbook\b/g) || []).length,
    mentionsRoom: (lower.match(/\broom\b/g) || []).length,
    priceHits: Array.from(new Set((text.match(/\$\s?\d{2,4}\s*\/?\s*(?:wk|week|mo|month)?/gi) || []).slice(0, 12))),
  };
}

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-blink-features=AutomationControlled"] });
const ctx = await browser.newContext({
  userAgent: UA,
  locale: "en-US",
  timezoneId: "America/New_York",
  viewport: { width: 1280, height: 1800 },
});

const results = [];
for (const house of houses) {
  const tag = house.id;
  const out = { id: house.id, url: house.padsplitUrl, ok: false };
  const page = await ctx.newPage();
  try {
    const resp = await page.goto(house.padsplitUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    out.status = resp ? resp.status() : null;
    // Give client-side rendering a moment to populate room cards.
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
    await page.waitForTimeout(2500);

    const html = await page.content();
    const text = await page.evaluate(() => document.body?.innerText || "");
    out.title = await page.title();
    out.diag = summarize(text, html);
    out.ok = !out.diag.challenged && (out.status ? out.status < 400 : true);

    writeFileSync(`${ART}/house-${tag}.html`, html);
    writeFileSync(`${ART}/house-${tag}.txt`, text);
    await page.screenshot({ path: `${ART}/house-${tag}.png`, fullPage: true }).catch(() => {});

    console.log(`\n=== House ${tag} ===`);
    console.log("status:", out.status, "| title:", out.title);
    console.log("diag:", JSON.stringify(out.diag));
    console.log("first 900 chars of visible text:\n" + text.slice(0, 900).replace(/\n{2,}/g, "\n"));
  } catch (err) {
    out.error = String(err);
    console.log(`\n=== House ${tag} FAILED ===\n`, out.error);
  } finally {
    await page.close();
  }
  results.push(out);
}

await browser.close();

writeFileSync(`${ART}/probe-results.json`, JSON.stringify(results, null, 2));

const reachable = results.filter((r) => r.ok).length;
console.log(`\n==== SUMMARY: ${reachable}/${results.length} houses read without a challenge ====`);

// Non-zero exit if every house was blocked, so the run surfaces the problem.
if (reachable === 0) process.exit(2);
