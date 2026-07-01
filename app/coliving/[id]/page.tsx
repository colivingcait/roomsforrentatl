import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getColivingHouse, getAllColivingHouseIds, availableColivingRooms, depositLine } from "@/lib/coliving";
import type { ColivingRoom } from "@/lib/types";
import { priceLabel, availDateLabel } from "@/lib/format";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllColivingHouseIds().map((id) => ({ id }));
}

export default function ColivingHousePage({ params }: { params: { id: string } }) {
  const house = getColivingHouse(params.id);
  if (!house) notFound();

  const rooms = availableColivingRooms(house);
  const loc = [house.neighborhood, house.city].filter(Boolean).join(", ");

  return (
    <main className="min-h-screen pb-16">
      <Header />

      <div className="mx-auto max-w-3xl px-4">
        <div className="mt-4">
          <Link href="/" className="text-sm font-semibold text-brand">
            ← All homes
          </Link>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Co-living
          </span>
          {house.notOnPadsplit && (
            <span className="rounded-full bg-amber-500 px-2.5 py-1 text-xs font-bold text-white">
              Not on PadSplit
            </span>
          )}
        </div>

        <h1 className="mt-2 text-2xl font-extrabold leading-tight text-ink">
          {house.name || "Private rooms for rent"}
        </h1>
        {loc && <p className="mt-1 text-muted">{loc}</p>}

        {house.description && <p className="mt-3 text-[15px] leading-relaxed text-ink/80">{house.description}</p>}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {house.furnished && <span className="chip">Furnished</span>}
          {house.utilitiesIncluded && <span className="chip">Utilities included</span>}
          {house.wifi && <span className="chip">WiFi included</span>}
          {house.depositAlternative && <span className="chip text-brand">Deposit-free options</span>}
        </div>

        {depositLine(house) && (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-bold text-ink">Move-in</div>
            <p className="mt-1 text-sm text-muted">
              {depositLine(house)} The process is quick and online: fill out the free pre-screener, get approved
              (usually within 24 hours), then pay your first month&apos;s rent plus the flex deposit to move in — as
              soon as the next day or two.
            </p>
          </div>
        )}

        <h2 className="mt-6 text-lg font-extrabold text-ink">
          {rooms.length} room{rooms.length === 1 ? "" : "s"} available
        </h2>
        <p className="mt-1 text-xs text-muted">
          Applying doesn&apos;t hold the room — the first approved, signed lease gets it.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} rentUnit={house.rentUnit} />
          ))}
        </div>
      </div>

      <div className="mt-10">
        <Footer />
      </div>
    </main>
  );
}

function bathLabel(room: ColivingRoom): string {
  if (room.bath === "private") return "Private bath";
  return room.shareWith ? `Semi-private bath (shared with ${room.shareWith})` : "Semi-private bath";
}

function RoomCard({ room, rentUnit }: { room: ColivingRoom; rentUnit: "week" | "month" }) {
  const photo = room.photos?.[0];
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="relative aspect-[4/3] w-full bg-slate-100">
        {photo ? (
          <Image src={photo} alt={room.label} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-200 to-slate-300 text-center text-slate-600">
            <div className="text-sm font-semibold">Photos coming soon</div>
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/65 px-2.5 py-1 text-xs font-bold text-white shadow">
          {room.bath === "private" ? "Private bath" : "Semi-private bath"}
        </span>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold leading-tight text-ink">{room.label}</h3>
            <p className="mt-0.5 text-sm text-muted">{bathLabel(room)}</p>
          </div>
          <div className="shrink-0 text-right">
            <div className="text-lg font-extrabold text-ink">
              {room.price != null ? priceLabel(room.price, rentUnit) : "—"}
            </div>
            {room.availableDate && <div className="text-xs text-brand">{availDateLabel(room.availableDate)}</div>}
          </div>
        </div>

        {room.applyUrl ? (
          <a
            href={room.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book mt-3 block w-full py-2 text-center text-sm"
          >
            Apply for this room →
          </a>
        ) : (
          <div className="mt-3 block w-full rounded-full bg-slate-100 py-2 text-center text-sm font-bold text-slate-500">
            Coming soon
          </div>
        )}
      </div>
    </div>
  );
}
