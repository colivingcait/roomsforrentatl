/**
 * Which market this build serves.
 *
 * Atlanta production leaves NEXT_PUBLIC_MARKET unset. The Dallas–Fort Worth
 * production project sets NEXT_PUBLIC_MARKET=dfw. The San Antonio project
 * sets NEXT_PUBLIC_MARKET=sa. A preview build of a market's branch serves
 * that market when the variable is missing. Production builds never take
 * the preview path (VERCEL_ENV is "production" there).
 */
const DFW_PREVIEW_BRANCH = "cursor/multi-city-dfw-14fb";
const SA_PREVIEW_BRANCH = "cursor/san-antonio-market-68fe";

function resolveMarketId() {
  if (process.env.NEXT_PUBLIC_MARKET === "dfw") return "dfw";
  if (process.env.NEXT_PUBLIC_MARKET === "sa") return "sa";
  if (process.env.VERCEL_ENV === "preview") {
    if (process.env.VERCEL_GIT_COMMIT_REF === SA_PREVIEW_BRANCH) return "sa";
    if (process.env.VERCEL_GIT_COMMIT_REF === DFW_PREVIEW_BRANCH) return "dfw";
  }
  return "atl";
}

module.exports = { resolveMarketId, DFW_PREVIEW_BRANCH, SA_PREVIEW_BRANCH };
