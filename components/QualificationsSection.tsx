import { RENTAL_QUALIFICATIONS, MOVE_IN_STEPS } from "@/lib/rentalQualifications";

/** Qualifications & move-in process for the long-term rentals product (not co-living). */
export default function QualificationsSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 pt-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-extrabold text-ink">Qualifications</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {RENTAL_QUALIFICATIONS.map((q) => (
            <li key={q} className="flex items-center gap-2 text-ink">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">✓</span>
              {q}
            </li>
          ))}
        </ul>

        <h2 className="mt-6 text-lg font-extrabold text-ink">Move-in process</h2>
        <ol className="mt-3 space-y-2">
          {MOVE_IN_STEPS.map((step, i) => (
            <li key={step} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-xs font-bold text-brand">
                {i + 1}
              </span>
              <span className="text-ink">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
