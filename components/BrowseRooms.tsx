"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import type { House } from "@/lib/types";
import type { RoomListing } from "@/lib/browse";
import { priceLabel, submarketLabel } from "@/lib/format";
import {
  doubleOccupancySearchUrl,
  fewerHousematesSearchUrl,
  instantBookingSearchUrl,
  noMoveInFeeSearchUrl,
  phoneTelHref,
  privateBathSearchUrl,
  site,
} from "@/lib/site";
import TrackedOutboundLink from "@/components/TrackedOutboundLink";
import type { FilterStartingPrices } from "@/lib/filterPrices";
import { getMarket } from "@/lib/market";

/** Card order is fixed. The dollar comes from the live PadSplit search, or is omitted. */
const FILTER_CARDS = [
  {
    key: "instant" as const,
    href: instantBookingSearchUrl(),
    event: "instant_booking_search_click",
    label: "Book instantly",
    aria: "Instant booking rooms",
    tint: "bg-[#EEF0FF]",
    tone: "bg-[#3730A3]",
    priceColor: "text-[#3730A3]",
    icon: "bolt" as const,
    note: "Apply and lock in your room today. No waiting on host approval.",
  },
  {
    key: "privateBath" as const,
    href: privateBathSearchUrl(),
    event: "private_bath_search_click",
    label: "Private bathroom",
    aria: "Private bathroom rooms",
    tint: "bg-[#EAF5F1]",
    tone: "bg-brand",
    priceColor: "text-brand",
    icon: "bath" as const,
    note: null,
  },
  {
    key: "roomForTwo" as const,
    href: doubleOccupancySearchUrl(),
    event: "double_occupancy_search_click",
    label: "Room for two",
    aria: "Rooms for two",
    tint: "bg-[#FFF1EA]",
    tone: "bg-accent",
    priceColor: "text-accent",
    icon: "people" as const,
    note: null,
  },
  {
    key: "fewer" as const,
    href: fewerHousematesSearchUrl(),
    event: "fewer_housemates_search_click",
    label: "5 or fewer housemates",
    aria: "Rooms with 5 or fewer housemates",
    tint: "bg-[#EEF2F7]",
    tone: "bg-ink",
    priceColor: "text-ink",
    icon: "home" as const,
    note: null,
  },
  {
    key: "noFee" as const,
    href: noMoveInFeeSearchUrl(),
    event: "no_move_in_fee_search_click",
    label: "No move-in fee",
    aria: "Rooms with no move-in fee",
    tint: "bg-[#F3F0FF]",
    tone: "bg-[#6D28D9]",
    priceColor: "text-[#6D28D9]",
    icon: "fee" as const,
    note: "Skip the one-time host fee.",
  },
] as const;

/** Interior photos from the approved mockup. Never an exterior or a street shot. */
const CARD_PHOTO: Record<string, { src: string; alt: string }> = {
  "35011": {
    src: "/photos/mora-room-2.jpg",
    alt: "Furnished bedroom with a bed and shelving, kitchen through the door, at The Mora House",
  },
  "8299": {
    src: "/photos/candace-room-3.jpg",
    alt: "Furnished bedroom with a bed, desk, and window at The Candace House",
  },
};

