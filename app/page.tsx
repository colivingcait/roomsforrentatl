import { notFound } from "next/navigation";
import RoomsHome from "@/components/RoomsHome";
import { getBrand } from "@/lib/brand";

// Refreshed by the scraper; revalidate hourly as a backstop.
export const revalidate = 3600;

// The homes brand was the long-term rental catalog. Those pages are unpublished.
export default function HomePage() {
  if (getBrand().key === "homes") notFound();
  return <RoomsHome />;
}
