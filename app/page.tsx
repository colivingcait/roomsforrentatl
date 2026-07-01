import RoomsHome from "@/components/RoomsHome";
import RentalsView from "@/components/RentalsView";
import { getBrand } from "@/lib/brand";

// Refreshed by the scraper; revalidate hourly as a backstop.
export const revalidate = 3600;

// One codebase, two brands: the homes domain serves the whole-apartment view,
// the rooms domain serves the co-living homepage.
export default function HomePage() {
  return getBrand().key === "homes" ? <RentalsView /> : <RoomsHome />;
}
