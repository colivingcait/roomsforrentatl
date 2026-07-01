"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { House, ColivingHouse } from "@/lib/types";
import { fromPriceLabel, availabilityLabel, priceLabel } from "@/lib/format";
import { availableColivingRooms, colivingFromPrice } from "@/lib/coliving";

/**
 * Neighborhood-level map of houses. We plot a soft circle at each house's
 * approximate neighborhood center (never the street address) and cap the zoom
 * so the exact location can't be pinpointed. Willow (non-PadSplit co-living)
 * plots alongside in its own color, linking to its own page.
 */
export default function HousesMap({
  houses,
  colivingHouses = [],
}: {
  houses: House[];
  colivingHouses?: ColivingHouse[];
}) {
  const elRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const layerRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default ?? (await import("leaflet"));
      if (cancelled || !elRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(elRef.current, {
          scrollWheelZoom: false,
          maxZoom: 14, // never zoom to street level — neighborhood only
        });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap contributors",
          maxZoom: 18,
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;

      if (layerRef.current) layerRef.current.remove();
      const group = L.featureGroup();

      const pts = houses.filter((h) => typeof h.lat === "number" && typeof h.lng === "number");
      for (const h of pts) {
        const color = h.available ? "#0E7C66" : "#94A3B8";
        L.circleMarker([h.lat as number, h.lng as number], {
          radius: 13,
          color,
          weight: 2,
          fillColor: h.available ? "#13A083" : "#CBD5E1",
          fillOpacity: 0.55,
        })
          .bindPopup(
            `<div style="min-width:160px">
               <strong>${escapeHtml(h.name)}</strong><br/>
               <span style="color:#64748B">${escapeHtml(h.city)}</span><br/>
               ${h.available ? availabilityLabel(h) : "Fully booked"} · ${fromPriceLabel(h)}<br/>
               <a href="/house/${h.id}" style="color:#0E7C66;font-weight:600">View home →</a>
             </div>`
          )
          .addTo(group);
      }

      const colivingPts = colivingHouses.filter(
        (h) => typeof h.lat === "number" && typeof h.lng === "number"
      );
      for (const h of colivingPts) {
        const rooms = availableColivingRooms(h);
        const from = colivingFromPrice(h);
        L.circleMarker([h.lat as number, h.lng as number], {
          radius: 13,
          color: "#D97706", // amber, to visually match the "Not on PadSplit" tag
          weight: 2,
          fillColor: "#F59E0B",
          fillOpacity: 0.55,
        })
          .bindPopup(
            `<div style="min-width:160px">
               <strong>${escapeHtml(h.name)}</strong><br/>
               <span style="color:#64748B">${escapeHtml(h.city)}</span><br/>
               ${rooms.length} room${rooms.length === 1 ? "" : "s"} available${
              from != null ? ` · from ${escapeHtml(priceLabel(from, h.rentUnit))}` : ""
            }<br/>
               <a href="/coliving/${h.id}" style="color:#0E7C66;font-weight:600">View home →</a>
             </div>`
          )
          .addTo(group);
      }

      group.addTo(map);
      layerRef.current = group;

      const totalPts = pts.length + colivingPts.length;
      if (totalPts) map.fitBounds(group.getBounds().pad(0.6), { maxZoom: 13 });
      else map.setView([33.749, -84.388], 11); // Atlanta fallback
    })();

    return () => {
      cancelled = true;
    };
  }, [houses, colivingHouses]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200">
      <div ref={elRef} className="h-[60vh] w-full" />
      <p className="bg-slate-50 px-3 py-2 text-xs text-slate-400">
        Pins show the general neighborhood only — exact addresses are shared after you book or apply.
      </p>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}
