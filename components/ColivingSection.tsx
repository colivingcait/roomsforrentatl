import Link from "next/link";
import Image from "next/image";
import type { ColivingHouse } from "@/lib/types";
import { availableColivingRooms, colivingFromPrice } from "@/lib/coliving";
import { priceLabel } from "@/lib/format";

export default function ColivingSection({ houses }: { houses: ColivingHouse[] }) {
  if (!houses.length) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 pt-6">
      {houses.map((house) => (
        <ColivingHouseCard key={house.id} house={house} />
      ))}
    </section>
  );
}

export function ColivingHouseCard({ house }: { house: ColivingHouse }) {
  const rooms = availableColivingRooms(house);
  const from = colivingFromPrice(house);
  const hero = house.heroPhoto || rooms.find((r) => r.photos && r.photos.length > 0)?.photos?.[0];
  const loc = [house.neighborhood, house.city].filter(Boolean).join(", ");

  // Availability breakdown by bath type, mirroring the PadSplit cards.
  const byBath = (bath: "private" | "semi-private") => {
    const rs = rooms.filter((r) => r.bath === bath);
    const prices = rs.map((r) => r.price).filter((p): p is number => typeof p === "number");
    return { count: rs.length, from: prices.length ? Math.min(...prices) : null };
  };
  const breakdown = [
    { label: "private bath", ...byBath("private") },
    { label: "semi-private bath", ...byBath("semi-private") },
  ].filter((b) => b.count > 0);

  return (
    <Link
      href={`/coliving/${house.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {hero ? (
          <Image src={hero} alt={house.name} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand to-brand-dark text-center text-white">
            <div>
              <div className="text-2xl font-extrabold">{house.name || "Private rooms"}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">Photos coming soon</div>
            </div>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow">
          ● {rooms.length} room{rooms.length === 1 ? "" : "s"} available
        </span>
        {house.notOnPadsplit && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-extrabold text-white shadow">
            Not on PadSplit
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight text-ink">{house.name || "Private rooms for rent"}</h3>
            {loc && <p className="mt-0.5 text-sm text-muted">{loc}</p>}
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-extrabold text-ink">
              {from != null ? `from ${priceLabel(from, house.rentUnit)}` : "See pricing"}
            </div>
            <div className="text-xs text-muted">all-in</div>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="mt-3 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Availability</p>
            <ul className="mt-1.5 space-y-1">
              {breakdown.map((b) => (
                <li key={b.label} className="flex items-center justify-between text-sm">
                  <span className="text-ink">
                    <span className="font-semibold">{b.count}</span> {b.label}
                  </span>
                  {b.from != null && (
                    <span className="font-semibold text-brand">from {priceLabel(b.from, house.rentUnit)}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Link>
  );
}
