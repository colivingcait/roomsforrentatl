import housesData from "@/data/houses.json";
import unitsData from "@/data/units.json";
import { getBrand } from "@/lib/brand";
import { getMarket } from "@/lib/market";
import { renderOgCard, ogSize, ogContentType } from "@/lib/og";

export const alt = getMarket().og.alt;
export const size = ogSize;
export const contentType = ogContentType;

// Branded link-preview card — brand-aware, so the homes domain previews the
// homes card and the rooms domain previews the rooms card. Individual house
// and unit pages have their own listing-specific preview (see their
// opengraph-image.tsx) — this one is only the site-wide/homepage card.
export default async function OpengraphImage() {
  const market = getMarket();
  const brand = getBrand();
  const homes = brand.key === "homes" && market.homesOg;
  const copy = homes ? market.homesOg! : market.og;
  const photoPath = homes
    ? (unitsData.units as Array<{ photos?: string[] }>).find((u) => u.photos && u.photos.length)?.photos?.[0]
    : (housesData.houses as Array<{ heroPhoto?: string }>).find((h) => h.heroPhoto)?.heroPhoto;

  return renderOgCard({ ...copy, photoPath });
}
