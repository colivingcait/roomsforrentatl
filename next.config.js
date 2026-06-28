/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // PadSplit listing photos are served from a few CDNs. Allow remote images
    // so we can show the real listing photo without re-hosting it.
    remotePatterns: [
      { protocol: "https", hostname: "**.padsplit.com" },
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.cloudfront.net" },
      { protocol: "https", hostname: "images.padsplit.com" },
    ],
  },
};

module.exports = nextConfig;
