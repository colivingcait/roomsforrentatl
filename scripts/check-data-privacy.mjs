/**
 * Fails if any committed data/*.json file could leak a street address,
 * a PadSplit title/description, or a coordinate more precise than 2 decimals.
 * That includes Dallas–Fort Worth files (faq-dfw.json and the empty house
 * snapshots the dfw build swaps in) as well as the Atlanta data.
 */
import { readdirSync, readFileSync } from "node:fs";
import { leaksInData } from "../lib/listing-privacy.mjs";

const files = readdirSync("data").filter((name) => name.endsWith(".json")).sort();
const hits = [];
for (const name of files) {
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(`data/${name}`, "utf8"));
  } catch (err) {
    hits.push(`data/${name}: invalid JSON (${err.message})`);
    continue;
  }
  for (const hit of leaksInData(parsed, `data/${name}`)) hits.push(hit);
}

if (hits.length) {
  console.error(`Privacy check failed (${hits.length}):`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}
console.log(`Privacy check passed for ${files.length} data file(s).`);
