import { getBrand } from "@/lib/brand";

export default function Footer() {
  const brand = getBrand();
  return (
    <footer className="mt-8 border-t border-slate-100 bg-white px-4 py-8 text-sm text-muted">
      <div className="mx-auto max-w-3xl">
        <div className="text-base font-extrabold text-ink">
          {brand.word}
          <span className="text-brand">For</span>Rent<span className="text-accent">ATL</span>
        </div>
        <p className="mt-1 max-w-md">{brand.tagline}</p>
        <p className="mt-3">
          Have a question? Tap{" "}
          <span className="font-semibold text-brand">“Have a question?”</span> at the top to chat with
          our assistant anytime.
        </p>
        <p className="mt-4 text-xs text-slate-400">
          © {brand.domain}. Pricing and availability update automatically and may change.
        </p>
      </div>
    </footer>
  );
}
