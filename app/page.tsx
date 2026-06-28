import Header from "@/components/Header";
import RoomList from "@/components/RoomList";
import Footer from "@/components/Footer";
import { getListings } from "@/lib/listings";
import { site } from "@/lib/site";

// Re-pull live PadSplit pricing/availability at most once every 15 minutes.
// This is the "scheduled auto-pull": the page is cached and only refreshes on
// this cadence (or when /api/cron/refresh is hit).
export const revalidate = 900;

export default async function HomePage() {
  const listings = await getListings();

  return (
    <main className="min-h-screen">
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-b from-brand to-brand-dark px-4 pb-8 pt-7 text-white">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            ● Atlanta · Updated live
          </span>
          <h1 className="mt-3 text-3xl font-extrabold leading-tight sm:text-4xl">
            Furnished rooms for rent. <br className="hidden sm:block" />
            Move in <span className="text-accent">today.</span>
          </h1>
          <p className="mt-2 max-w-md text-white/80">
            All-in weekly pricing — utilities &amp; WiFi included. Browse what’s open right now and
            book in minutes.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-sm font-medium text-white/90">
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ No long lease</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Fully furnished</span>
            <span className="rounded-lg bg-white/10 px-3 py-1.5">✓ Bills included</span>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pb-24 pt-2">
        <RoomList listings={listings} />
      </div>

      <Footer />

      {/* Persistent help CTA for fast movers */}
      <div className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 px-4 pt-3 backdrop-blur sm:hidden">
        <a href={site.phoneHref} className="btn-book w-full">
          Need help today? Call / Text us
        </a>
      </div>
    </main>
  );
}
