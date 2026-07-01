import RentalsView from "@/components/RentalsView";

export const revalidate = 3600;

export const metadata = {
  title: "Private Apartments for Rent in Atlanta",
  description:
    "Whole furnished apartments for rent in the Atlanta area — monthly lease, utilities included, private kitchen & bath. Apply online through TurboTenant.",
};

// A units-only page (also the homepage on the homes brand).
export default function RentalsPage() {
  return <RentalsView />;
}
