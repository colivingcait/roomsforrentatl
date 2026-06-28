import Link from "next/link";
import Image from "next/image";
import type { Listing } from "@/lib/types";
import { priceLabel, moveInLabel } from "@/lib/format";

export default function RoomCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/room/${listing.slug}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        <Image
          src={listing.image}
          alt={listing.name}
          fill
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
        <div className="absolute left-3 top-3 flex gap-2">
          {listing.availableNow ? (
            <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white shadow">
              ● Available now
            </span>
          ) : (
            <span className="rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow">
              {moveInLabel(listing)}
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight text-ink">{listing.name}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {listing.neighborhood} · {listing.city}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-extrabold text-ink">
              {priceLabel(listing.price, listing.priceUnit)}
            </div>
            <div className="text-xs text-muted">all-in</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <span className="chip">{listing.bedType}</span>
          <span className="chip">{listing.bathroom}</span>
          {listing.amenities.slice(0, 1).map((a) => (
            <span key={a} className="chip">
              {a}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
