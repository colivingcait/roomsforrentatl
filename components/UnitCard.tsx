import Link from "next/link";
import Image from "next/image";
import type { Unit } from "@/lib/types";
import { rentLabel, availDateLabel } from "@/lib/format";

export default function UnitCard({ unit }: { unit: Unit }) {
  const photos = unit.photos ?? [];

  // Coming-soon unit: a simple, non-clickable placeholder card.
  if (unit.comingSoon) {
    return (
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="relative grid aspect-[4/3] w-full place-items-center bg-gradient-to-br from-slate-700 to-slate-900 text-center text-white">
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/70">Coming soon</div>
            <div className="mt-1.5 text-2xl font-extrabold">{unit.type}</div>
            <div className="mt-1 text-sm text-white/90">{availDateLabel(unit.availableDate)}</div>
          </div>
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white shadow">
            Private unit · Long-term
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 p-4">
          <div>
            <h3 className="font-semibold leading-tight text-ink">{unit.title}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {unit.type} · {unit.city}
            </p>
          </div>
          <div className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600">
            Coming soon
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={`/rental/${unit.id}`}
      className="group block overflow-hidden rounded-2xl bg-white shadow-card transition active:scale-[0.99]"
    >
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {photos.length > 0 ? (
          <Image src={photos[0]} alt={unit.title} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand to-brand-dark text-center text-white">
            <div>
              <div className="text-2xl font-extrabold">{unit.type}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-wide text-white/80">Photos coming soon</div>
            </div>
          </div>
        )}

        {/* Long-term tag */}
        <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-2.5 py-1 text-xs font-bold text-white shadow">
          Private unit · Long-term
        </span>

        {unit.tourUrl && (
          <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white shadow">
            🎦 3D Tour
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight text-ink">{unit.title}</h3>
            <p className="mt-0.5 text-sm text-muted">
              {unit.type} · {unit.city}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-extrabold text-ink">{rentLabel(unit.rent)}</div>
            <div className="text-xs text-muted">monthly</div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {unit.furnished && <span className="chip">Furnished</span>}
          {unit.utilitiesIncluded && <span className="chip">Utilities included</span>}
          {unit.sqft ? <span className="chip">{unit.sqft.toLocaleString()} sqft</span> : null}
          <span className="chip text-brand">{availDateLabel(unit.availableDate)}</span>
        </div>
      </div>
    </Link>
  );
}
