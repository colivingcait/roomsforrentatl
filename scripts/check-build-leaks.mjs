/**
 * Fails if a production build ships a street address, a too-precise coordinate,
 * or a raw street1 captured during scraping.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { STREET_BLOCKLIST, COMMUNITY_BLOCKLIST, leaksInText } from "../lib/listing-privacy.mjs";

// Dallas builds write .next-dfw. San Antonio and Atlanta write .next.
const ROOT = process.env.NEXT_PUBLIC_MARKET === "dfw" ? ".next-dfw" : ".next";
const EXTENSIONS = new Set([".html", ".rsc", ".json"]);

if (!existsSync(ROOT)) {
  console.error("Build leak scan: .next/ is missing. Run next build first.");
  process.exit(1);
}

function walk(dir, out) {
  for (const name of readdirSync(dir)) {
    if (name === "cache" || name === "trace") continue;
    const path = join(dir, name);
    const st = statSync(path);
    if (st.isDirectory()) {
      walk(path, out);
      continue;
    }
    const dot = name.lastIndexOf(".");
    const ext = dot >= 0 ? name.slice(dot) : "";
    if (EXTENSIONS.has(ext)) out.push(path);
  }
}

const blocklist = existsSync(STREET_BLOCKLIST)
  ? readFileSync(STREET_BLOCKLIST, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
  : [];

const communities = existsSync(COMMUNITY_BLOCKLIST)
  ? (() => {
      const parsed = JSON.parse(readFileSync(COMMUNITY_BLOCKLIST, "utf8"));
      const names = Array.isArray(parsed) ? parsed : parsed.names;
      return (names || []).map((name) => String(name).trim()).filter((name) => name && !name.startsWith("#"));
    })()
  : [];

const files = [];
walk(ROOT, files);
const hits = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const reasons = leaksInText(text, blocklist, communities);
  if (reasons.length) hits.push(`${file}: ${[...new Set(reasons)].join(", ")}`);
}

if (hits.length) {
  console.error(`Build leak scan failed (${hits.length} file(s)):`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`Build leak scan passed (${files.length} HTML/RSC/JSON file(s)).`);
