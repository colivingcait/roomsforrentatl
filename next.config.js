/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
