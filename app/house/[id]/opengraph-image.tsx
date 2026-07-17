import { getHouse } from "@/lib/houses";
import { fromPriceLabel, availabilityLabel } from "@/lib/format";
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

  return renderOgCard({
    letter: "R",
    word: "Rooms",
    line1: house.name,
    line2: fromPriceLabel(house),
    sub: `${house.city} — book on PadSplit today`,
    chips: ["Utilities + WiFi included", availabilityLabel(house), "Next-day move-in"],
    photoPath: house.heroPhoto || house.image,
  });
}
