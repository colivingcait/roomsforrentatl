const path = require("path");
const { resolveMarketId } = require("./lib/market-env");

// One build serves one market. Swap Atlanta modules for Dallas–Fort Worth so
// the other market's copy is not in the bundle renters download. Unset keeps
// Atlanta, including Atlanta production. The separate .next directory is only
// for a local NEXT_PUBLIC_MARKET=dfw server, so it does not share a cache
// with the Atlanta dev server. Vercel keeps the default .next output.
const market = resolveMarketId();
const explicitDfw = process.env.NEXT_PUBLIC_MARKET === "dfw";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  ...(explicitDfw ? { distDir: ".next-dfw" } : {}),
  ...(market === "dfw"
    ? {
        webpack: (config) => {
          const dfwMarket = path.join(__dirname, "lib/markets/dfw.ts");
          const dfwFaq = path.join(__dirname, "data/faq-dfw.json");
          config.plugins.push({
            apply(compiler) {
              compiler.hooks.normalModuleFactory.tap("DfwMarketSwap", (nmf) => {
                nmf.hooks.beforeResolve.tap("DfwMarketSwap", (data) => {
                  if (!data) return;
                  const request = `${data.request || ""}`;
                  if (request.includes("markets/atl")) data.request = dfwMarket;
                  else if (/\/faq\.json$/.test(request) || request.endsWith("faq.json")) data.request = dfwFaq;
                });
              });
            },
          });
          return config;
        },
      }
    : {}),
  images: {
    // PadSplit listing photos come from CDNs we can't fully enumerate, and the
    // seed/fallback photos are local SVGs. Serving images un-optimized lets the
    // browser load any host (or local SVG) directly — robust and zero-config —
    // at a small perf cost vs. Next's optimizer.
    unoptimized: true,
    dangerouslyAllowSVG: true,
    contentDispositionType: "inline",
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

module.exports = nextConfig;
