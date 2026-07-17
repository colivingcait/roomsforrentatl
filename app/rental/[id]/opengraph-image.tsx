import { getUnit } from "@/lib/units";
import { rentLabel, availDateLabel } from "@/lib/format";
import { renderOgCard, ogSize, ogContentType } from "@/lib/og";

export const alt = "Furnished rental in Atlanta";
export const size = ogSize;
export const contentType = ogContentType;

// Listing-specific preview: this unit's own photo + copy that encourages
// applying, so sharing a single unit's link previews that unit — not the
// generic site card.
export default async function UnitOpengraphImage({ params }: { params: { id: string } }) {
  const unit = getUnit(params.id);

  if (!unit) {
    return renderOgCard({
      letter: "H",
      word: "Homes",
      line1: "Furnished rentals in Atlanta.",
      line2: "Your own private space",
      sub: "Monthly lease · utilities included",
      chips: ["Fully furnished", "Utilities included", "Apply online today"],
    });
  }

  const chips = [
    availDateLabel(unit.availableDate),
    unit.utilitiesIncluded ? "Utilities included" : null,
    "Apply online today",
  ].filter((c): c is string => Boolean(c));

  return renderOgCard({
    letter: "H",
    word: "Homes",
    line1: unit.title,
    line2: rentLabel(unit.rent),
    sub: `${unit.type} · ${unit.city} — apply online today`,
    chips,
    photoPath: unit.photos?.[0] ?? null,
  });
}
