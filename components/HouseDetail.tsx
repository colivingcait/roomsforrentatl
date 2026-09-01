"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { House, Room } from "@/lib/types";
import { priceLabel, shortRoomName, moveInLabel } from "@/lib/format";
import { roomAnchorUrl, generalSearchUrl } from "@/lib/site";
import TrackedOutboundLink from "@/components/TrackedOutboundLink";
import { trackEvent } from "@/lib/analytics";

const APPLICATION_FEE = 19;

const CANT_DO = [
  { t: "Pets", b: "we're pet-free — search PadSplit's “Pets allowed” filter" },
  { t: "A partner", b: "one person per room here — search “Double occupancy”" },
  { t: "Kids", b: "adults only in our houses — search “Children allowed”" },
];

const HOUSE_RULE_BULLETS = [
  "Residents only — no guests, day or night",
  "Smoke-free indoors — step outside to smoke or vape",
  "Pet-free homes",
  "Quiet hours 9 PM to 9 AM",
  "Clean shared spaces as you go, dishes washed right after use",
  "Bring your own basics (toilet paper, paper towels, soap)",
  "No illegal activity, drugs, or weapons",
];

function bathCapacityLine(house: House): string {
  const total = house.totalRooms;
  const baths = house.totalBaths;
  const priv = house.privateBaths ?? 0;
  if (total == null || baths == null) return "Check the listing for the exact bathroom count.";
  if (priv === baths) return `${total} adults, and every room has its own private bathroom — no sharing.`;
  const sharedRooms = total - priv;
  const sharedBaths = baths - priv;
  const perBath = sharedBaths > 0 ? Math.round(sharedRooms / sharedBaths) : sharedRooms;
  const privNote = priv > 0 ? `, plus ${priv} room${priv === 1 ? "" : "s"} with its own private bath` : "";
  return `${total} adults, mixed ages and genders, all background-screened. ${sharedRooms} rooms share ${sharedBaths} bathroom${sharedBaths === 1 ? "" : "s"} (about ${perBath} people per bath)${privNote}.`;
}

