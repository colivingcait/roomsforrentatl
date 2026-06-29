import { getHouses } from "@/lib/houses";

/**
 * A slim highlight near the top of the home page that calls out our
 * highly-rated homes. Driven by each house's optional `rating` field — homes
 * rated 4.5★ or higher are named here. Renders nothing if none qualify.
 */
export default function ReviewsHighlight() {
  const rated = getHouses()
    .filter((h) => (h.rating ?? 0) >= 4.5)
    .map((h) => h.name);

  if (rated.length === 0) return null;

  const names =
    rated.length === 1
      ? rated[0]
      : rated.length === 2
        ? `${rated[0]} & ${rated[1]}`
        : `${rated.slice(0, -1).join(", ")} & ${rated[rated.length - 1]}`;

  return (
    <div className="mx-auto max-w-3xl px-4 pt-3">
      <div className="flex items-center gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5">
        <span className="text-base leading-none tracking-tight text-amber-500" aria-hidden>
          ★★★★★
        </span>
        <p className="text-sm text-ink">
          <span className="font-bold">{names}</span> are rated{" "}
          <span className="font-bold">4.5+ stars</span> by residents.
        </p>
      </div>
    </div>
  );
}
