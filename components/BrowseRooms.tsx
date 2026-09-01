"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { House } from "@/lib/types";
import type { RoomListing } from "@/lib/browse";
import { APPLICATION_FEE } from "@/lib/browse";
import { priceLabel } from "@/lib/format";

type FilterKey = "tomorrow" | "priv" | "bus";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "tomorrow", label: "Move in tomorrow" },
  { key: "priv", label: "Private bath" },
  { key: "bus", label: "Walk to a bus" },
];

export default function BrowseRooms({
  rooms,
  soldOut,
  updated,
}: {
  rooms: RoomListing[];
  soldOut: House[];
  updated: string | null;
}) {
  const priced = rooms.filter((r) => r.rate != null);
  const dataMin = priced.length ? Math.floor(Math.min(...priced.map((r) => r.rate as number)) / 10) * 10 : 150;
  const dataMax = priced.length ? Math.ceil(Math.max(...priced.map((r) => r.rate as number)) / 10) * 10 : 260;

  const [active, setActive] = useState<Record<FilterKey, boolean>>({ tomorrow: false, priv: false, bus: false });
  const [budget, setBudget] = useState(dataMax);

  const toggle = (key: FilterKey) => setActive((s) => ({ ...s, [key]: !s[key] }));

  const results = useMemo(
    () =>
      rooms.filter((r) => {
        if (active.tomorrow && !r.movesInSoon) return false;
        if (active.priv && r.bath !== "private") return false;
        if (active.bus && !r.walkToBus) return false;
        if (r.rate != null && r.rate > budget) return false;
        return true;
      }),
    [rooms, active, budget]
  );

  const resultLabel =
    results.length === 0
      ? "No rooms match those filters"
      : `${results.length} room${results.length === 1 ? "" : "s"} match, cheapest first`;

  const anyFiltersActive = active.tomorrow || active.priv || active.bus || budget < dataMax;

  return (
    <section>
      <div className="bg-brand px-4 pb-[18px] pt-5 text-white">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-[25px] font-extrabold leading-[1.15] tracking-tight">
            {rooms.length > 0
              ? `${rooms.length} room${rooms.length === 1 ? "" : "s"} open in Atlanta today.`
              : "Furnished rooms for rent in Atlanta."}
          </h1>
          <p className="mt-2 text-[14.5px] leading-relaxed text-white/80">
            {priced.length > 0
              ? `${priceLabel(dataMin)}–${priceLabel(dataMax)} a week, all in. $${APPLICATION_FEE} to apply, no deposit, keys tomorrow.`
              : `$${APPLICATION_FEE} to apply, no deposit, keys tomorrow.`}
          </p>
          {updated && <p className="mt-1 text-xs text-white/60">Updated {updated.toLowerCase()}</p>}
        </div>
      </div>

      <div className="border-b border-slate-200 bg-white px-4 py-3">
        <div className="mx-auto max-w-3xl">
          <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => toggle(f.key)}
                className={
                  "shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-[13px] font-semibold transition active:scale-95 " +
                  (active[f.key]
                    ? "border-brand bg-brand text-white"
                    : "border-slate-200 bg-white text-slate-700")
                }
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="mt-[11px]">
            <div className="flex justify-between text-xs font-semibold text-muted">
              <span>Weekly budget</span>
              <span className="text-ink">up to {priceLabel(budget)}</span>
            </div>
            <input
              type="range"
              min={dataMin}
              max={dataMax}
              step={1}
              value={budget}
              onChange={(e) => setBudget(Number(e.target.value))}
              className="mt-1.5 w-full accent-brand"
            />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-4 pt-[14px]">
        <p className="mb-2.5 text-[13px] font-semibold text-muted">{resultLabel}</p>
        <div className="flex flex-col gap-3">
          {results.map((r) => (
            <Link
              key={r.key}
              href={`/house/${r.houseId}/room/${r.roomId}`}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition active:scale-[0.99]"
            >
              <div className="flex gap-3 p-3">
                <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  <Image src={r.photo} alt={r.name} fill sizes="112px" className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-[15.5px] font-bold text-ink">{r.name}</h3>
                    <div className="shrink-0 text-right text-[17px] font-extrabold text-ink">
                      {r.rate != null ? priceLabel(r.rate) : "See pricing"}
                    </div>
                  </div>
                  <p className="mt-0.5 text-[13px] text-muted">
                    {r.houseName} · {r.area}
                  </p>
                  <div className="mt-[7px] flex flex-wrap gap-1.5">
                    <span
                      className={
                        "rounded-[7px] px-2 py-1 text-[11.5px] font-semibold " +
                        (r.bath === "private" ? "bg-accent/10 text-accent-dark" : "bg-slate-100 text-slate-700")
                      }
                    >
                      {r.bath === "private" ? "Private bath" : "Shared bath"}
                    </span>
                    <span className="rounded-[7px] bg-slate-100 px-2 py-1 text-[11.5px] font-semibold text-slate-700">
                      {r.transitChip}
                    </span>
                    <span className="rounded-[7px] bg-slate-100 px-2 py-1 text-[11.5px] font-semibold text-slate-700">
                      Free laundry
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 bg-[#FAFAF9] px-3 py-2.5">
                <span className="text-xs text-muted">
                  {r.total != null ? priceLabel(r.total).replace("/wk", "") : "See pricing"} to get the keys
                </span>
                <span className="rounded-[9px] bg-ink px-3.5 py-2 text-[13px] font-bold text-white">Apply</span>
              </div>
            </Link>
          ))}
        </div>

        {results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 p-5 text-center">
            <div className="text-[15px] font-bold text-ink">
              Nothing open under {priceLabel(budget)} with those filters
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
              {anyFiltersActive
                ? "Try loosening the budget or clearing a filter."
                : "Check back soon, or ask us about a specific home."}
            </p>
            {anyFiltersActive && (
              <button
                type="button"
                onClick={() => {
                  setActive({ tomorrow: false, priv: false, bus: false });
                  setBudget(dataMax);
                }}
                className="mt-3 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white active:scale-95"
              >
                Reset filters
              </button>
            )}
          </div>
        )}
      </div>

      {soldOut.length > 0 && (
        <div className="mx-auto max-w-3xl px-4 pt-[18px]">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3.5">
              <div className="text-[14.5px] font-extrabold text-ink">
                {soldOut.length} home{soldOut.length === 1 ? " is" : "s are"} full right now
              </div>
              <div className="mt-[3px] text-[12.5px] leading-relaxed text-muted">
                Rooms turn over most weeks. We text this list before a room goes public.
              </div>
            </div>
            {soldOut.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-[11px] last:border-b-0"
              >
                <div>
                  <div className="text-[13.5px] font-bold text-ink">{h.name}</div>
                  <div className="mt-px text-xs text-muted">
                    {[h.neighborhood, h.city].filter(Boolean).join(", ")}
                  </div>
                </div>
                <Link
                  href={`/house/${h.id}`}
                  className="shrink-0 rounded-[9px] border border-brand/35 bg-brand/[0.06] px-3 py-[7px] text-[12.5px] font-bold text-brand"
                >
                  Text me
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pb-[22px] pt-4">
        <div className="grid grid-cols-2 gap-2">
          <ReassuranceCard title="$19 and no deposit" body="Refunded if you're declined. First week charged on approval." />
          <ReassuranceCard title="Income 2× the rent" body="No credit score. Pay stub, bank statement or offer letter." />
          <ReassuranceCard title="Your own locked room" body="Every resident is background-screened." />
          <ReassuranceCard title="Pet-free, residents only" body="Need otherwise? We'll point you to PadSplit's search." />
        </div>
      </div>
    </section>
  );
}

function ReassuranceCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="text-[13px] font-bold text-ink">{title}</div>
      <div className="mt-[3px] text-xs leading-snug text-muted">{body}</div>
    </div>
  );
}
