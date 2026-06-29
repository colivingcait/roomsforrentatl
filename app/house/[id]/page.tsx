import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import RoomCard from "@/components/RoomCard";
import PhotoStrip from "@/components/PhotoStrip";
import TrustBand from "@/components/TrustBand";
import CommonAreas from "@/components/CommonAreas";
import FaqButton from "@/components/FaqButton";
import { getHouse, getAllHouseIds, availableRooms, orderedPhotos, lastUpdated } from "@/lib/houses";
import { fromPriceLabel, availabilityLabel, updatedLabel } from "@/lib/format";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllHouseIds().map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const house = getHouse(params.id);
  if (!house) return { title: "Home not found" };
  return {
    title: `${house.name} — ${fromPriceLabel(house)}`,
    description: `${availabilityLabel(house)} in ${house.neighborhood}, ${house.city}. ${fromPriceLabel(
      house
    )} all-in, utilities included. Book a room today.`,
    openGraph: { images: house.image.startsWith("http") ? [house.image] : [] },
  };
}

export default function HousePage({ params }: { params: { id: string } }) {
  const house = getHouse(params.id);
  if (!house) notFound();

  const rooms = availableRooms(house);
  const updated = updatedLabel(house.checkedAt ?? lastUpdated());

  return (
    <main className="min-h-screen pb-28">
      <Header />

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 sm:mx-auto sm:mt-4 sm:max-w-3xl sm:aspect-[16/9] sm:rounded-2xl">
        <PhotoStrip images={orderedPhotos(house)} alt={house.name} sizes="100vw" priority />
        <Link
          href="/"
          className="absolute left-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-lg font-bold text-ink shadow active:scale-95"
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
            <p className="mt-1 text-muted">{house.city}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-2xl font-extrabold text-ink">{fromPriceLabel(house)}</div>
            <div className="text-xs text-muted">all-in, bills included</div>
          </div>
        </div>

        {house.rating != null && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="text-lg leading-none text-amber-500" aria-hidden>★</span>
            <span className="text-lg font-extrabold text-ink">{house.rating.toFixed(1)}</span>
            <span className="text-sm text-muted">
              {house.reviewCount
                ? `· ${house.reviewCount} resident review${house.reviewCount === 1 ? "" : "s"}`
                : "· Resident rating"}
            </span>
          </div>
        )}

        {house.tourUrl && (
          <a
            href={house.tourUrl}
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

        {house.blurb && <p className="mt-4 text-slate-600">{house.blurb}</p>}

        {/* Rooms */}
        <div id="rooms" className="mt-6 flex scroll-mt-20 items-center justify-between">
          <h2 className="text-lg font-bold text-ink">
            {rooms.length > 0 ? `${availabilityLabel(house)}` : "No rooms available right now"}
          </h2>
          {updated && <span className="text-xs text-muted">{updated}</span>}
        </div>

        {rooms.length > 0 ? (
          <div className="mt-3 space-y-3">
            {rooms.map((room) => (
              <RoomCard key={room.id} house={house} room={room} />
            ))}
          </div>
        ) : (
          <p className="mt-2 text-muted">
            This home is fully booked at the moment. Check back soon or{" "}
            <Link href="/" className="font-semibold text-brand">
              browse our other available rooms
            </Link>
            .
          </p>
        )}

        <h2 className="mt-8 text-lg font-bold text-ink">Home features</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {house.amenities.map((a) => (
            <li key={a} className="flex items-center gap-2 text-ink">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">✓</span>
              {a}
            </li>
          ))}
        </ul>

        <CommonAreas photos={house.commonAreas} />

        <p className="mt-6 text-xs text-slate-400">
          Rooms &amp; pricing sync from PadSplit{updated ? ` (${updated.toLowerCase()})` : ""} and may change. Exact
          address is shared after booking.
        </p>
      </div>

      <TrustBand />

      {/* Sticky CTA */}
      <div
        data-bottom-bar
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur"
      >
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="hidden sm:block">
            <div className="text-lg font-extrabold text-ink">{fromPriceLabel(house)}</div>
            <div className="text-xs text-muted">{availabilityLabel(house)}</div>
          </div>
          {rooms.length > 0 ? (
            <a href="#rooms" className="btn-book flex-1">
              Pick a room to book →
            </a>
          ) : (
            <Link href="/" className="btn-book flex-1">
              See other available rooms →
            </Link>
          )}
          {/* Mobile-only chat button (desktop uses the floating launcher). */}
          <FaqButton className="btn-secondary px-4 sm:hidden" label="💬" startTab="chat" />
        </div>
      </div>
    </main>
  );
}
