/**
 * Which market this build serves.
 *
 * Atlanta production leaves NEXT_PUBLIC_MARKET unset and always builds Atlanta,
 * including after this branch is merged. Dallas–Fort Worth is selected only
 * when that project's environment sets NEXT_PUBLIC_MARKET=dfw. The branch name
 * is never consulted.
 */
function resolveMarketId() {
  if (process.env.NEXT_PUBLIC_MARKET === "dfw") return "dfw";
  return "atl";
}

module.exports = { resolveMarketId };
