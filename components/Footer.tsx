import { getBrand } from "@/lib/brand";
import { phoneTelHref, site } from "@/lib/site";

export default function Footer({ clearance = false }: { clearance?: boolean }) {
  const brand = getBrand();
  const rooms = brand.key === "rooms";
  const sister = rooms
    ? null
    : { label: "Looking for a single room?", name: "RoomsForRentATL.com", url: "https://roomsforrentatl.com" };

  return (
    <footer
      className={
        "border-t border-[#F1F5F9] text-sm text-muted " +
        (rooms ? "bg-[#F8FAFC]" : "mt-8 bg-white")
      }
    >
      <div
        className={
          rooms
            ? "mx-auto max-w-[1080px] px-[18px] pb-[110px] pt-[30px] md:px-6 md:pb-11"
            : "mx-auto max-w-3xl px-4 py-8" + (clearance ? " pb-28 md:pb-11" : "")
        }
      >
        <div className="text-base font-extrabold text-ink">
          {brand.word}
          <span className="text-brand">For</span>Rent<span className="text-accent">ATL</span>
        </div>
        <p className="mt-1 max-w-md">
          {rooms ? "Furnished rooms for rent in Atlanta. Move in as soon as tomorrow." : brand.tagline}
        </p>
        <p className="mt-3">
          Have a question? Tap <span className="font-semibold text-brand">“Have a question?”</span>
          {rooms ? " to chat with our assistant anytime." : " at the top to chat with our assistant anytime."}
        </p>
        {rooms && (
          <p className="mt-3">
            Questions? Call{" "}
            <a href={phoneTelHref()} className="font-semibold text-brand underline">
              {site.phone}
            </a>{" "}
            <span className="text-[12.5px] text-slate-400">(calls only, no texts)</span>
          </p>
        )}
        {sister && (
          <p className="mt-3">
            {sister.label}{" "}
            <a href={sister.url} className="font-semibold text-brand underline">
              {sister.name} →
            </a>
          </p>
        )}
        <p className="mt-4 text-xs text-slate-400">
          © {brand.domain}. Pricing and availability update automatically and may change.
        </p>
      </div>
    </footer>
  );
}
