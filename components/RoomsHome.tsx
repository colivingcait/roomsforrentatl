import Header from "@/components/Header";
import HouseList from "@/components/HouseList";
import HouseCard from "@/components/HouseCard";
import Footer from "@/components/Footer";
import StickyChatBar from "@/components/StickyChatBar";
import NearestHomeFinder from "@/components/NearestHomeFinder";
import TrustBand from "@/components/TrustBand";
import { getHouses, lastUpdated } from "@/lib/houses";
import { getColivingHouses } from "@/lib/coliving";
import { updatedLabel } from "@/lib/format";

/** The rooms-first homepage (roomsforrentatl.com). */
export default function RoomsHome() {
  // Explicit homepage order for the co-living cards. Any home not listed falls to the end.
  const ORDER = ["mora", "candace", "raven", "chestnut", "meadow"];
  const rank = (name: string) => {
    const i = ORDER.findIndex((n) => name.toLowerCase().includes(n));
    return i === -1 ? ORDER.length : i;
  };
  const allHouses = getHouses();
  const houses = allHouses.filter((h) => h.available).sort((a, b) => rank(a.name) - rank(b.name));
  const fullyOccupied = allHouses.filter((h) => !h.available);
  const colivingHouses = getColivingHouses();
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
        </div>
      </section>

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

      {fullyOccupied.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 pb-6">
          <h2 className="text-lg font-bold text-ink">Fully occupied right now</h2>
          <p className="mt-1 text-sm text-muted">
            These homes don&apos;t have any open rooms at the moment — check back soon!
          </p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fullyOccupied.map((h) => (
              <HouseCard key={h.id} house={h} />
            ))}
          </div>
        </section>
      )}

      <Footer />
      {/* Clearance so the mobile sticky bar never covers the footer. */}
      <div className="h-24 sm:hidden" />

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur sm:hidden">
        <StickyChatBar />
      </div>
    </main>
  );
}
