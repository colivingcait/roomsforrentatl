/**
 * Fails if a production build ships a street address, a too-precise coordinate,
 * or a raw street1 captured during scraping.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { STREET_BLOCKLIST, leaksInText } from "../lib/listing-privacy.mjs";

const ROOT =
  process.argv[2] || (process.env.NEXT_PUBLIC_MARKET === "dfw" ? ".next-dfw" : ".next");
const EXTENSIONS = new Set([".html", ".rsc", ".json"]);

if (!existsSync(ROOT)) {
  console.error(`Build leak scan: ${ROOT}/ is missing. Run next build first.`);
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

const files = [];
walk(ROOT, files);
const hits = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const reasons = leaksInText(text, blocklist);
  if (reasons.length) hits.push(`${file}: ${[...new Set(reasons)].join(", ")}`);
}

if (hits.length) {
  console.error(`Build leak scan failed (${hits.length} file(s)):`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`Build leak scan passed (${files.length} HTML/RSC/JSON file(s)).`);
