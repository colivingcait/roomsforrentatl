/**
 * Which market this build serves.
 *
 * Unset NEXT_PUBLIC_MARKET is Atlanta. That includes Atlanta production and
 * every preview the roomsforrentatl project builds, including this branch.
 * Dallas–Fort Worth production sets NEXT_PUBLIC_MARKET=dfw. San Antonio
 * production sets NEXT_PUBLIC_MARKET=sa. A branch name never selects a market,
 * so merging this branch cannot turn roomsforrentatl.com into San Antonio.
 */
const ATL_PROJECT_ID = "prj_4AjKpcN96Zvs7ZPTqoTPFnsZMi30";

function resolveMarketId() {
  if (process.env.NEXT_PUBLIC_MARKET === "dfw") return "dfw";
  if (process.env.NEXT_PUBLIC_MARKET === "sa") return "sa";
  return "atl";
}

/** True on the roomsforrentatl Vercel project, and nowhere else. */
function isRoomsForRentAtlProject() {
  if (process.env.VERCEL_PROJECT_ID === ATL_PROJECT_ID) return true;
  const host = String(process.env.VERCEL_PROJECT_PRODUCTION_URL || "")
    .toLowerCase()
    .replace(/^www\./, "");
  return host === "roomsforrentatl.com" || host === "roomsforrentatl.vercel.app";
}

/**
 * Fail the build when the Atlanta project would ship another market.
 * Other projects are not checked. Local builds have neither id nor production URL.
 */
function assertAtlProject(market) {
  if (!isRoomsForRentAtlProject()) return;
  if (market === "atl") return;
  throw new Error(
    `roomsforrentatl resolved market "${market}" but this project must build Atlanta. Leave NEXT_PUBLIC_MARKET unset.`
  );
}

module.exports = {
  resolveMarketId,
  assertAtlProject,
  isRoomsForRentAtlProject,
  ATL_PROJECT_ID,
};
