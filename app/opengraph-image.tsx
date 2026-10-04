import housesData from "@/data/houses.json";
import { getBrand } from "@/lib/brand";
import { getMarket } from "@/lib/market";
import { dropPhoto } from "@/lib/listing-privacy.mjs";
import { renderOgCard, ogSize, ogContentType } from "@/lib/og";

export const alt = getMarket().og.alt;
export const size = ogSize;
export const contentType = ogContentType;

// Branded link-preview card. House pages have their own preview. This one is
// only the site-wide card. Long-term rental photos are not used.
export default async function OpengraphImage() {
  const market = getMarket();
  const brand = getBrand();
  const homes = brand.key === "homes" && market.homesOg;
  const copy = homes ? market.homesOg! : market.og;
  const photoPath = homes
    ? undefined
    : (housesData.houses as Array<{ heroPhoto?: string }>).find(
        (h) => h.heroPhoto && !dropPhoto({ url: h.heroPhoto, category: "interior" })
      )?.heroPhoto;

  return renderOgCard({ ...copy, photoPath });
}
