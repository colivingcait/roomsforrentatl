import type { Unit } from "@/lib/types";
import UnitCard from "./UnitCard";

/** Long-term private rentals — a clearly separate section from the PadSplit co-living homes. */
export default function UnitsSection({ units }: { units: Unit[] }) {
  if (units.length === 0) return null;

  return (
    <section className="mx-auto max-w-3xl px-4 pt-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Long-term
          </span>
          <h2 className="text-lg font-extrabold text-ink">Private apartments for rent</h2>
        </div>
        <p className="mt-1.5 text-sm text-muted">
          Whole private units on a monthly lease — your own kitchen, bath, and entrance. Furnished, utilities included,
          and applications handled through TurboTenant.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {units.map((u) => (
            <UnitCard key={u.id} unit={u} />
          ))}
        </div>
      </div>
    </section>
  );
}
