/**
 * Which market this build serves.
 *
 * Unset NEXT_PUBLIC_MARKET is the default market. Dallas–Fort Worth production
 * sets NEXT_PUBLIC_MARKET=dfw. San Antonio production sets NEXT_PUBLIC_MARKET=sa.
 * A branch name never selects a market.
 */
function resolveMarketId() {
  if (process.env.NEXT_PUBLIC_MARKET === "dfw") return "dfw";
  if (process.env.NEXT_PUBLIC_MARKET === "sa") return "sa";
  return "atl";
}

module.exports = {
  resolveMarketId,
};
