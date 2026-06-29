import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "@/components/Header";
import { getRoom, getAllRoomParams } from "@/lib/houses";
import { priceLabel, prettyBath, prettyBed, roomTitle, roomTagline, moveInLabel, roomHighlights } from "@/lib/format";
import { site, roomBookingUrl } from "@/lib/site";

export const revalidate = 3600;

export function generateStaticParams() {
  return getAllRoomParams();
}

export async function generateMetadata({
  params,
}: {
  params: { id: string; roomId: string };
}): Promise<Metadata> {
  const data = getRoom(params.id, params.roomId);
  if (!data) return { title: "Room not found" };
  const { house, room } = data;
  return {
    title: `${roomTitle(room)} — ${house.name}`,
    description: `${prettyBath(room.bathroomType)}${
      room.weeklyRate ? `, ${priceLabel(room.weeklyRate)} all-in` : ""
    } in ${house.city}. ${moveInLabel(room.moveInDate)}.`,
    openGraph: { images: room.image && room.image.startsWith("http") ? [room.image] : [] },
  };
}

export default function RoomPage({ params }: { params: { id: string; roomId: string } }) {
  const data = getRoom(params.id, params.roomId);
  if (!data) notFound();
  const { house, room } = data;

  const photos = room.photos.length ? room.photos : room.image ? [room.image] : [house.image];
  const tagline = roomTagline(room);

  const features: { label: string; value: string }[] = [];
  features.push({ label: "Bathroom", value: prettyBath(room.bathroomType) });
  if (prettyBed(room.bedSize)) features.push({ label: "Bed", value: prettyBed(room.bedSize)! });
  if (room.roomSize) features.push({ label: "Room size", value: cap(room.roomSize) });
  if (room.privateAccess) features.push({ label: "Entrance", value: "Private entrance" });
  if (room.miniFridge) features.push({ label: "Mini fridge", value: "Included" });
  if (room.workspace) features.push({ label: "Workspace", value: "Desk included" });
  if (room.climateControl) features.push({ label: "Climate", value: prettyClimate(room.climateControl) });
  if (room.windows) features.push({ label: "Windows", value: String(room.windows) });

  return (
    <main className="min-h-screen pb-28">
      <Header />

      {/* Photo gallery */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 sm:aspect-[16/9]">
        <Image src={photos[0]} alt={roomTitle(room)} fill priority sizes="100vw" className="object-cover" />
        <Link
          href={`/house/${house.id}`}
          className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-2 text-sm font-bold text-ink shadow active:scale-95"
        >
          ← See more rooms
        </Link>
      </div>
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {photos.slice(1, 6).map((p, i) => (
            <div key={i} className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-slate-100">
              <Image src={p} alt={`${roomTitle(room)} photo ${i + 2}`} fill sizes="120px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4">
        <div className="mt-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-brand">{house.name}</p>
            <h1 className="text-2xl font-extrabold leading-tight text-ink">{roomTitle(room)}</h1>
            <p className="mt-1 text-muted">
              {house.city}
            </p>
          </div>
          <div className="shrink-0 text-right">
            {room.weeklyRate != null && (
              <div className="text-2xl font-extrabold text-ink">{priceLabel(room.weeklyRate)}</div>
            )}
            <div className="text-xs text-muted">all-in, bills included</div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {roomHighlights(room).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-1 text-sm font-bold text-accent-dark"
            >
              ★ {tag}
            </span>
          ))}
          {room.bathroomType === "shared" && <span className="chip">{prettyBath(room.bathroomType)}</span>}
          {prettyBed(room.bedSize) && <span className="chip">{prettyBed(room.bedSize)}</span>}
          <span className="chip text-brand">{moveInLabel(room.moveInDate)}</span>
        </div>

        {tagline && <p className="mt-4 text-slate-600">{tagline}</p>}

        <h2 className="mt-7 text-lg font-bold text-ink">Room features</h2>
        <dl className="mt-3 grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.label} className="rounded-xl border border-slate-100 bg-white p-3">
              <dt className="text-xs uppercase tracking-wide text-muted">{f.label}</dt>
              <dd className="mt-0.5 font-semibold text-ink">{f.value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-7 text-lg font-bold text-ink">Included with every room</h2>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {house.amenities.map((a) => (
            <li key={a} className="flex items-center gap-2 text-ink">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">✓</span>
              {a}
            </li>
          ))}
        </ul>

        <p className="mt-6 text-xs text-slate-400">
          Tap “Book this room” to apply &amp; pay on PadSplit’s secure page. Pricing/availability sync from PadSplit and
          may change. Exact address is shared after booking.
        </p>
      </div>

      {/* Sticky booking bar */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <div className="hidden sm:block">
            {room.weeklyRate != null && <div className="text-lg font-extrabold text-ink">{priceLabel(room.weeklyRate)}</div>}
            <div className="text-xs text-muted">{moveInLabel(room.moveInDate)}</div>
          </div>
          <a
            href={roomBookingUrl(house.id, room.applyIndex ?? room.padIndex, house.padsplitUrl)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-book flex-1"
          >
            Book this room →
          </a>
          <Link href={`/house/${house.id}`} className="btn-secondary px-4" aria-label="See more rooms">
            Rooms
          </Link>
        </div>
      </div>
    </main>
  );
}

function cap(s: string): string {
  return s.replace(/(^|[-\s])([a-z])/g, (_, p, c) => p + c.toUpperCase()).replace(/-/g, " ");
}
function prettyClimate(s: string): string {
  return s.replace(/-/g, " ").replace(/\bac\b/i, "A/C").replace(/(^|\s)([a-z])/g, (_, p, c) => p + c.toUpperCase());
}
