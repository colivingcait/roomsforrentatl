/**
 * Fails if the San Antonio production build still contains another market.
 * Run after `NEXT_PUBLIC_MARKET=sa npx next build` (output in .next).
 *
 * Skips source maps. Checks compiled JS, HTML, and JSON only.
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, extname } from "path";

const root = process.argv[2] || ".next";
const TEXT = new Set([".js", ".html", ".json", ".txt", ".css", ".rsc"]);

const FORBIDDEN = [
  { name: "roomsforrentatl.com", re: /roomsforrentatl\.com/i },
  { name: "roomsforrentdfw.com", re: /roomsforrentdfw\.com/i },
  { name: "homesforrentatl.com", re: /homesforrentatl\.com/i },
  { name: "RoomsForRentATL", re: /RoomsForRentATL/ },
  { name: "RoomsForRentDFW", re: /RoomsForRentDFW/ },
  { name: "HomesForRentATL", re: /HomesForRentATL/ },
  { name: "Atlanta", re: /\bAtlanta\b/ },
  { name: "Dallas", re: /\bDallas\b/ },
  { name: "Fort Worth", re: /Fort Worth/ },
  { name: "phone", re: /678[\s)._-]*490[\s.-]*9917/ },
  { name: "B2C2060F", re: /B2C2060F/i },
  { name: "F6BCCA4D", re: /F6BCCA4D/i },
];

/** Other markets' house ids. 152 is only flagged as a path or a quoted id. */
const HOUSE_IDS = ["35011", "8299", "11889", "30251", "39708", "152"];

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = readdirSync(dir);
  } catch (err) {
    console.error(`Cannot read ${dir}: ${err.message}`);
    process.exit(2);
  }
  for (const name of entries) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (name === "cache" || name === "trace") continue;
      walk(p, out);
    } else if (!name.endsWith(".map") && !name.endsWith(".pack")) {
      out.push(p);
    }
  }
  return out;
}

function houseHit(id, text) {
  if (id === "152") {
    return (
      text.includes("/house/152") ||
      text.includes("/listing/152") ||
      text.includes('"/152"') ||
      text.includes('"/id":"152"') ||
      /["']152["']/.test(text)
    );
  }
  return (
    text.includes(`/house/${id}`) ||
    text.includes(`/listing/${id}`) ||
    text.includes(`"${id}"`) ||
    text.includes(`'${id}'`)
  );
}

const files = walk(root);
if (!files.length) {
  console.error(`No build output in ${root}. Build with NEXT_PUBLIC_MARKET=sa first.`);
  process.exit(2);
}

const problems = [];
let hrefs = 0;
let hrefMiss = 0;

for (const file of files) {
  if (!TEXT.has(extname(file)) && !file.endsWith(".js")) continue;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue;
  }
  if (text.includes("\u0000")) continue;

  for (const rule of FORBIDDEN) {
    if (rule.re.test(text)) problems.push(`${file}: ${rule.name}`);
  }
  for (const id of HOUSE_IDS) {
    if (houseHit(id, text)) problems.push(`${file}: house ${id}`);
  }

  const hrefRe = /<a\b[^>]*\bhref="(https:\/\/www\.padsplit\.com[^"]+)"/gi;
  let match;
  while ((match = hrefRe.exec(text))) {
    hrefs += 1;
    const href = match[1].replace(/&amp;/g, "&");
    if (href.includes("/img/")) continue;
    if (!href.includes("referralCode=0DC68BAB")) {
      hrefMiss += 1;
      problems.push(`${file}: padsplit href missing 0DC68BAB (${href.slice(0, 160)})`);
    }
  }
}

if (hrefs === 0) {
  problems.push("No padsplit.com hrefs found in the San Antonio build.");
}

if (problems.length) {
  console.error(`San Antonio build is not isolated (${problems.length} hit${problems.length === 1 ? "" : "s"}):`);
  for (const line of problems.slice(0, 40)) console.error(`  ${line}`);
  if (problems.length > 40) console.error(`  … ${problems.length - 40} more`);
  process.exit(1);
}

console.log(`San Antonio build is isolated. ${hrefs} padsplit.com hrefs include referralCode=0DC68BAB.`);
