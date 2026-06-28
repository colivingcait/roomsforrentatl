import Link from "next/link";
import Image from "next/image";
import type { House } from "@/lib/types";
import { fromPriceLabel, availabilityLabel } from "@/lib/format";

export default function HouseCard({ house }: { house: House }) {
  return (
    <Link
      href={`/house/${house.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        <Image
          src={house.image}
          alt={house.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute left-3 top-3">
          {house.available ? (
            <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow">
              ● {availabilityLabel(house)}
            </span>
          ) : (
            <span className="rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-bold text-white shadow">
              Fully booked
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight text-ink">{house.name}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {house.neighborhood} · {house.city}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-extrabold text-ink">{fromPriceLabel(house)}</div>
            <div className="text-xs text-muted">all-in</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {house.amenities.slice(0, 2).map((a) => (
            <span key={a} className="chip">
              {a}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