export default function HouseDetail({ house, rooms }: { house: House; rooms: Room[] }) {
  const [selectedId, setSelectedId] = useState<number>(rooms[0]?.id);
  const selected = rooms.find((r) => r.id === selectedId) ?? rooms[0];

  const [income, setIncome] = useState(() => (selected?.weeklyRate ? selected.weeklyRate * 2 : 300));
  const [flags, setFlags] = useState({ felony: false, misd: false, evict: false });
  const [openPanel, setOpenPanel] = useState<string | null>(null);

  const pick = (r: Room) => {
    setSelectedId(r.id);
    if (r.weeklyRate) setIncome(r.weeklyRate * 2);
  };

  const total = selected?.weeklyRate != null ? selected.weeklyRate + APPLICATION_FEE : null;
  const anyFlag = flags.felony || flags.misd || flags.evict;
  const clearsBar = selected?.weeklyRate != null && income >= selected.weeklyRate * 2;

  const verdict = useMemo(() => {
    if (anyFlag) {
      return {
        title: "This one needs a human",
        color: "#92400E",
        body: "We review felonies, violent misdemeanors, and evictions from the past 7 years case by case — older than 7 years usually isn't a barrier on its own. Apply and let both teams take a look; your $19 is refunded if it doesn't work out.",
      };
    }
    if (clearsBar) {
      return {
        title: "You'd clear the income bar",
        color: "#065F46",
        body: `You'll need income of about ${priceLabel((selected?.weeklyRate ?? 0) * 2).replace("/wk", "/week")} — a pay stub, bank statement, or offer letter all work as proof.`,
      };
    }
    const cheaper = rooms
      .filter((r) => r.weeklyRate != null && income >= r.weeklyRate * 2)
      .sort((a, b) => (b.weeklyRate ?? 0) - (a.weeklyRate ?? 0))[0];
    if (cheaper && cheaper.id !== selected?.id) {
      return {
        title: `Try ${shortRoomName(cheaper)} instead`,
        color: "#991B1B",
        body: `At your income, ${shortRoomName(cheaper)} (${priceLabel(cheaper.weeklyRate as number)}) clears the bar. ${shortRoomName(selected as Room)} needs about ${priceLabel((selected?.weeklyRate ?? 0) * 2).replace("/wk", "/week")}.`,
      };
    }
    return {
      title: "Not quite there for these rooms",
      color: "#991B1B",
      body: `These rooms need income of about 2× the weekly rate. ${shortRoomName(selected as Room)} needs about ${priceLabel((selected?.weeklyRate ?? 0) * 2).replace("/wk", "/week")}.`,
    };
  }, [anyFlag, clearsBar, income, rooms, selected]);

  const panels: { key: string; q: string; body?: string; bullets?: string[]; steps?: string[] }[] = [
    {
      key: "cost",
      q: "What it costs, and when",
      bullets: [
        `$${APPLICATION_FEE} to apply, charged when you apply — refunded if you're not approved`,
        "First week's rent charged once you're approved by both PadSplit and the host team, not before",
        "No security deposit, no last month, no admin or move-in fee",
        "Rent recurs weekly, on a weekday you pick — utilities, WiFi, and laundry included",
      ],
    },
    {
      key: "apply",
      q: "How applying works — 6 steps, 10 minutes",
      steps: [
        `Pick a room here, tap Apply`,
        `You'll land on ${house.name}'s page on PadSplit — PadSplit links to the house, not the room`,
        `Select ${selected ? shortRoomName(selected) : "your room"} again over there, then Apply`,
        `Enter email and phone, finish the application (about 10 minutes). $${APPLICATION_FEE} is charged here`,
        "Our host team reviews — they may come back with questions",
        "Approved → first week charged → address and door code → move in next day",
      ],
    },
    {
      key: "why",
      q: "Why we book through PadSplit",
      bullets: [
        "Every resident in the house is screened, not just you",
        "Payments run through PadSplit — nothing handed to a person, everything's on the record",
        "On-time payments are reported and can build credit",
        "One free transfer if the house isn't right for you",
        "The one downside: PadSplit links to the house, not the room — that's step 3 above",
      ],
    },
    {
      key: "qualify",
      q: "Would I get approved?",
      body: "Income of about 2× the rent, no minimum credit score. No felonies, violent misdemeanors, or evictions in the past 7 years — older is usually fine, and anything inside 7 years is reviewed case by case. Upload a pay stub, bank statement, or offer letter. PadSplit screens automatically, then our host team reviews — usually the same day.",
    },
    {
      key: "who",
      q: "Who lives here, and what's shared",
      body: `${bathCapacityLine(house)} ${house.name === "Willow" ? "Two kitchens (upstairs and downstairs)" : "One kitchen"}, free laundry (one washer/dryer), driveway plus street parking. Bed linens aren't provided — bring sheets, a pillow, and towels. Central air is host-controlled.`,
    },
    {
      key: "rules",
      q: "House rules",
      bullets: HOUSE_RULE_BULLETS,
    },
    {
      key: "where",
      q: "Where is it, and can I see it first?",
      body: `${house.name} is in ${[house.neighborhood, house.city].filter(Boolean).join(", ")}. The exact street address is released after you're approved, so in-person tours happen after that. ${house.tourUrl ? "The 3D tour is the best way to see it before you apply." : "Photos are the best way to see it before you apply."}`,
    },
  ];

  return (
    <>
      <div className="mt-[14px] rounded-2xl bg-ink text-white">
        <div className="px-4 pb-3.5 pt-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.08em] text-white/55">Pick your room</div>
          <div className="mt-2.5 flex flex-col gap-[7px]">
            {rooms.map((r) => {
              const isSelected = r.id === selected?.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => pick(r)}
                  className={
                    "flex w-full items-center justify-between gap-2.5 rounded-xl border px-3.5 py-2.5 text-left transition " +
                    (isSelected ? "border-[#5EEAD4] bg-white/[0.12]" : "border-white/20 bg-transparent")
                  }
                >
                  <span>
                    <span className="block text-sm font-bold">{shortRoomName(r)}</span>
                    <span className="mt-px block text-xs text-white/60">
                      {r.bathroomType === "private" ? "Private bath" : "Shared bath"} · {moveInLabel(r.moveInDate)}
                    </span>
                  </span>
                  <span className="shrink-0 whitespace-nowrap text-base font-extrabold">
                    {r.weeklyRate != null ? priceLabel(r.weeklyRate) : "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-end justify-between gap-3.5 border-t border-white/10 px-4 pb-4 pt-3.5">
          <div className="text-xs leading-relaxed text-white/65">
            ${APPLICATION_FEE} to apply, refunded if declined
            <br />
            {selected?.weeklyRate != null ? priceLabel(selected.weeklyRate) : "—"} first week, charged on approval
            <br />
            $0 deposit
          </div>
          <div className="shrink-0 text-right">
            <div className="text-[11px] uppercase tracking-[0.06em] text-white/50">To get the keys</div>
            <div className="text-[26px] font-extrabold leading-tight">{total != null ? priceLabel(total).replace("/wk", "") : "—"}</div>
          </div>
        </div>
      </div>

      <div className="mt-3.5 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-baseline justify-between gap-3">
          <div className="text-sm font-bold text-ink">Check you&apos;d qualify — 5 seconds</div>
          <div className="text-[13px] font-extrabold" style={{ color: verdict.color }}>
            {verdict.title}
          </div>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="shrink-0 text-xs text-muted">Weekly income</span>
          <input
            type="range"
            min={150}
            max={900}
            step={10}
            value={income}
            onChange={(e) => setIncome(Number(e.target.value))}
            className="flex-1 accent-brand"
          />
          <span className="min-w-[48px] shrink-0 text-right text-[15px] font-extrabold text-ink">${income}</span>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted">Past 7 years:</span>
          {([
            ["felony", "Felony"],
            ["misd", "Violent misdemeanor"],
            ["evict", "Eviction"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setFlags((s) => ({ ...s, [key]: !s[key] }))}
              className={
                "rounded-full border px-2.5 py-1 text-xs font-semibold transition " +
                (flags[key] ? "border-ink bg-ink text-white" : "border-slate-200 bg-white text-slate-700")
              }
            >
              {label}
            </button>
          ))}
        </div>
        <p className="mt-2.5 text-[12.5px] leading-relaxed text-slate-600">{verdict.body}</p>
        <p className="mt-1.5 text-[11px] text-slate-400">
          Nothing here is submitted anywhere — it&apos;s just quick math in your browser.
        </p>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {panels.map((p) => {
          const open = openPanel === p.key;
          return (
            <div key={p.key} className="border-b border-slate-100 last:border-b-0">
              <button
                type="button"
                onClick={() => {
                  const next = open ? null : p.key;
                  setOpenPanel(next);
                  if (next) trackEvent("panel_opened", { row: p.q, house: house.id });
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-[13px] text-left text-[14.5px] font-semibold text-ink"
              >
                <span>{p.q}</span>
                <span className="text-lg leading-none text-slate-400">{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="px-4 pb-3.5">
                  {p.body && <p className="text-[13.5px] leading-relaxed text-slate-600">{p.body}</p>}
                  {p.bullets && (
                    <ul className="mt-2 flex flex-col gap-1.5">
                      {p.bullets.map((b) => (
                        <li key={b} className="flex gap-2 text-[13.5px] leading-relaxed text-ink">
                          <span className="font-extrabold text-brand">·</span>
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {p.steps && (
                    <ol className="mt-1 flex flex-col gap-2">
                      {p.steps.map((s, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand text-[11px] font-extrabold text-white">
                            {i + 1}
                          </span>
                          <span className="text-[13.5px] leading-relaxed text-ink">{s}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-[15px] font-extrabold text-ink">Bringing someone — or something — with you?</h2>
        <p className="mt-1.5 text-[13px] leading-relaxed text-slate-600">
          Our houses are pet-free, one person per room, adults only. Plenty of Atlanta homes on PadSplit aren&apos;t.
          Same application, same ${APPLICATION_FEE}, and you can filter for it in two taps:
        </p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {CANT_DO.map((c) => (
            <li key={c.t} className="flex gap-2.5 text-[13.5px] leading-relaxed">
              <span className="font-extrabold text-brand">→</span>
              <span>
                <strong>{c.t}</strong> — {c.b}
              </span>
            </li>
          ))}
        </ul>
        <TrackedOutboundLink
          href={generalSearchUrl()}
          event="general_search_click"
          properties={{ source: "house_page_dealbreaker", house: house.id }}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3.5 flex items-center justify-between gap-2.5 rounded-xl bg-brand px-3.5 py-3 text-sm font-bold text-white"
        >
          <span>Search all Atlanta rooms</span>
          <span aria-hidden>→</span>
        </TrackedOutboundLink>
        <p className="mt-2 text-xs leading-relaxed text-slate-400">
          Registered service animals are handled case by case here — ask the chat before you go elsewhere.
        </p>
      </div>

      <div
        data-bottom-bar
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur"
      >
        <div className="mx-auto max-w-3xl">
          {selected && (
            <TrackedOutboundLink
              href={roomAnchorUrl(house.padsplitUrl, selected.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-book block text-center"
              event="book_click"
              properties={{
                house: house.id,
                houseName: house.name,
                room: String(selected.id),
                roomTitle: shortRoomName(selected),
                source: "house_page",
              }}
            >
              Apply for {shortRoomName(selected)} — ${APPLICATION_FEE} now
            </TrackedOutboundLink>
          )}
          <p className="mb-3 mt-2 text-center text-xs leading-relaxed text-slate-400">
            Takes you to {house.name} on PadSplit — pick <strong className="text-slate-500">{selected ? shortRoomName(selected) : "your room"}</strong> again there, same room, same price.
          </p>
        </div>
      </div>
    </>
  );
}
