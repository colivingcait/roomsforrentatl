import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import PhotoStrip from "@/components/PhotoStrip";
import TrustBand from "@/components/TrustBand";
import HouseDetail from "@/components/HouseDetail";
import { getHouse, getAllHouseIds, availableRooms, orderedPhotos } from "@/lib/houses";
import { fromPriceLabel, availabilityLabel, priceLabel } from "@/lib/format";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllHouseIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const house = getHouse(params.id);
  if (!house) return { title: "Home not found" };
  return {
    title: `${house.name} — Furnished Room for Rent in ${house.neighborhood}, Atlanta`,
    description: `Furnished room for rent in ${house.neighborhood}, ${house.city} — ${fromPriceLabel(
      house
    )} all-in, utilities included, next-day move-in via PadSplit. ${availabilityLabel(house)}.`,
    openGraph: { images: house.image.startsWith("http") ? [house.image] : [] },
  };
}

/** LodgingBusiness structured data — helps search engines understand each listing as a real place to stay. */
function houseJsonLd(house: ReturnType<typeof getHouse>) {
  if (!house) return null;
  return {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: house.name,
    description: `Furnished room for rent in ${house.neighborhood}, ${house.city}, weekly, utilities included.`,
    address: {
      "@type": "PostalAddress",
      addressLocality: house.neighborhood,
      addressRegion: "GA",
      addressCountry: "US",
    },
    image: house.image.startsWith("http") ? house.image : undefined,
    ...(house.rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: house.rating,
            reviewCount: house.reviewCount ?? 1,
          },
        }
      : {}),
    ...(house.fromPrice
      ? { priceRange: priceLabel(house.fromPrice, house.priceUnit) }
      : {}),
  };
}

export default function HousePage({ params }: { params: { id: string } }) {
  const house = getHouse(params.id);
  if (!house) notFound();

  const rooms = availableRooms(house);
  const photoCount = orderedPhotos(house).length;

  return (
    <main className="min-h-screen pb-32">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(houseJsonLd(house)) }}
      />
      <Header />

      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 sm:mx-auto sm:mt-4 sm:max-w-3xl sm:rounded-2xl">
        <PhotoStrip images={orderedPhotos(house)} alt={`Furnished room for rent in ${house.neighborhood}, Atlanta — ${house.name}`} sizes="100vw" priority />
        <Link
          href="/"
          className="absolute left-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-lg font-bold text-ink shadow active:scale-95"
          aria-label="Back to all homes"
        >
          ←
        </Link>
        {photoCount > 0 && (
          <span className="absolute bottom-3 right-3 rounded-lg bg-black/60 px-2.5 py-1.5 text-xs font-semibold text-white">
            {house.tourUrl ? `3D tour · ${photoCount} photos` : `${photoCount} photo${photoCount === 1 ? "" : "s"}`}
          </span>
        )}
      </div>

      <div className="mx-auto max-w-3xl px-4">
        <div className="mt-[18px] flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold leading-tight tracking-tight text-ink">{house.name}</h1>
            <p className="mt-1 text-[15px] text-muted">
              {[house.neighborhood, house.city].filter(Boolean).join(", ")}
              {house.rating != null ? ` · ★ ${house.rating.toFixed(1)}` : ""}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[22px] font-extrabold text-ink">{fromPriceLabel(house)}</div>
            {house.totalRooms != null && (
              <div className="text-xs text-muted">
                {house.roomsAvailable} of {house.totalRooms} rooms open
              </div>
            )}
          </div>
        </div>

        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {house.totalRooms != null && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700">
              {house.totalRooms} adults, mixed ages
            </span>
          )}
          {house.totalBaths != null && (
            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700">
              {house.totalBaths} bath{house.totalBaths === 1 ? "" : "s"}
              {house.privateBaths ? `, ${house.privateBaths} private` : ""}
            </span>
          )}
          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700">
            Driveway + street
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-[12.5px] font-semibold text-slate-700">
            Free laundry
          </span>
          {rooms.length > 0 && (
            <span className="rounded-lg bg-brand/10 px-2.5 py-1.5 text-[12.5px] font-semibold text-brand">
              Move in tomorrow
            </span>
          )}
        </div>

        {rooms.length > 0 ? (
          <HouseDetail house={house} rooms={rooms} />
        ) : (
          <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <p className="font-semibold text-ink">This home is fully booked right now.</p>
            <p className="mt-1.5 text-sm text-muted">
              Rooms turn over most weeks — check back soon, or{" "}
              <Link href="/" className="font-semibold text-brand">
                browse our other available rooms
              </Link>
              .
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <TrustBand />
      </div>
    </main>
  );
}
