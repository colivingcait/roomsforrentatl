import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.name} — Rooms for Rent in Atlanta, Move In Today`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  keywords: [
    "rooms for rent Atlanta",
    "furnished rooms Atlanta",
    "move in today Atlanta",
    "weekly rooms Atlanta",
    "PadSplit Atlanta",
    "cheap rooms Atlanta",
  ],
  openGraph: {
    title: `${site.name} — Rooms for Rent in Atlanta`,
    description: site.description,
    url: site.url,
    siteName: site.name,
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#2563EB",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
