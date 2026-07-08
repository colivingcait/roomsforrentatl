import RentalsView from "@/components/RentalsView";

export const revalidate = 3600;

export const metadata = {
  title: "Furnished Private Rentals & Apartments for Rent in Atlanta, GA",
  description:
    "Furnished private rentals and apartments for rent in the Atlanta area — a full unit that's all yours, monthly lease, utilities included. Apply online today.",
};

// A units-only page (also the homepage on the homes brand).
export default function RentalsPage() {
  return <RentalsView />;
}
