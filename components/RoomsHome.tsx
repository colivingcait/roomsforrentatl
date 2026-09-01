import Header from "@/components/Header";
import BrowseRooms from "@/components/BrowseRooms";
import Footer from "@/components/Footer";
import StickyChatBar from "@/components/StickyChatBar";
import TrustBand from "@/components/TrustBand";
import UnitsSection from "@/components/UnitsSection";
import TrackedOutboundLink from "@/components/TrackedOutboundLink";
import { getHouses, lastUpdated } from "@/lib/houses";
import { buildRoomListings } from "@/lib/browse";
import { getUnits } from "@/lib/units";
import { updatedLabel } from "@/lib/format";
import { generalSearchUrl } from "@/lib/site";

/** The rooms-first homepage (roomsforrentatl.com). */
export default function RoomsHome() {
  const allHouses = getHouses();
  const soldOut = allHouses.filter((h) => !h.available);
  const rooms = buildRoomListings(allHouses);
  const units = getUnits();
  const updated = updatedLabel(lastUpdated());

  return (
    <main className="min-h-screen">
      <Header />

      <BrowseRooms rooms={rooms} soldOut={soldOut} updated={updated} />

      <div className="mx-auto max-w-3xl px-4">
        <TrackedOutboundLink
          href={generalSearchUrl()}
          event="general_search_click"
          properties={{ source: "homepage" }}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-xl border border-brand/30 bg-brand/5 px-4 py-3 font-semibold text-brand active:scale-[0.99]"
        >
          <span>Don&apos;t see what you&apos;re looking for? Find more options here</span>
          <span aria-hidden>→</span>
        </TrackedOutboundLink>
      </div>

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
