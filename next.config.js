const path = require("path");
const { resolveMarketId } = require("./lib/market-env");

// One build serves one market. Swap Atlanta modules so the other market's
// copy is not in the bundle renters download. Unset keeps Atlanta, including
// Atlanta production. The separate .next directory is only for a local
// NEXT_PUBLIC_MARKET server, so it does not share a cache with the Atlanta
// dev server. Vercel keeps the default .next output.
const market = resolveMarketId();
const explicit = process.env.NEXT_PUBLIC_MARKET;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Inline the resolved id so preview builds (no NEXT_PUBLIC_MARKET) and
  // local builds agree, and so unused market branches can be dropped.
  env: { NEXT_PUBLIC_MARKET: market },
  ...(explicit === "dfw" ? { distDir: ".next-dfw" } : {}),
  ...(explicit === "sa" ? { distDir: ".next-sa" } : {}),
  ...(market === "atl"
    ? {}
    : {
        webpack: (config) => {
          const marketFile = path.join(__dirname, `lib/markets/${market}.ts`);
          const faqFile = path.join(__dirname, `data/faq-${market}.json`);
          const swaps = [
            [(request) => request.includes("markets/atl"), marketFile],
            [(request) => /\/faq\.json$/.test(request) || request.endsWith("/faq.json"), faqFile],
          ];
          swaps.push(
            [(request) => request.includes("brand-homes") && !request.includes("brand-homes-stub"), path.join(__dirname, "lib/brand-homes-stub.ts")],
            [(request) => request.includes("RentalsView"), path.join(__dirname, "components/RentalsUnavailable.tsx")]
          );
          if (market === "sa") {
            swaps.push(
              [(request) => request.endsWith("/houses.json") || request.endsWith("data/houses.json"), path.join(__dirname, "data/houses-sa.json")],
              [(request) => request.endsWith("/availability.json"), path.join(__dirname, "data/availability-sa.json")],
              [(request) => request.endsWith("/units.json"), path.join(__dirname, "data/units-empty.json")],
              [(request) => request.endsWith("/outreach.json"), path.join(__dirname, "data/outreach-empty.json")],
              [(request) => request === "@/lib/knowledge" || /\/knowledge$/.test(request) || request.endsWith("/knowledge.ts"), path.join(__dirname, "lib/knowledge-sa.ts")]
            );
          }
          config.plugins.push({
            apply(compiler) {
              compiler.hooks.normalModuleFactory.tap("MarketSwap", (nmf) => {
                nmf.hooks.beforeResolve.tap("MarketSwap", (data) => {
                  if (!data) return;
                  const request = `${data.request || ""}`;
                  for (const [match, target] of swaps) {
                    if (match(request) && request !== target) {
                      data.request = target;
                      return;
                    }
                  }
                });
              });
            },
          });
          return config;
        },
      }),
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
