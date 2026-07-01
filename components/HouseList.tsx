"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { House, ColivingHouse } from "@/lib/types";
import HouseCard from "./HouseCard";
import { ColivingHouseCard } from "./ColivingSection";

// Leaflet touches `window`, so load the map client-side only.
const HousesMap = dynamic(() => import("./HousesMap"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[60vh] place-items-center rounded-2xl border border-slate-200 bg-slate-100 text-muted">
      Loading map…
    </div>
  ),
});

type View = "list" | "map";

export default function HouseList({
  houses,
  colivingHouses = [],
}: {
  houses: House[];
  colivingHouses?: ColivingHouse[];
}) {
  const [city, setCity] = useState<string>("all");
  const [view, setView] = useState<View>("list");

  const cities = useMemo(
    () =>
      Array.from(
        new Set([...houses.map((h) => h.city), ...colivingHouses.map((h) => h.city)])
      ).sort(),
    [houses, colivingHouses]
  );

  const shown = useMemo(
    () => houses.filter((h) => city === "all" || h.city === city),
    [houses, city]
  );

  const shownColiving = useMemo(
    () => colivingHouses.filter((h) => city === "all" || h.city === city),
    [colivingHouses, city]
  );

  const totalShown = shown.length + shownColiving.length;

  return (
    <section>
      {cities.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterPill active={city === "all"} onClick={() => setCity("all")}>
            All cities
          </FilterPill>
          {cities.map((c) => (
            <FilterPill key={c} active={city === c} onClick={() => setCity(c)}>
              {c}
            </FilterPill>
          ))}
        </div>
      )}

      {/* List / Map toggle */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm font-medium text-muted">
          {totalShown} {totalShown === 1 ? "home" : "homes"}
        </p>
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          <ViewTab active={view === "list"} onClick={() => setView("list")}>
            List
          </ViewTab>
          <ViewTab active={view === "map"} onClick={() => setView("map")}>
            Map
          </ViewTab>
        </div>
      </div>

      {totalShown === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-ink">No homes match that filter</p>
          <p className="mt-1 text-muted">Try “All homes” or a different area.</p>
        </div>
      ) : view === "map" ? (
        <div className="mt-3">
          <HousesMap houses={shown} colivingHouses={shownColiving} />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Pinned home first (Mora), then Willow & other co-living houses, then the rest. */}
          {shown.slice(0, 1).map((h) => (
            <HouseCard key={h.id} house={h} />
          ))}
          {shownColiving.map((h) => (
            <ColivingHouseCard key={`cl-${h.id}`} house={h} />
          ))}
          {shown.slice(1).map((h) => (
            <HouseCard key={h.id} house={h} />
          ))}
        </div>
      )}
    </section>
  );
}

function FilterPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition " +
        (active
          ? "bg-brand text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-700 active:scale-95")
      }
    >
      {children}
    </button>
  );
}

function ViewTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded-lg px-4 py-1.5 text-sm font-semibold transition " +
        (active ? "bg-brand text-white" : "text-slate-600")
      }
    >
      {children}
    </button>
  );
}
