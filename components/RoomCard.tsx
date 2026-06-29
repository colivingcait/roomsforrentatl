import Link from "next/link";
import Image from "next/image";
import type { House, Room } from "@/lib/types";
import { priceLabel, prettyBath, prettyBed, roomTitle, roomTagline, moveInLabel, roomHighlights } from "@/lib/format";

export default function RoomCard({ house, room }: { house: House; room: Room }) {
  const tagline = roomTagline(room);
  return (
    <Link
      href={`/house/${house.id}/room/${room.id}`}
      className="flex gap-3 overflow-hidden rounded-2xl bg-white p-3 shadow-card transition active:scale-[0.99]"
    >
      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
        {room.image ? (
          <Image src={room.image} alt={roomTitle(room)} fill sizes="120px" className="object-cover" />
        ) : (
          <Image src={house.image} alt={roomTitle(room)} fill sizes="120px" className="object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold leading-tight text-ink">{roomTitle(room)}</h3>
          {room.weeklyRate != null && (
            <span className="shrink-0 font-extrabold text-ink">{priceLabel(room.weeklyRate)}</span>
          )}
        </div>
        {tagline && <p className="mt-0.5 line-clamp-2 text-sm text-muted">{tagline}</p>}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {roomHighlights(room).map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent-dark"
            >
              ★ {tag}
            </span>
          ))}
          {room.bathroomType === "shared" && <span className="chip">{prettyBath(room.bathroomType)}</span>}
          {prettyBed(room.bedSize) && <span className="chip">{prettyBed(room.bedSize)}</span>}
          <span className="chip text-brand">{moveInLabel(room.moveInDate)}</span>
        </div>
      </div>
    </Link>
  );
}
