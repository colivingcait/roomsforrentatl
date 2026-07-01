import type { Metadata, Viewport } from "next";
import "./globals.css";
import { getBrand } from "@/lib/brand";

export function generateMetadata(): Metadata {
  const brand = getBrand();
  const isHomes = brand.key === "homes";
  const headline = isHomes
    ? `${brand.name} — Private Rentals in Atlanta`
    : `${brand.name} — Rooms for Rent in Atlanta, Move In Today`;
  return {
    metadataBase: new URL(brand.url),
    title: { default: headline, template: `%s · ${brand.name}` },
    description: brand.description,
    keywords: isHomes
      ? ["private rentals Atlanta", "furnished rentals Atlanta", "homes for rent Atlanta", "monthly rentals Atlanta"]
      : ["rooms for rent Atlanta", "furnished rooms Atlanta", "move in today Atlanta", "weekly rooms Atlanta", "PadSplit Atlanta"],
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

import { Analytics } from "@vercel/analytics/next";
import ChatLauncher from "@/components/ChatLauncher";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatLauncher />
        <Analytics />
      </body>
    </html>
  );
}
