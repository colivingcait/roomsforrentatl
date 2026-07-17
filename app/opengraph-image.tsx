import housesData from "@/data/houses.json";
import unitsData from "@/data/units.json";
import { getBrand } from "@/lib/brand";
import { renderOgCard, ogSize, ogContentType } from "@/lib/og";

export const alt = "Furnished rentals in Atlanta";
export const size = ogSize;
export const contentType = ogContentType;

// Branded link-preview card — brand-aware, so the homes domain previews the
// homes card and the rooms domain previews the rooms card. Individual house
// and unit pages have their own listing-specific preview (see their
// opengraph-image.tsx) — this one is only the site-wide/homepage card.
export default async function OpengraphImage() {
  const brand = getBrand();
  const isHomes = brand.key === "homes";

  const copy = isHomes
    ? {
        letter: "H",
        word: "Homes",
        line1: "Furnished rentals in Atlanta.",
        line2: "Your own private space",
        sub: "Monthly lease · utilities included",
        chips: ["Fully furnished", "Utilities included", "A place that's all yours"],
        photoPath: (unitsData.units as Array<{ photos?: string[] }>).find((u) => u.photos && u.photos.length)
          ?.photos?.[0],
      }
    : {
        letter: "R",
        word: "Rooms",
        line1: "Furnished rooms in Atlanta.",
        line2: "Next Day Move In",
        sub: "All-in weekly pricing · utilities & WiFi included",
        chips: ["Fully furnished", "Utilities + WiFi included", "Stay as long as you need"],
        photoPath: (housesData.houses as Array<{ heroPhoto?: string }>).find((h) => h.heroPhoto)?.heroPhoto,
      };

  return renderOgCard(copy);
}
