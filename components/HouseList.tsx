"use client";

import { useMemo, useState } from "react";
import type { House } from "@/lib/types";
import HouseCard from "./HouseCard";

type Filter = "all" | "available";

export default function HouseList({ houses }: { houses: House[] }) {
  const [filter, setFilter] = useState<Filter>("available");
  const [hood, setHood] = useState<string>("all");

  const neighborhoods = useMemo(
    () => Array.from(new Set(houses.map((h) => h.neighborhood))).sort(),
    [houses]
  );

  const shown = useMemo(() => {
    return houses.filter((h) => {
      if (filter === "available" && !h.available) return false;
      if (hood !== "all" && h.neighborhood !== hood) return false;
      return true;
    });
  }, [houses, filter, hood]);

  const availableCount = houses.filter((h) => h.available).length;

  return (
    <section>
      <div className="sticky top-[57px] z-20 -mx-4 border-b border-slate-100 bg-slate-50/95 px-4 py-3 backdrop-blur">
        <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <FilterPill active={filter === "available"} onClick={() => setFilter("available")}>
            Available now ({availableCount})
          </FilterPill>
          <FilterPill active={filter === "all"} onClick={() => setFilter("all")}>
            All homes ({houses.length})
          </FilterPill>
          {neighborhoods.length > 1 && <div className="mx-1 w-px shrink-0 bg-slate-200" />}
          {neighborhoods.length > 1 && (
            <FilterPill active={hood === "all"} onClick={() => setHood("all")}>
              All areas
            </FilterPill>
          )}
          {neighborhoods.length > 1 &&
            neighborhoods.map((n) => (
              <FilterPill key={n} active={hood === n} onClick={() => setHood(n)}>
                {n}
              </FilterPill>
            ))}
        </div>
      </div>

      {shown.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold text-ink">No homes match that filter</p>
          <p className="mt-1 text-muted">Try “All homes” or a different area.</p>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {shown.map((h) => (
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
