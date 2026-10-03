import Header from "@/components/Header";
import BrowseRooms from "@/components/BrowseRooms";
import Footer from "@/components/Footer";
import TrustBand from "@/components/TrustBand";
import { getHouses } from "@/lib/houses";
import { buildRoomListings } from "@/lib/browse";

/** The rooms-first homepage (roomsforrentatl.com). */
export default function RoomsHome() {
  const allHouses = getHouses();
  const soldOut = allHouses.filter((h) => !h.available);
  const rooms = buildRoomListings(allHouses);

  return (
    <main className="min-h-screen bg-white">
      <Header wide />
      <BrowseRooms rooms={rooms} soldOut={soldOut} houses={allHouses} />
      <TrustBand variant="band" />

      <section className="bg-white">
        <div className="mx-auto max-w-[1080px] px-[18px] py-[30px] md:px-6">
          <h2 className="text-[17px] font-extrabold text-ink">Furnished rooms for rent in Atlanta, GA</h2>
          <p className="mt-1.5 max-w-[720px] text-sm text-muted">
            Looking for an affordable room in Atlanta? We have furnished private bedrooms in shared homes across
            Decatur, Stone Mountain, Snellville and South Atlanta, with no long lease and weekly or biweekly pay.
            Every furnished room on this site is booked through PadSplit, with utilities and Wi-Fi included. Once
            you&apos;re approved, you can move in as soon as the next day.
          </p>
        </div>
      </section>

      <Footer clearance />
    </main>
  );
}
