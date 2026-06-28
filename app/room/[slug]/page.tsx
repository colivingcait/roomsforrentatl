import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import { getListing, getAllSlugs } from "@/lib/listings";
import { priceLabel, moveInLabel } from "@/lib/format";
import { site, bookingUrl } from "@/lib/site";

export const revalidate = 900;

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const listing = await getListing(params.slug);
  if (!listing) return { title: "Room not found" };
  return {
    title: `${listing.name} — ${priceLabel(listing.price, listing.priceUnit)}`,
    description: `${listing.bedType}, ${listing.bathroom} in ${listing.neighborhood}, ${listing.city}. ${priceLabel(
      listing.price,
      listing.priceUnit
    )} all-in. ${listing.availableNow ? "Available now — move in today." : moveInLabel(listing) + "."}`,
    openGraph: { images: [listing.image] },
  };
}

export default async function RoomPage({ params }: { params: { slug: string } }) {
  const listing = await getListing(params.slug);
  if (!listing) notFound();

  return (
    <main className="min-h-screen pb-28">
      <Header />

      {/* Photo */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[16/9]">
        <Image
          src={listing.image}
          alt={listing.name}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <Link
          href="/"
          className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg font-bold text-ink shadow active:scale-95"
          aria-label="Back to all rooms"
        >
          ←
        </Link>
        <div className="absolute right-3 top-3">
          {listing.availableNow ? (
            <span className="rounded-full bg-brand px-3 py-1.5 text-sm font-bold text-white shadow">
              ● Available now
            </span>
          ) : (
            <span className="rounded-full bg-white/95 px-3 py-1.5 text-sm font-bold text-ink shadow">
              {moveInLabel(listing)}
            </span>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="mt-5 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold leading-tight text-ink">{listing.name}</h1>
            <p className="mt-1 text-muted">
              {listing.neighborhood} · {listing.city}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-extrabold text-ink">
              {priceLabel(listing.price, listing.priceUnit)}
            </div>
            <div className="text-xs text-muted">all-in, bills included</div>
          </div>
        </div>

        {listing.highlight && (
          <div className="mt-4 rounded-xl bg-accent/10 px-4 py-3 text-sm font-semibold text-accent-dark">
            ⚡ {listing.highlight}
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="chip">{listing.bedType}</span>
          <span className="chip">{listing.bathroom}</span>
          <span className="chip">{moveInLabel(listing)}</span>
        </div>

        <h2 className="mt-7 text-lg font-bold text-ink">What’s included</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {listing.amenities.map((a) => (
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
            <li>1. Tap <span className="font-semibold text-ink">Book this room</span> below.</li>
            <li>2. You’ll go to this room’s secure PadSplit page to apply &amp; pay.</li>
            <li>3. Approved fast movers can often move in same-day.</li>
          </ol>
          <p className="mt-3 text-xs text-slate-400">
            Prices and availability sync automatically from PadSplit and may change. Questions?{" "}
            <a href={site.phoneHref} className="font-semibold text-brand">
              Call or text us
            </a>
            .
          </p>
        </div>
      </div>

      {/* Sticky booking bar — the single primary action */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="hidden sm:block">
            <div className="text-lg font-extrabold text-ink">
              {priceLabel(listing.price, listing.priceUnit)}
            </div>
            <div className="text-xs text-muted">{moveInLabel(listing)}</div>
          </div>
          <a
            href={bookingUrl(listing.padsplitUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book flex-1"
          >
            Book this room →
          </a>
          <a href={site.phoneHref} className="btn-secondary px-4" aria-label="Call or text us">
            📞
          </a>
        </div>
      </div>
    </main>
  );
}
