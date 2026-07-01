import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UnitsSection from "@/components/UnitsSection";
import { getUnits } from "@/lib/units";

export const revalidate = 3600;

export const metadata = {
  title: "Private Apartments for Rent in Atlanta | RoomsForRentATL",
  description:
    "Whole furnished apartments for rent in the Atlanta area — monthly lease, utilities included, private kitchen & bath. Apply online through TurboTenant.",
};

// A units-only landing page for long-term (whole-apartment) leads, so an
// inquiry about a whole place never lands on the room-focused homepage.
export default function RentalsPage() {
  const units = getUnits();

  return (
    <main className="min-h-screen">
      <Header />

      <section className="bg-gradient-to-b from-slate-800 to-slate-900 px-4 pb-9 pt-8 text-white">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            ● Atlanta · Long-term rentals
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Whole apartments for rent. <br className="hidden sm:block" />
            <span className="text-accent">Your own private space.</span>
          </h1>
          <p className="mt-2 max-w-md text-white/80">
            Furnished private units on a monthly lease — your own kitchen, bath, and entrance. Utilities included, and
            you apply online in minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-white/90">
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Fully furnished</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Utilities included</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Apply online</span>
          </div>
        </div>
      </section>

      <UnitsSection units={units} />

      <Footer />
    </main>
  );
}
