import type { LiveData, PriceUnit } from "./types";

/**
 * Fetches a single PadSplit listing page and extracts the current price,
 * availability, and lead photo.
 *
 * PadSplit can (and will) change its markup, so this parser is intentionally
 * defensive: it tries several strategies and returns `{ ok: false }` if none
 * work, in which case the site falls back to the seed values in
 * data/listings.json. That way the page never breaks just because a scrape
 * missed — it just shows the last-known good numbers.
 */
export async function fetchPadsplitLive(url: string): Promise<LiveData> {
  const fetchedAt = new Date().toISOString();

  // Skip obvious placeholders so we don't hammer a 404.
  if (!url || url.includes("REPLACE-ME")) {
    return { ok: false, fetchedAt };
  }

  try {
    const res = await fetch(url, {
      headers: {
        // Look like a normal browser; PadSplit blocks empty UAs.
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
      },
      // Revalidated by the page's `revalidate`/cron, so a plain fetch is fine.
      cache: "no-store",
    });

    if (!res.ok) return { ok: false, fetchedAt };
    const html = await res.text();

    const price = extractPrice(html);
    const availableNow = extractAvailability(html);
    const image = extractImage(html);

    const ok = price != null || availableNow != null || image != null;
    return {
      ok,
      fetchedAt,
      price: price?.amount,
      priceUnit: price?.unit,
      availableNow: availableNow ?? undefined,
      image: image ?? undefined,
    };
  } catch {
    return { ok: false, fetchedAt };
  }
}

function extractPrice(html: string): { amount: number; unit: PriceUnit } | null {
  // 1) JSON-LD Offer: "price": "185" + priceCurrency
  const ld = matchAllJson(html, /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi);
  for (const obj of ld) {
    const offer = findDeep(obj, (k, v) => k === "price" && (typeof v === "number" || typeof v === "string"));
    if (offer != null) {
      const amount = toNumber(offer);
      if (amount) return { amount, unit: guessUnit(JSON.stringify(obj)) };
    }
  }

  // 2) Next.js data island
  const next = matchJson(html, /<script[^>]+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (next) {
    const val = findDeep(next, (k) =>
      /(^|_)(price|weeklyrate|weeklyrent|rent|amount)($|_)/i.test(k)
    );
    const amount = toNumber(val);
    if (amount && amount > 20 && amount < 5000) {
      return { amount, unit: guessUnit(JSON.stringify(next).slice(0, 4000)) };
    }
  }

  // 3) Visible price text like "$185 / week" or "$800/mo"
  const m = html.match(/\$\s?(\d{2,4})(?:\.\d{2})?\s*(?:\/|per)?\s*(week|wk|month|mo)\b/i);
  if (m) {
    const amount = toNumber(m[1]);
    if (amount) return { amount, unit: /mo|month/i.test(m[2]) ? "month" : "week" };
  }

  return null;
}

function extractAvailability(html: string): boolean | null {
  if (/\b(book\s*now|available\s*now|move\s*in\s*today|available\s*today)\b/i.test(html)) return true;
  if (/\b(no\s*longer\s*available|fully\s*booked|sold\s*out|currently\s*unavailable|waitlist)\b/i.test(html))
    return false;
  return null;
}

function extractImage(html: string): string | null {
  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  if (og?.[1]) return og[1];
  return null;
}

/* ---------- small helpers ---------- */

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && isFinite(v)) return Math.round(v);
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/[^0-9.]/g, ""));
    if (isFinite(n)) return Math.round(n);
  }
  return undefined;
}

function guessUnit(scope: string): PriceUnit {
  return /month|monthly|\/mo\b/i.test(scope) && !/week/i.test(scope) ? "month" : "week";
}

function matchJson(html: string, re: RegExp): any | null {
  const m = html.match(re);
  if (!m?.[1]) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function matchAllJson(html: string, re: RegExp): any[] {
  const out: any[] = [];
  for (const m of html.matchAll(re)) {
    try {
      out.push(JSON.parse(m[1]));
    } catch {
      /* ignore unparseable blocks */
    }
  }
  return out;
}

/** Depth-first search through a parsed JSON object for the first matching value. */
function findDeep(
  node: any,
  predicate: (key: string, value: any) => boolean,
  depth = 0
): any {
  if (node == null || depth > 8) return undefined;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findDeep(item, predicate, depth + 1);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  if (typeof node === "object") {
    for (const [k, v] of Object.entries(node)) {
      if (predicate(k, v) && (typeof v === "string" || typeof v === "number")) return v;
      const found = findDeep(v, predicate, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}
