import { getHouse, orderedPhotos } from "@/lib/houses";
import { fromPriceLabel, availabilityLabel, submarketLabel } from "@/lib/format";
import { renderOgCard, ogSize, ogContentType } from "@/lib/og";

export const alt = "Furnished room for rent in Atlanta";
export const size = ogSize;
export const contentType = ogContentType;

// Listing-specific preview: this house's own photo + copy, so sharing a
// single house's link previews that house — not the generic site card.
export default async function HouseOpengraphImage({ params }: { params: { id: string } }) {
  const house = getHouse(params.id);

  if (!house) {
    return renderOgCard({
      letter: "R",
      word: "Rooms",
      line1: "Furnished rooms in Atlanta.",
      line2: "Next Day Move In",
      sub: "All-in weekly pricing · utilities & WiFi included",
      chips: ["Fully furnished", "Utilities + WiFi included", "Stay as long as you need"],
    });
  }

  const photo = orderedPhotos(house).find((url) => /^https?:\/\//i.test(url));

  return renderOgCard({
    letter: "R",
    word: "Rooms",
    line1: house.name,
    line2: fromPriceLabel(house),
    sub: `${submarketLabel(house)} — book on PadSplit today`,
    chips: ["Utilities + WiFi included", availabilityLabel(house), "Next-day move-in"],
    // First remaining interior photo. A local SVG is not an og:image; with no
    // absolute photo the card uses the same brand gradient as the site image.
    photoPath: photo,
  });
}
