import Header from "@/components/Header";
import BrowseRooms from "@/components/BrowseRooms";
import CityList from "@/components/CityList";
import Footer from "@/components/Footer";
import PageFaq from "@/components/PageFaq";
import TrustBand from "@/components/TrustBand";
import { getHouses } from "@/lib/houses";
import { buildRoomListings } from "@/lib/browse";
import { getFilterStartingPrices } from "@/lib/filterPrices";
import { getMarket } from "@/lib/market";

/** The rooms-first homepage (roomsforrentatl.com). */
export default async function RoomsHome() {
  const allHouses = getHouses();
  const soldOut = allHouses.filter((h) => !h.available);
  const rooms = buildRoomListings(allHouses);
  const filterPrices = await getFilterStartingPrices();
  const market = getMarket();

  return (
    <main className="min-h-screen bg-white">
      <Header wide />
      <BrowseRooms rooms={rooms} soldOut={soldOut} houses={allHouses} filterPrices={filterPrices} />
      {market.showCityList ? <CityList /> : null}
      <TrustBand variant="band" />

      <section className="bg-white">
        <div className="mx-auto max-w-[1080px] px-[18px] py-[30px] md:px-6">
          <h2 className="text-[17px] font-extrabold text-ink">{market.seoHeading}</h2>
          <p className="mt-1.5 max-w-[720px] text-sm text-muted">{market.seoBody}</p>
        </div>
      </section>
      {market.showPageFaq ? <PageFaq /> : null}

      <Footer clearance />
    </main>
  );
}
