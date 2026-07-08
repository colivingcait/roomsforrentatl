import Link from "next/link";
import type { House } from "@/lib/types";
import PhotoStrip from "./PhotoStrip";
import { orderedPhotos } from "@/lib/houses";
import { fromPriceLabel, availabilityLabel, bathroomBreakdown, prettyBath, priceLabel } from "@/lib/format";

export default function HouseCard({ house }: { house: House }) {
  const breakdown = bathroomBreakdown(house);
  const photos = orderedPhotos(house);

  return (
    <Link
      href={`/house/${house.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        <PhotoStrip images={photos} alt={`Furnished room for rent in ${house.neighborhood}, Atlanta — ${house.name}`} />

        {/* Fully-booked marker spans the top of the card */}
        {!house.available && (
          <div className="absolute inset-x-0 top-0 bg-slate-900/85 py-1.5 text-center text-xs font-bold uppercase tracking-wide text-white">
            Fully booked!
          </div>
        )}

        {/* Availability badge (only when bookable) */}
        {house.available && (
          <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow">
            ● {availabilityLabel(house)}
          </span>
        )}

        {/* Merchandising badge */}
        {house.badge && (
          <span
            className={
              "absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-extrabold shadow " +
              (/new/i.test(house.badge) ? "bg-accent text-white" : "bg-amber-500 text-white")
            }
          >
            {/highly|rated/i.test(house.badge) ? "★ " : ""}
            {house.badge}
          </span>
        )}

        {/* 3D tour badge (pointer-events-none so it doesn't block swiping) */}
        {house.tourUrl && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white shadow">
            🎦 3D Tour
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight text-ink">{house.name}</h3>
            <p className="mt-0.5 text-sm text-muted">{house.city}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-extrabold text-ink">{fromPriceLabel(house)}</div>
            <div className="text-xs text-muted">all-in</div>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Availability</p>
            <ul className="mt-1.5 space-y-1">
              {breakdown.map((b) => (
                <li key={b.type} className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    <span className="font-semibold">{b.count}</span> {prettyBath(b.type).toLowerCase()}
                  </span>
                  {b.from != null && <span className="font-semibold text-brand">from {priceLabel(b.from)}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Link>
  );
}
