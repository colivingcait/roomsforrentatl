/**
 * Fails if committed data or public/units filenames could leak a street
 * address, a PadSplit title/description, a too-precise coordinate, a named
 * community, or a drone / exterior / aerial photo.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { COMMUNITY_BLOCKLIST, leaksInData, unitFilenameLeak } from "../lib/listing-privacy.mjs";

function communityNames() {
  if (!existsSync(COMMUNITY_BLOCKLIST)) return [];
  const parsed = JSON.parse(readFileSync(COMMUNITY_BLOCKLIST, "utf8"));
  const names = Array.isArray(parsed) ? parsed : parsed.names;
  return (names || []).map((name) => String(name).trim()).filter((name) => name && !name.startsWith("#"));
}

function walk(dir, out) {
  if (!existsSync(dir)) return;
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else out.push(path);
  }
}

const communities = communityNames();
// community-blocklist.json is the list itself. units.json is the retired
// long-term catalog: /rental/* and /rentals 404, and that file is not rewritten
// here. public/units filenames are still scanned below.
const files = readdirSync("data")
  .filter((name) => name.endsWith(".json") && name !== "community-blocklist.json" && name !== "units.json")
  .sort();
const hits = [];
for (const name of files) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(`data/${name}`, "utf8"));
  } catch (err) {
    hits.push(`data/${name}: invalid JSON (${err.message})`);
    continue;
  }
  for (const hit of leaksInData(parsed, `data/${name}`, communities)) hits.push(hit);
}

const unitFiles = [];
walk("public/units", unitFiles);
for (const file of unitFiles.sort()) {
  const base = file.split("/").pop();
  if (base === ".gitkeep") continue;
  const reason = unitFilenameLeak(base);
  if (reason) hits.push(`${file}: ${reason}`);
}

if (hits.length) {
  console.error(`Privacy check failed (${hits.length}):`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(
  `Privacy check passed for ${files.length} data file(s) and ${unitFiles.length} unit file(s).`
);