export default function BrowseRooms({
  rooms,
  soldOut,
  houses,
  filterPrices,
}: {
  rooms: RoomListing[];
  soldOut: House[];
  houses: House[];
  filterPrices: FilterStartingPrices;
}) {
  const houseById = useMemo(() => new Map(houses.map((h) => [h.id, h])), [houses]);
  const rates = rooms.map((r) => r.rate).filter((n): n is number => n != null);
  // Exact open-room rates. The cheapest room is $171, so the slider must not
  // start a dollar below that.
  const sliderMin = rates.length ? Math.min(...rates) : null;
  const sliderMax = rates.length ? Math.max(...rates) : null;
  const [budget, setBudget] = useState(sliderMax ?? 0);

  const visible = rooms.filter((r) => r.rate == null || sliderMax == null || r.rate <= budget);
  const openLabel = `${rooms.length} open now, cheapest first`;
  const market = getMarket();

  return (
    <>
      <section className="relative overflow-hidden bg-[#042C25] text-white">
        {market.heroPhoto ? (
          <div
            aria-hidden
            className="absolute inset-0 bg-[url('/photos/candace-room-1-wide.jpg')] bg-[length:100%_auto] bg-[center_top] bg-no-repeat md:bg-[url('/photos/mora-room-1-lg.jpg')] md:bg-cover md:bg-[center_72%]"
          />
        ) : null}
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,63,53,.08)_0%,rgba(6,63,53,.30)_100px,rgba(5,52,44,.80)_180px,#042C25_232px,#042C25_100%)] md:bg-[linear-gradient(90deg,rgba(4,44,37,.94)_0%,rgba(6,63,53,.82)_42%,rgba(6,63,53,.35)_75%,rgba(6,63,53,.2)_100%)]"
        />
        <div
          className={
            market.heroPhoto
              ? "relative mx-auto max-w-[1080px] px-[18px] pb-[26px] pt-[168px] md:px-6 md:pb-[84px] md:pt-24"
              : "relative mx-auto max-w-[1080px] px-[18px] pb-10 pt-12 md:px-6 md:pb-16 md:pt-16"
          }
        >
          <span className="inline-flex items-center gap-[7px] rounded-full border border-white/20 bg-ink/35 py-1 pl-2 pr-[11px] text-[12.5px] font-bold text-white backdrop-blur-sm">
            <i className="h-2 w-2 rounded-full bg-[#4ADE80] shadow-[0_0_0_3px_rgba(74,222,128,.25)]" />
            {market.heroKicker}
          </span>
          <h1 className="mt-3 text-[33px] font-extrabold leading-[1.08] tracking-[-0.025em] text-white [text-shadow:0_2px_18px_rgba(0,0,0,.25)] md:max-w-[880px] md:text-[54px]">
            Open rooms at every price. Move in as soon as{" "}
            <span className="relative z-0 whitespace-nowrap after:absolute after:inset-x-0 after:bottom-[0.02em] after:z-[-1] after:h-[0.16em] after:rounded-[4px] after:bg-accent after:opacity-95">
              tomorrow.
            </span>
          </h1>
        </div>
      </section>

      <section id="filters" className="bg-white">
        <div className="mx-auto max-w-[1080px] px-[18px] py-[26px] md:px-6 md:py-[34px]">
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-accent before:h-[3px] before:w-[18px] before:rounded-sm before:bg-accent">
            Find your fit
          </span>
          <h2 className="mt-1.5 text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink md:text-[32px]">
            What do you need?
          </h2>
          <div className="mt-3.5 grid grid-cols-1 gap-3 lg:grid-cols-6 lg:gap-3 xl:grid-cols-5">
            {FILTER_CARDS.map((card, index) => {
              const price = filterPrices[card.key];
              const wideSecondRow = index >= 3 ? " lg:col-span-3" : " lg:col-span-2";
              return (
              <TrackedOutboundLink
                key={card.event}
                href={card.href}
                event={card.event}
                properties={{ source: "homepage" }}
                target="_blank"
                rel="noopener noreferrer"
                ariaLabel={price != null ? `${card.aria} from $${price} a week` : card.aria}
                className={
                  "group relative flex items-center gap-3.5 overflow-hidden rounded-[20px] border border-transparent p-3.5 pr-[52px] transition hover:-translate-y-0.5 hover:border-accent/50 hover:shadow-[0_2px_6px_rgba(15,23,42,.06),0_18px_40px_rgba(15,23,42,.10)] lg:min-h-[168px] lg:flex-col lg:items-start lg:gap-2.5 lg:p-3.5 lg:pr-3.5 xl:col-span-1 xl:min-h-[176px] xl:gap-2 xl:p-3" +
                  wideSecondRow +
                  " " +
                  card.tint
                }
              >
                <span
                  aria-hidden
                  className={"pointer-events-none absolute -bottom-10 -right-[30px] h-[110px] w-[110px] rounded-full opacity-[0.07] " + card.tone}
                />
                <span className={"relative grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-[0_6px_14px_rgba(15,23,42,.14)] lg:h-11 lg:w-11 xl:h-10 xl:w-10 " + card.tone}>
                  <FilterIcon name={card.icon} />
                </span>
                <span className="relative flex min-w-0 flex-col">
                  <span className="text-[16.5px] font-extrabold leading-tight text-ink lg:text-[15px] xl:text-[13px]">{card.label}</span>
                  {price != null && (
                    <span className="mt-[3px] flex items-baseline gap-1 whitespace-nowrap leading-none">
                      <span className="text-[13px] font-semibold text-muted lg:text-xs">from</span>
                      <b className={"text-[28px] font-black tracking-[-0.03em] lg:text-[24px] xl:text-[22px] " + card.priceColor}>
                        ${price}
                      </b>
                      <span className="-ml-1 text-[15px] font-bold text-slate-700 lg:text-sm">/wk</span>
                    </span>
                  )}
                  {card.note && (
                    <span className="mt-1.5 text-[12.5px] font-semibold leading-snug text-slate-600 lg:text-xs lg:leading-[1.35]">{card.note}</span>
                  )}
                </span>
                <span className="absolute right-3.5 top-1/2 z-[1] grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full bg-white text-ink shadow-[0_1px_3px_rgba(15,23,42,.12)] transition group-hover:bg-accent group-hover:text-white lg:right-3 lg:top-3 lg:translate-y-0">
                  <ExternalIcon />
                </span>
              </TrackedOutboundLink>
              );
            })}
          </div>
          <div className="mt-3.5 flex flex-col gap-1 text-[12.5px] leading-snug text-muted sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
            <p className="flex items-center gap-1.5">
              <LockIcon />
              Rooms booked securely through PadSplit
            </p>
            <span aria-hidden className="hidden text-slate-300 sm:inline">
              ·
            </span>
            <p>Some hosts charge a one-time move-in fee (often around $100), shown on each listing.</p>
          </div>
        </div>
      </section>

      <section id="featured" className="bg-[linear-gradient(180deg,#EAF5F1,#F4FAF8)]">
        <div className="mx-auto max-w-[1080px] px-[18px] pb-[30px] pt-[34px] md:px-6 md:pb-11 md:pt-12">
          <div className="md:flex md:items-end md:justify-between md:gap-6">
            <div>
              <h2 className="text-[26px] font-extrabold leading-[1.15] tracking-[-0.02em] text-ink md:text-[32px]">
                Featured Rooms
              </h2>
              {rooms.length > 0 && <p className="mt-1 text-[14.5px] text-muted">{openLabel}</p>}
            </div>
            {sliderMin != null && sliderMax != null && (
              <div className="mt-4 rounded-2xl bg-white px-3.5 pb-2.5 pt-3 shadow-card md:mt-0 md:w-[360px] md:shrink-0">
                <div className="flex justify-between text-xs font-semibold text-muted">
                  <span>Weekly budget</span>
                  <b className="text-[13px] font-extrabold text-ink">up to {priceLabel(budget)}</b>
                </div>
                <input
                  type="range"
                  min={sliderMin}
                  max={sliderMax}
                  step={1}
                  value={Math.min(Math.max(budget, sliderMin), sliderMax)}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  aria-label="Weekly budget"
                  className="mt-1.5 w-full accent-brand"
                />
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>${sliderMin}</span>
                  <span>${sliderMax}</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 grid gap-4 md:mt-[22px] md:grid-cols-2 md:gap-5">
            {visible.map((r) => {
              const house = houseById.get(r.houseId);
              const photo = CARD_PHOTO[r.houseId];
              const tags = featureTags(r, house);
              return (
                <Link
                  key={r.key}
                  href={`/house/${r.houseId}/room/${r.roomId}`}
                  className="block overflow-hidden rounded-[20px] bg-white shadow-card transition hover:-translate-y-0.5 hover:shadow-[0_2px_6px_rgba(15,23,42,.06),0_18px_40px_rgba(15,23,42,.10)]"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-[#dfe6ec]">
                    <Image
                      src={photo?.src ?? r.photo}
                      alt={photo?.alt ?? `${houseTitle(r.houseName)} bedroom`}
                      fill
                      sizes="(min-width: 768px) 500px, 100vw"
                      className="object-cover"
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-ink/55 to-transparent" />
                    <span className="absolute left-3 top-3 z-[1] flex items-center gap-1.5 rounded-full bg-white py-1 pl-2 pr-2.5 text-xs font-extrabold text-brand">
                      <i className="h-2 w-2 rounded-full bg-[#22C55E] shadow-[0_0_0_3px_rgba(34,197,94,.2)]" />
                      Open now
                    </span>
                    <span aria-hidden className="absolute bottom-3.5 left-3 z-[1] flex gap-1">
                      <i className="h-1.5 w-4 rounded-sm bg-white" />
                      <i className="h-1.5 w-1.5 rounded-full bg-white/55" />
                      <i className="h-1.5 w-1.5 rounded-full bg-white/55" />
                    </span>
                    <span className="absolute bottom-3 right-3 z-[1] text-2xl font-black leading-none tracking-[-0.02em] text-white">
                      {r.rate != null ? (
                        <>
                          ${r.rate}
                          <small className="text-sm font-bold opacity-90">/wk</small>
                        </>
                      ) : (
                        "See pricing"
                      )}
                    </span>
                  </div>
                  <div className="px-4 pb-1 pt-3.5">
                    <h3 className="text-lg font-extrabold leading-tight tracking-[-0.01em] text-ink">
                      {houseTitle(r.houseName)}
                    </h3>
                    <p className="mt-px flex items-center gap-1 text-[13.5px] text-muted">
                      <PinIcon />
                      {house ? submarketLabel(house) : r.area}
                    </p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {r.noMoveInFee && (
                        <span className="rounded-lg bg-brand px-[9px] py-1 text-xs font-bold text-white">No move-in fee</span>
                      )}
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className={
                            "rounded-lg px-[9px] py-1 text-xs font-semibold " +
                            (tag === "Shared bath" || tag === "Private bath"
                              ? "bg-ink font-bold text-white"
                              : "bg-slate-100 text-slate-700")
                          }
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 pb-3.5 pt-3">
                    <span className="text-[13px] text-muted">
                      <b className="text-ink">{r.total != null ? `$${r.total}` : "See pricing"}</b> to get the keys
                    </span>
                    <span className="rounded-[10px] bg-accent px-[18px] py-[9px] text-sm font-extrabold text-white shadow-[0_6px_14px_rgba(255,107,53,.3)]">
                      Apply
                    </span>
                  </div>
                </Link>
              );
            })}

            {visible.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-brand/30 bg-white/70 p-5 text-center md:col-span-2">
                <b className="text-base text-ink">No rooms at {priceLabel(budget)}</b>
                <p className="mt-1 text-[13.5px] text-muted">Raise the budget, or try a filter above.</p>
              </div>
            )}

            <a
              href="#filters"
              className="flex items-center justify-between gap-3 rounded-[20px] border-2 border-dashed border-brand/30 bg-white/60 p-[18px] md:col-span-2"
            >
              <span>
                <b className="block text-base font-extrabold text-ink">Don&apos;t see your fit?</b>
                <span className="text-[13.5px] font-semibold text-brand">
                  Try a filter above for more {market.metro} rooms
                </span>
              </span>
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand text-lg font-extrabold text-white">
                ↑
              </span>
            </a>
          </div>

          {soldOut.length > 0 && (
            <details className="group mt-4">
              <summary className="flex cursor-pointer list-none items-center gap-2 py-2.5 text-[13.5px] font-bold text-slate-700 [&::-webkit-details-marker]:hidden">
                {soldOut.length} more home{soldOut.length === 1 ? " is" : "s are"} full right now
                <span className="text-accent transition group-open:rotate-90">▸</span>
                <span className="hidden text-xs font-medium text-muted md:inline">
                  Call {site.phone} to ask about openings
                </span>
              </summary>
              <ul className="overflow-hidden rounded-[14px] bg-white shadow-card">
                {soldOut.map((h) => (
                  <li key={h.id} className="flex items-center justify-between border-t border-slate-100 px-3.5 py-2.5 first:border-t-0">
                    <div className="text-sm font-semibold text-ink">
                      {h.name}
                      <small className="block text-[12.5px] font-normal text-muted">{submarketLabel(h)}</small>
                    </div>
                    <a
                      href={phoneTelHref()}
                      className="rounded-[9px] border border-brand/35 bg-brand/[0.06] px-3 py-1.5 text-[12.5px] font-bold text-brand"
                    >
                      Call
                    </a>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>
    </>
  );
}

function houseTitle(name: string): string {
  if (/house$/i.test(name)) return /^the\s/i.test(name) ? name : `The ${name}`;
  return `The ${name} House`;
}

function featureTags(room: RoomListing, house: House | undefined): string[] {
  const tags = [room.bath === "private" ? "Private bath" : "Shared bath"];
  const amenities = (house?.amenities ?? []).join(" ").toLowerCase();
  if (/workspace/.test(amenities)) tags.push("Workspace");
  if (/smart tv/.test(amenities)) tags.push("Smart TV");
  if (tags.length < 3 && room.walkToBus) tags.push("Walk to bus");
  if (tags.length < 3 && /washer|laundry/.test(amenities)) tags.push("Free laundry");
  if (tags.length < 3) tags.push(room.walkToBus ? "Walk to bus" : "Drive or rideshare");
  return tags.slice(0, 3);
}

function FilterIcon({ name }: { name: "bath" | "people" | "home" | "bolt" | "fee" }) {
  if (name === "bolt") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" />
      </svg>
    );
  }
  if (name === "bath") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M4 12h16v2a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5v-2z" />
        <path d="M6 12V6a2 2 0 0 1 3.5-1.3" />
        <path d="M8 19l-1 2M16 19l1 2" />
      </svg>
    );
  }
  if (name === "people") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="8.5" cy="8" r="3" />
        <circle cx="16" cy="9" r="2.5" />
        <path d="M3 20a5.5 5.5 0 0 1 11 0M14 20a4 4 0 0 1 7-2.6" />
      </svg>
    );
  }
  if (name === "fee") {
    return (
      <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12.5l2.5 2.5L16 9.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-5h4v5" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 4h6v6" />
      <path d="M20 4l-9 9" />
      <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] text-accent" fill="currentColor">
      <path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z" />
    </svg>
  );
}
