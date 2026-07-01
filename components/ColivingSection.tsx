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

function ColivingHouseCard({ house }: { house: ColivingHouse }) {
  const rooms = availableColivingRooms(house);
  const from = colivingFromPrice(house);
  const hero = rooms.find((r) => r.photos && r.photos.length > 0)?.photos?.[0];
  const loc = [house.neighborhood, house.city].filter(Boolean).join(", ");

  return (
    <Link
      href={`/coliving/${house.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.99]"
    >
      <div className="relative aspect-[16/9] w-full bg-slate-100">
        {hero ? (
          <Image src={hero} alt={house.name} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand to-brand-dark text-center text-white">
            <div>
              <div className="text-2xl font-extrabold">{house.name || "Private rooms"}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">Photos coming soon</div>
            </div>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white shadow">
          Co-living
        </span>
        {house.notOnPadsplit && (
          <span className="absolute right-3 top-3 rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white shadow">
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
            <div className="text-xs text-muted">
              {rooms.length} room{rooms.length === 1 ? "" : "s"} available
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {house.furnished && <span className="chip">Furnished</span>}
          {house.utilitiesIncluded && <span className="chip">Utilities included</span>}
          {house.wifi && <span className="chip">WiFi included</span>}
          {house.depositAlternative === "rhino" && <span className="chip">No deposit</span>}
          <span className="chip text-brand">Apply online</span>
        </div>
      </div>
    </Link>
  );
}
