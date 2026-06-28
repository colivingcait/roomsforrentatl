import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import { getHouse, getAllHouseIds, lastUpdated } from "@/lib/houses";
import { fromPriceLabel, availabilityLabel, updatedLabel } from "@/lib/format";
import { site, bookingUrl } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllHouseIds().map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const house = getHouse(params.id);
  if (!house) return { title: "Home not found" };
  return {
    title: `${house.name} — ${fromPriceLabel(house)}`,
    description: `${availabilityLabel(house)} in ${house.neighborhood}, ${house.city}. ${fromPriceLabel(
      house
    )} all-in, utilities included. Book your room today.`,
    openGraph: { images: house.image.startsWith("http") ? [house.image] : [] },
  };
}

export default function HousePage({ params }: { params: { id: string } }) {
  const house = getHouse(params.id);
  if (!house) notFound();

  const updated = updatedLabel(house.checkedAt ?? lastUpdated());

  return (
    <main className="min-h-screen pb-28">
      <Header />

      <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[16/9]">
        <Image src={house.image} alt={house.name} fill priority sizes="100vw" className="object-cover" />
        <Link
          href="/"
          className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg font-bold text-ink shadow active:scale-95"
          aria-label="Back to all homes"
        >
          ←
        </Link>
        <div className="absolute right-3 top-3">
          {house.available ? (
            <span className="rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white shadow">
              ● {availabilityLabel(house)}
            </span>
          ) : (
            <span className="rounded-full bg-slate-900/80 px-3 py-1.5 text-sm font-bold text-white shadow">
              Fully booked
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight text-ink">{house.name}</h1>
            <p className="mt-1 text-muted">
              {house.neighborhood} · {house.city}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-extrabold text-ink">{fromPriceLabel(house)}</div>
            <div className="text-xs text-muted">all-in, bills included</div>
          </div>
        </div>

        {house.blurb && <p className="mt-4 text-slate-600">{house.blurb}</p>}

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="chip">{availabilityLabel(house)}</span>
          {updated && <span className="chip">{updated}</span>}
        </div>

        <h2 className="mt-7 text-lg font-bold text-ink">What’s included</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {house.amenities.map((a) => (
            <li key={a} className="flex items-center gap-2 text-ink">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                ✓
              </span>
              {a}
            </li>
          ))}
        </ul>

        <div className="mt-7 rounded-2xl border border-slate-100 bg-white p-4 shadow-card">
          <h2 className="text-lg font-bold text-ink">How booking works</h2>
          <ol className="mt-2 space-y-2 text-sm text-slate-600">
            <li>1. Tap <span className="font-semibold text-ink">Book a room</span> below.</li>
            <li>2. You’ll go to this home’s secure PadSplit page to pick a room, apply &amp; pay.</li>
            <li>3. Approved fast movers can often move in same-day.</li>
          </ol>
          <p className="mt-3 text-xs text-slate-400">
            Rooms available &amp; pricing sync from PadSplit{updated ? ` (${updated.toLowerCase()})` : ""} and may
            change. Questions?{" "}
            <a href={site.phoneHref} className="font-semibold text-brand">
              Call or text us
            </a>
            .
          </p>
        </div>
      </div>

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="hidden sm:block">
            <div className="text-lg font-extrabold text-ink">{fromPriceLabel(house)}</div>
            <div className="text-xs text-muted">{availabilityLabel(house)}</div>
          </div>
          <a
            href={bookingUrl(house.padsplitUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book flex-1"
          >
            {house.available ? "Book a room →" : "View on PadSplit →"}
          </a>
          <a href={site.phoneHref} className="btn-secondary px-4" aria-label="Call or text us">
            📞
          </a>
        </div>
      </div>
    </main>
  );
}
