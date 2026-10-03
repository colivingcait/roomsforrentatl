import RentalsView from "@/components/RentalsView";
import { getMarket } from "@/lib/market";
import type { Metadata } from "next";

export const revalidate = 3600;

export function generateMetadata(): Metadata {
  const market = getMarket();
  if (!market.homesRentalsTitle) {
    return { title: "Not found", robots: { index: false, follow: false } };
  }
  return {
    title: market.homesRentalsTitle,
    description: market.homesRentalsDescription,
  };
}

// A units-only page (also the homepage on the homes brand).
export default function RentalsPage() {
  return <RentalsView />;
}
