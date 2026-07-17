import Header from "@/components/Header";
import Footer from "@/components/Footer";
import UnitsSection from "@/components/UnitsSection";
import QualificationsSection from "@/components/QualificationsSection";
import { getUnits } from "@/lib/units";

/**
 * The whole-apartment view — used both at /rentals and as the homepage on the
 * homes brand (homesforrentatl.com). No room/co-living messaging.
 */
export default function RentalsView() {
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
            Furnished rentals <span className="text-accent">in Atlanta.</span>
          </h1>
          <p className="mt-2 max-w-md text-white/80">
            Your own private space — a full unit that&apos;s all yours. Monthly lease, utilities included.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-white/90">
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Fully furnished</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Utilities included</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Apply online</span>
          </div>
        </div>
      </section>

      <UnitsSection units={units} />

      <QualificationsSection />

      <section className="mx-auto max-w-3xl px-4 py-6">
        <h2 className="text-lg font-bold text-ink">Furnished apartments for rent in Atlanta, GA</h2>
        <p className="mt-2 text-sm text-muted">
          Looking for a furnished apartment or studio for rent in Atlanta? Our private, fully furnished units in
          Snellville and Decatur come with utilities included and a straightforward monthly lease — no roommates, no
          shared spaces, just your own place. Apply online through TurboTenant and move in on your schedule.
        </p>
      </section>

      <Footer />
    </main>
  );
}
