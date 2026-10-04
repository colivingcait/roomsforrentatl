/**
 * Fails when a market's client JavaScript still contains another market.
 * Scans .next/static (or .next-dfw/static). Source maps are skipped.
 *
 * San Antonio must not ship Atlanta or Dallas–Fort Worth strings.
 * Atlanta must not ship San Antonio or Dallas–Fort Worth brands.
 * Dallas–Fort Worth must not ship the other two brands or Atlanta-only analytics.
 * Atlanta keeps /covilla and its landing tracker.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const market = (process.env.NEXT_PUBLIC_MARKET || "atl").trim().toLowerCase();
const root = market === "dfw" ? ".next-dfw" : ".next";
const chunks = join(root, "static");

const SA = [
  { name: "rfr_covilla_pv", re: /rfr_covilla_pv/ },
  { name: "baker hills", re: /baker hills/i },
  { name: "adamsville", re: /adamsville/i },
  { name: "Two kitchens", re: /Two kitchens/ },
  { name: "dfw id", re: /["']dfw["']/ },
  { name: "atl id", re: /["']atl["']/ },
  { name: "RoomsForRentATL", re: /RoomsForRentATL/ },
  { name: "RoomsForRentDFW", re: /RoomsForRentDFW/ },
  { name: "roomsforrentatl.com", re: /roomsforrentatl\.com/i },
  { name: "roomsforrentdfw.com", re: /roomsforrentdfw\.com/i },
  { name: "Atlanta", re: /\bAtlanta\b/ },
  { name: "Dallas", re: /\bDallas\b/ },
  { name: "Fort Worth", re: /Fort Worth/ },
];

const ATL = [
  { name: "RoomsForRentSA", re: /RoomsForRentSA/ },
  { name: "roomsforrentsa.com", re: /roomsforrentsa\.com/i },
  { name: "RoomsForRentDFW", re: /RoomsForRentDFW/ },
  { name: "roomsforrentdfw.com", re: /roomsforrentdfw\.com/i },
  { name: "San Antonio", re: /San Antonio/ },
  { name: "Dallas", re: /\bDallas\b/ },
  { name: "Fort Worth", re: /Fort Worth/ },
];

// Dallas still ships the shared house file, so neighborhood names in that data
// are not treated as code. These are the Atlanta-only code strings.
const DFW = [
  { name: "RoomsForRentATL", re: /RoomsForRentATL/ },
  { name: "RoomsForRentSA", re: /RoomsForRentSA/ },
  { name: "roomsforrentatl.com", re: /roomsforrentatl\.com/i },
  { name: "roomsforrentsa.com", re: /roomsforrentsa\.com/i },
  { name: "San Antonio", re: /San Antonio/ },
  { name: "rfr_covilla_pv", re: /rfr_covilla_pv/ },
  { name: "baker hills regex", re: /baker hills/ },
  { name: "adamsville regex", re: /adamsville/ },
  { name: "Two kitchens", re: /Two kitchens/ },
  { name: "atl id", re: /["']atl["']/ },
];

const RULES = market === "sa" ? SA : market === "dfw" ? DFW : ATL;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (name.endsWith(".js") && !name.endsWith(".js.map")) out.push(p);
  }
  return out;
}

if (!existsSync(chunks)) {
  console.error(`Client market scan: ${chunks} is missing. Run next build first.`);
  process.exit(1);
}

const problems = [];
for (const file of walk(chunks)) {
  const text = readFileSync(file, "utf8");
  for (const rule of RULES) {
    if (rule.re.test(text)) problems.push(`${file}: ${rule.name}`);
  }
}

if (problems.length) {
  console.error(`Client market scan failed for ${market}:`);
  for (const line of problems) console.error(`  ${line}`);
  process.exit(1);
}

console.log(`Client market scan passed for ${market} (${walk(chunks).length} files).`);
