/**
 * Build-time guard for the roomsforrentatl Vercel project.
 *
 * Required from next.config.js only. Do not import this from app code or
 * middleware: the hostnames below must not ship in another market's bundle.
 */
const ATL_PROJECT_ID = "prj_4AjKpcN96Zvs7ZPTqoTPFnsZMi30";

function isRoomsForRentAtlProject() {
  if (process.env.VERCEL_PROJECT_ID === ATL_PROJECT_ID) return true;
  const host = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || "")
    .toLowerCase()
    .replace(/^www\./, "");
  return host === "roomsforrentatl.com" || host === "roomsforrentatl.vercel.app";
}

function assertAtlProject(market) {
  if (!isRoomsForRentAtlProject()) return;
  if (market === "atl") return;
  throw new Error(
    `roomsforrentatl resolved market "${market}" but this project must build Atlanta. Leave NEXT_PUBLIC_MARKET unset.`
  );
}

module.exports = {
  assertAtlProject,
  isRoomsForRentAtlProject,
  ATL_PROJECT_ID,
};
