/**
 * Which market this build serves.
 *
 * Atlanta production leaves NEXT_PUBLIC_MARKET unset. The Dallas–Fort Worth
 * production project sets NEXT_PUBLIC_MARKET=dfw. This pull request's Vercel
 * preview does not have that variable, so a preview build of this branch
 * serves Dallas–Fort Worth. Production builds never take that path
 * (VERCEL_ENV is "production" there).
 */
const DFW_PREVIEW_BRANCH = "cursor/multi-city-dfw-14fb";

function resolveMarketId() {
  if (process.env.NEXT_PUBLIC_MARKET === "dfw") return "dfw";
  if (
    process.env.VERCEL_ENV === "preview" &&
    process.env.VERCEL_GIT_COMMIT_REF === DFW_PREVIEW_BRANCH
  ) {
    return "dfw";
  }
  return "atl";
}

module.exports = { resolveMarketId, DFW_PREVIEW_BRANCH };
