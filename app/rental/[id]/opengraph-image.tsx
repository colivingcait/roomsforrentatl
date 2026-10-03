import { getUnit } from "@/lib/units";
import { rentLabel, availDateLabel } from "@/lib/format";
import { getMarket } from "@/lib/market";
import { renderOgCard, ogSize, ogContentType } from "@/lib/og";

const market = getMarket();
const homesCard = market.homesOg ?? market.og;

export const alt = homesCard.alt;
export const size = ogSize;
export const contentType = ogContentType;

// Listing-specific preview: this unit's own photo + copy that encourages
// applying, so sharing a single unit's link previews that unit — not the
// generic site card.
export default async function UnitOpengraphImage({ params }: { params: { id: string } }) {
  const unit = getUnit(params.id);

  if (!unit) {
    return renderOgCard(homesCard);
  }

  const chips = [
    availDateLabel(unit.availableDate),
    unit.utilitiesIncluded ? "Utilities included" : null,
    "Apply online today",
  ].filter((c): c is string => Boolean(c));

  return renderOgCard({
    letter: homesCard.letter,
    word: homesCard.word,
    line1: unit.title,
    line2: rentLabel(unit.rent),
    sub: `${unit.type} · ${unit.city} — apply online today`,
    chips,
    photoPath: unit.photos?.[0] ?? null,
  });
}
