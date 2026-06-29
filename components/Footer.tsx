import { site } from "@/lib/site";

export default function Footer() {
  return (
    <footer className="mt-8 border-t border-slate-100 bg-white px-4 py-8 text-sm text-muted">
      <div className="mx-auto max-w-3xl">
        <div className="text-base font-extrabold text-ink">
          Rooms<span className="text-brand">For</span>Rent<span className="text-accent">ATL</span>
        </div>
        <p className="mt-1 max-w-md">{site.tagline}</p>
        <p className="mt-3">
          Questions or want a room today?{" "}
          <a href={site.smsHref} className="font-semibold text-brand">
            Text us
          </a>{" "}
          or{" "}
          <a href={site.phoneHref} className="font-semibold text-brand">
            call {site.phone}
          </a>
        </p>
        <p className="mt-4 text-xs text-slate-400">
          © {site.domain}. Rooms are listed and booked through PadSplit. Pricing and availability
          update automatically and may change.
        </p>
      </div>
    </footer>
  );
}
