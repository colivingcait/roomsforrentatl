import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getBrand } from "@/lib/brand";
import { getMarket } from "@/lib/market";

export function generateMetadata(): Metadata {
  const brand = getBrand();
  const market = getMarket();
  const isHomes = brand.key === "homes";
  const headline = isHomes && market.homesSeoTitle ? market.homesSeoTitle : market.seoTitle;
  // Short, punchy title just for link-share previews (Messenger/iMessage/Twitter)
  // — the full SEO headline above is too long and gets truncated there.
  const socialTitle = isHomes ? headline : market.socialTitle;
  return {
    metadataBase: new URL(brand.url),
    title: { default: headline, template: `%s · ${brand.name}` },
    description: brand.description,
    keywords: isHomes && market.homesKeywords ? market.homesKeywords : market.keywords,
    openGraph: {
      title: socialTitle,
      description: brand.tagline,
      url: brand.url,
      siteName: brand.name,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: socialTitle, description: brand.tagline },
    robots: { index: true, follow: true },
    ...(market.id === "sa"
      ? { icons: { icon: "/favicon-sa.svg", shortcut: "/favicon-sa.svg", apple: "/favicon-sa.svg" } }
      : {}),
  };
}

export const viewport: Viewport = {
  themeColor: "#0E7C66",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import ChatLauncher from "@/components/ChatLauncher";
import PostHogInit from "@/components/PostHogInit";
import { referralRewriteScript } from "@/lib/attribution";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <script dangerouslySetInnerHTML={{ __html: referralRewriteScript() }} />
        {children}
        <ChatLauncher />
        <Analytics />
        <Suspense fallback={null}>
          <PostHogInit />
        </Suspense>
      </body>
    </html>
  );
}
