import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getBrand } from "@/lib/brand";

export function generateMetadata(): Metadata {
  const brand = getBrand();
  const isHomes = brand.key === "homes";
  const headline = isHomes
    ? `${brand.name} — Furnished Private Rentals in Atlanta, GA`
    : `${brand.name} — Furnished Rooms for Rent in Atlanta, Next-Day Move In`;
  return {
    metadataBase: new URL(brand.url),
    title: { default: headline, template: `%s · ${brand.name}` },
    description: brand.description,
    keywords: isHomes
      ? [
          "private rentals Atlanta",
          "furnished rentals Atlanta",
          "furnished apartments for rent Atlanta",
          "homes for rent Atlanta",
          "monthly rentals Atlanta",
          "furnished monthly rental Atlanta",
          "no lease apartment Atlanta",
          "short term furnished rental Atlanta",
          "studio for rent Atlanta",
          "furnished studio Atlanta",
          "utilities included apartment Atlanta",
          "furnished apartment Snellville",
          "furnished apartment Decatur",
        ]
      : [
          "rooms for rent Atlanta",
          "furnished rooms Atlanta",
          "furnished room for rent Atlanta weekly",
          "next day move in Atlanta",
          "weekly rooms Atlanta",
          "PadSplit Atlanta",
          "PadSplit rooms Atlanta",
          "no lease room rental Atlanta",
          "co-living Atlanta",
          "shared house Atlanta",
          "flexible lease room Atlanta",
          "affordable room for rent Atlanta",
          "private bedroom for rent Atlanta",
          "weekly rent room Atlanta",
          "room for rent Decatur",
          "room for rent Stone Mountain",
          "room for rent Snellville",
        ],
    openGraph: {
      title: headline,
      description: brand.description,
      url: brand.url,
      siteName: brand.name,
      type: "website",
    },
    twitter: { card: "summary_large_image", title: headline, description: brand.description },
    robots: { index: true, follow: true },
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
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
