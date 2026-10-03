import { getHouse, orderedPhotos } from "@/lib/houses";
import { fromPriceLabel, availabilityLabel } from "@/lib/format";
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

  return renderOgCard({
    letter: market.og.letter,
    word: market.og.word,
    line1: house.name,
    line2: fromPriceLabel(house),
    sub: `${house.city} — book on PadSplit today`,
    chips: ["Utilities + WiFi included", availabilityLabel(house), "Next-day move-in"],
    // A manual heroPhoto wins if set; otherwise use the same smart lead-photo
    // pick as the site's own gallery (kitchen/living bias, never a bath/street
    // shot) — PadSplit's raw scraped `image` can be an arbitrary photo (e.g. a
    // bathroom), which made a bad link-preview thumbnail.
    photoPath: house.heroPhoto || orderedPhotos(house)[0],
  });
}
