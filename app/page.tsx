import Header from "@/components/Header";
import HouseList from "@/components/HouseList";
import Footer from "@/components/Footer";
import FaqButton from "@/components/FaqButton";
import UnitsSection from "@/components/UnitsSection";
import TrustBand from "@/components/TrustBand";
import { getHouses, lastUpdated } from "@/lib/houses";
import { getUnits } from "@/lib/units";
import { updatedLabel } from "@/lib/format";

// The data file is refreshed daily by the scraper (committed → redeploy). We
// also revalidate hourly as a backstop.
export const revalidate = 3600;

export default function HomePage() {
  // Only show co-living homes that have rooms available — fully-booked homes
  // drop off the homepage entirely.
  const houses = getHouses().filter((h) => h.available);
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

      {/* Co-living rooms section header */}
      <section className="mx-auto max-w-3xl px-4 pt-5">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-brand px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-white">
            Co-living
          </span>
          <h2 className="text-lg font-extrabold text-ink">Rooms for rent</h2>
        </div>
        <p className="mt-1.5 text-sm text-muted">
          A private room in a fully-furnished shared home — weekly all-in pricing with utilities &amp; WiFi included,
          and next-day move-in.
        </p>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-2 pt-2">
        <HouseList houses={houses} />
      </div>

      <UnitsSection units={units} />

      <TrustBand />

      <Footer />
      {/* Clearance so the mobile sticky bar never covers the footer. */}
      <div className="h-24 sm:hidden" />

      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur sm:hidden">
        <FaqButton
          className="btn-book chat-attn w-full"
          label="💬 Have a question? Chat with us"
          startTab="chat"
        />
      </div>
    </main>
  );
}
