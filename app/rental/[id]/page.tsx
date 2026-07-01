import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import PhotoStrip from "@/components/PhotoStrip";
import FaqButton from "@/components/FaqButton";
import { getUnit, getAllUnitIds } from "@/lib/units";
import { rentLabel, availDateLabel } from "@/lib/format";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllUnitIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const unit = getUnit(params.id);
  if (!unit) return { title: "Rental not found" };
  return {
    title: `${unit.title} — ${unit.type} in ${unit.city}`,
    description: `${unit.type} for rent in ${unit.city}, ${rentLabel(unit.rent)}.${
      unit.furnished ? " Furnished." : ""
    }${unit.utilitiesIncluded ? " Utilities included." : ""} ${availDateLabel(unit.availableDate)}.`,
  };
}

export default function RentalPage({ params }: { params: { id: string } }) {
  const unit = getUnit(params.id);
  if (!unit) notFound();

  const photos = unit.photos ?? [];
  const facts: { label: string; value: string }[] = [];
  facts.push({ label: "Rent", value: rentLabel(unit.rent) });
  facts.push({ label: "Type", value: unit.type });
  if (unit.sqft) facts.push({ label: "Size", value: `${unit.sqft.toLocaleString()} sq ft` });
  facts.push({ label: "Available", value: availDateLabel(unit.availableDate) });
  if (unit.leaseLength) facts.push({ label: "Lease", value: unit.leaseLength });
  if (unit.deposit != null) facts.push({ label: "Deposit", value: rentLabel(unit.deposit).replace("/mo", "") });
  if (unit.furnished != null) facts.push({ label: "Furnished", value: unit.furnished ? "Yes" : "Unfurnished" });
  if (unit.utilitiesIncluded != null)
    facts.push({ label: "Utilities", value: unit.utilitiesIncluded ? "Included" : "Tenant pays" });
  if (unit.pets) facts.push({ label: "Pets", value: unit.pets });

  return (
    <main className="min-h-screen pb-28">
      <Header />

      {/* Gallery */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 sm:mx-auto sm:mt-4 sm:max-w-3xl sm:aspect-[16/9] sm:rounded-2xl">
        {photos.length > 0 ? (
          <PhotoStrip images={photos} alt={unit.title} sizes="100vw" priority />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-brand to-brand-dark text-center text-white">
            <div>
              <div className="text-3xl font-extrabold">{unit.type}</div>
              <div className="mt-1 text-sm font-medium uppercase tracking-wide text-white/80">Photos coming soon</div>
            </div>
          </div>
        )}
        <Link
          href="/rentals"
          className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-ink shadow active:scale-95"
        >
          ← All rentals
        </Link>
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Long-term lease
            </span>
            <h1 className="mt-2 text-2xl font-extrabold leading-tight text-ink">{unit.title}</h1>
            <p className="mt-1 text-muted">
              {unit.type} · {unit.city}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-extrabold text-ink">{rentLabel(unit.rent)}</div>
            <div className="text-xs text-muted">monthly</div>
          </div>
        </div>

        {unit.tourUrl && (
          <a
            href={unit.tourUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 font-semibold text-brand active:scale-[0.99]"
          >
            <span className="flex items-center gap-2">
              <span className="text-lg leading-none">🎦</span>
              Take the 3D virtual tour
            </span>
            <span aria-hidden>→</span>
          </a>
        )}

        {unit.description && <p className="mt-4 whitespace-pre-line text-slate-600">{unit.description}</p>}

        <h2 className="mt-7 text-lg font-bold text-ink">Details</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          {facts.map((f) => (
            <div key={f.label} className="rounded-xl border border-slate-100 bg-white p-3">
              <dt className="text-xs uppercase tracking-wide text-muted">{f.label}</dt>
              <dd className="mt-0.5 font-semibold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        {unit.features && unit.features.length > 0 && (
          <>
            <h2 className="mt-7 text-lg font-bold text-ink">Features</h2>
            <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {unit.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-ink">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">✓</span>
                  {f}
                </li>
              ))}
            </ul>
          </>
        )}

        {unit.furnishedNote && (
          <div className="mt-6 rounded-xl border border-brand/20 bg-brand/5 p-3 text-sm text-slate-600">
            <p className="font-semibold text-ink">What&rsquo;s furnished</p>
            <p className="mt-1">{unit.furnishedNote}</p>
          </div>
        )}

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          <p className="font-semibold text-ink">How to apply</p>
          <p className="mt-1">
            {unit.applyUrl
              ? "Tap “Apply now” to submit your application securely through TurboTenant — screening and lease are handled there."
              : "Applications for this unit are opening soon. Tap “Ask about this unit” to message us and we’ll get you on the list."}
          </p>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          This is a private long-term rental (monthly lease), separate from our weekly co-living rooms. Photos show the
          unit furnished; some décor and personal items belong to the current resident. Exact address is shared during
          the application.
        </p>
      </div>

      {/* Sticky apply bar */}
      <div
        data-bottom-bar
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="hidden sm:block">
            <div className="text-lg font-extrabold text-ink">{rentLabel(unit.rent)}</div>
            <div className="text-xs text-muted">{availDateLabel(unit.availableDate)}</div>
          </div>
          {unit.applyUrl ? (
            <a href={unit.applyUrl} target="_blank" rel="noopener noreferrer" className="btn-book flex-1">
              Apply now →
            </a>
          ) : (
            <FaqButton className="btn-book flex-1" label="Ask about this unit" startTab="chat" />
          )}
        </div>
      </div>
    </main>
  );
}
