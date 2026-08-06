import Image from "next/image";
import Link from "next/link";
import Header from "@/components/Header";
import HouseList from "@/components/HouseList";
import Footer from "@/components/Footer";
import StickyChatBar from "@/components/StickyChatBar";
import NearestHomeFinder from "@/components/NearestHomeFinder";
import TrustBand from "@/components/TrustBand";
import UnitsSection from "@/components/UnitsSection";
import TrackedOutboundLink from "@/components/TrackedOutboundLink";
import { getHouses, lastUpdated } from "@/lib/houses";
import { getColivingHouses } from "@/lib/coliving";
import { getUnits } from "@/lib/units";
import { updatedLabel } from "@/lib/format";
import { generalSearchUrl } from "@/lib/site";

/** The rooms-first homepage (roomsforrentatl.com). */
export default function RoomsHome() {
  // Explicit homepage order for the co-living cards. Any home not listed falls to the end.
  const ORDER = ["willow", "mora", "candace", "raven", "chestnut", "meadow"];
  const rank = (name: string) => {
    const i = ORDER.findIndex((n) => name.toLowerCase().includes(n));
    return i === -1 ? ORDER.length : i;
  };
  const allHouses = getHouses();
  const houses = allHouses.filter((h) => h.available).sort((a, b) => rank(a.name) - rank(b.name));
  const fullyOccupied = allHouses.filter((h) => !h.available).sort((a, b) => rank(a.name) - rank(b.name));
  const colivingHouses = getColivingHouses();
  const units = getUnits();
  const updated = updatedLabel(lastUpdated());
  const openCount = houses.length;
  const totalRooms = houses.reduce((n, h) => n + h.roomsAvailable, 0);

  return (
    <main className="min-h-screen">
      <Header />

      <section className="bg-gradient-to-b from-brand to-brand-dark px-4 pb-8 pt-7 text-white">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            ● Atlanta{updated ? ` · ${updated}` : ""}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Furnished rooms for rent. <br className="hidden sm:block" />
            <span className="text-accent">Next-day move-in.</span>
          </h1>
          <p className="mt-2 max-w-md text-white/80">
            {totalRooms > 0
              ? `${totalRooms} room${totalRooms === 1 ? "" : "s"} open right now across ${openCount} Atlanta home${openCount === 1 ? "" : "s"}.`
              : "Browse furnished Atlanta homes."}{" "}
            All-in weekly pricing — utilities &amp; WiFi included.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-white/90">
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Flexible lease</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Fully furnished</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Utilities included</span>
          </div>
        </div>
      </section>

      <NearestHomeFinder />

      {/* Co-living rooms section */}
      <section className="mx-auto max-w-3xl px-4 pt-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-ink px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Co-living
            </span>
            <h2 className="text-lg font-extrabold text-ink">Furnished rooms for rent</h2>
          </div>
          <p className="mt-1.5 text-sm text-muted">
            A private furnished room in a shared home — weekly all-in pricing with utilities &amp; WiFi included. Ready
            for next-day move-in!
          </p>

          <div className="mt-4">
            <HouseList houses={houses} colivingHouses={colivingHouses} />
          </div>

          {fullyOccupied.length > 0 && (
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-4">
              {fullyOccupied.map((h) => (
                <Link
                  key={h.id}
                  href={`/house/${h.id}`}
                  className="flex items-center gap-3 rounded-xl bg-slate-50 p-2 opacity-70 grayscale transition active:scale-[0.99]"
                >
                  <div className="relative h-10 w-14 shrink-0 overflow-hidden rounded-lg bg-slate-200">
                    <Image src={h.image} alt={h.name} fill sizes="56px" className="object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{h.name}</p>
                    <p className="text-xs text-muted">{h.city}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    Fully Occupied
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm text-muted">
            Don&apos;t see what you&apos;re looking for?{" "}
            <TrackedOutboundLink
              href={generalSearchUrl()}
              event="general_search_click"
              properties={{ source: "homepage" }}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-brand"
            >
              See other options on PadSplit →
            </TrackedOutboundLink>
          </div>
        </div>
      </section>

      <UnitsSection units={units} />

      <TrustBand />

      <section className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="text-lg font-bold text-ink">Furnished rooms for rent in Atlanta, GA</h2>
        <p className="mt-2 text-sm text-muted">
          Looking for an affordable room for rent in Atlanta? We offer furnished private bedrooms in shared homes
          across Decatur, Stone Mountain, Snellville, and South Atlanta — all with weekly, no-lease rent. Every
          PadSplit room includes utilities and WiFi, with next-day move-in once you&apos;re approved. It&apos;s
          flexible co-living made simple: no long lease, no big deposit, just a private room ready when you are.
        </p>
      </section>

      <Footer />
      {/* Clearance so the mobile sticky bar never covers the footer. */}
      <div className="h-24 sm:hidden" />

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur sm:hidden">
        <StickyChatBar />
      </div>
    </main>
  );
}
