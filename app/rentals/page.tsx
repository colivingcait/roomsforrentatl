import RentalsView from "@/components/RentalsView";

export const revalidate = 3600;

export const metadata = {
  title: "Private Rentals in Atlanta",
  description:
    "Furnished private rentals in the Atlanta area — a full unit that's all yours. Monthly lease, utilities included, apply online through TurboTenant.",
};

// A units-only page (also the homepage on the homes brand).
export default function RentalsPage() {
  return <RentalsView />;
}
