import { getHouse, orderedPhotos } from "@/lib/houses";
import { fromPriceLabel, availabilityLabel, submarketLabel } from "@/lib/format";
import { getMarket } from "@/lib/market";
import { renderOgCard, ogSize, ogContentType } from "@/lib/og";

export const alt = `Furnished room for rent in ${getMarket().metro}`;
export const size = ogSize;
export const contentType = ogContentType;

// Listing-specific preview: this house's own photo + copy, so sharing a
// single house's link previews that house — not the generic site card.
export default async function HouseOpengraphImage({ params }: { params: { id: string } }) {
  const house = getHouse(params.id);
  const market = getMarket();

  if (!house) {
    return renderOgCard(market.og);
  }

  const photo = orderedPhotos(house).find((url) => /^https?:\/\//i.test(url));

  return renderOgCard({
    letter: market.og.letter,
    word: market.og.word,
    line1: house.name,
    line2: fromPriceLabel(house),
    sub: `${submarketLabel(house)} — book on PadSplit today`,
    chips: ["Utilities + WiFi included", availabilityLabel(house), "Next-day move-in"],
    // First remaining interior photo. A local SVG is not an og:image; with no
    // absolute photo the card uses the same brand gradient as the site image.
    photoPath: photo,
  });
}
